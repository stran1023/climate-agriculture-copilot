import re
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models.schemas import BriefingToday, DailyBriefing, Recommendation
from app.services import (
    asset_simulator,
    cortex_agent_client,
    recommendation_parser,
    risk_engine,
    snowflake_client,
    weather_client,
)

app = FastAPI(title="FarmTwin AI Copilot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


def _latest_reading(asset_id: str) -> dict | None:
    rows = snowflake_client.run_query(
        "SELECT * FROM ASSET_READINGS WHERE ASSET_ID = %s ORDER BY TS DESC LIMIT 1",
        (asset_id,),
    )
    if not rows:
        return None
    row = rows[0]
    return {field: row[field.upper()] for field in asset_simulator.ALL_READING_FIELDS}


def _insert_reading(asset_id: str, ts: datetime, reading: dict) -> None:
    columns = ["asset_id", "ts"] + asset_simulator.ALL_READING_FIELDS
    placeholders = ", ".join(["%s"] * len(columns))
    values = (asset_id, ts, *(reading.get(field) for field in asset_simulator.ALL_READING_FIELDS))
    snowflake_client.execute(
        f"INSERT INTO ASSET_READINGS ({', '.join(columns)}) VALUES ({placeholders})",
        values,
    )


def _insert_risk(asset_id: str, ts: datetime, risk_type: str, risk_level: str, notes: str) -> None:
    snowflake_client.execute(
        "INSERT INTO ASSET_RISK_ASSESSMENTS (asset_id, ts, risk_type, risk_level, notes) "
        "VALUES (%s, %s, %s, %s, %s)",
        (asset_id, ts, risk_type, risk_level, notes),
    )


def _recommendation_id(asset_id: str, ts: datetime, idx: int) -> str:
    return f"{asset_id}-REC-{ts.strftime('%Y%m%dT%H%M%S')}-{idx}"


_MARKDOWN_HEADING_RE = re.compile(r"^#{1,6}\s", re.MULTILINE)


def _clean_agent_answer(text: str) -> str:
    """FARM_OPS_AGENT's response can include its own tool-call narration
    ("Let me query...") ahead of the real answer -- strip that narration so
    it doesn't leak into summaries. Observed in two shapes across calls: an
    explicit <answer> tag, or (more often) narration that just runs
    straight into the first markdown heading with no tag at all -- handle
    both rather than assuming either is guaranteed."""
    if "<answer>" in text:
        return text.split("<answer>", 1)[1].strip()
    match = _MARKDOWN_HEADING_RE.search(text)
    if match:
        return text[match.start():].strip()
    return text.strip()


@app.post("/workflow/run", response_model=DailyBriefing)
async def run_daily_workflow():
    """
    The core demo endpoint, run once per asset per call: Observe (simulate
    + persist the next sensor reading) -> Understand (rule-based risk
    assessment) -> Recommend (real Cortex Agent call for at-risk assets,
    parsed into structured 6-field recommendations) -> Predict (trend
    projection vs. the previous reading, stored alongside the current risk
    assessment).
    """
    now = datetime.now(timezone.utc)

    # Observe: farm-wide weather (one location now, not per-asset)
    weather = await weather_client.get_today_reading(settings.farm_lat, settings.farm_lon)
    snowflake_client.execute(
        "INSERT INTO WEATHER_READINGS (ts, rainfall_mm, temp_c, humidity_pct, wind_speed_kmh, source) "
        "VALUES (%s, %s, %s, %s, %s, %s)",
        (
            weather["ts"],
            weather["rainfall_mm"],
            weather["temp_c"],
            weather["humidity_pct"],
            weather["wind_speed_kmh"],
            "open-meteo",
        ),
    )

    assets = snowflake_client.run_query("SELECT ASSET_ID, ASSET_TYPE, NAME FROM FARM_ASSETS ORDER BY ASSET_ID")

    high_risk_assets: list[str] = []
    recommendations_created: list[Recommendation] = []
    narrative_parts: list[str] = []

    for asset in assets:
        asset_id, asset_type, name = asset["ASSET_ID"], asset["ASSET_TYPE"], asset["NAME"]

        # Observe
        previous = _latest_reading(asset_id)
        reading = asset_simulator.next_reading(asset_type, previous)
        _insert_reading(asset_id, now, reading)

        # Understand
        risk_type, risk_level, notes = risk_engine.assess_risk(asset_type, reading)
        _insert_risk(asset_id, now, risk_type, risk_level, notes)

        if risk_level == "low":
            continue
        high_risk_assets.append(asset_id)

        # Predict
        prediction = risk_engine.predict_trend(risk_type, reading, previous)
        if prediction:
            _insert_risk(asset_id, now, f"{risk_type}_forecast_24h", risk_level, prediction)

        # Recommend -- real Cortex Agent call, grounded in this asset's current state
        prompt = (
            f"Assess {name} ({asset_id}, a {asset_type.replace('_', ' ')}) current condition "
            f"and give your recommendations in the required 6-field format."
        )
        agent_text = _clean_agent_answer(await cortex_agent_client.ask_agent(prompt))
        narrative_parts.append(f"{name}: {agent_text[:280]}")

        for idx, rec in enumerate(recommendation_parser.parse_recommendations(agent_text), start=1):
            rec_id = _recommendation_id(asset_id, now, idx)
            snowflake_client.execute(
                "INSERT INTO RECOMMENDATIONS (recommendation_id, asset_id, created_at, recommendation, "
                "reason, evidence, priority, expected_impact, confidence_pct, status) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (
                    rec_id,
                    asset_id,
                    now,
                    rec["recommendation"],
                    rec["reason"],
                    rec["evidence"],
                    rec["priority"],
                    rec["expected_impact"],
                    rec["confidence_pct"],
                    "pending_approval",
                ),
            )
            recommendations_created.append(
                Recommendation(
                    recommendation_id=rec_id,
                    asset_id=asset_id,
                    created_at=now,
                    recommendation=rec["recommendation"],
                    reason=rec["reason"],
                    evidence=rec["evidence"],
                    priority=rec["priority"],
                    expected_impact=rec["expected_impact"],
                    confidence_pct=rec["confidence_pct"],
                    status="pending_approval",
                )
            )

    summary = (
        f"Assessed {len(assets)} assets; {len(high_risk_assets)} flagged at medium+ risk "
        f"with {len(recommendations_created)} new recommendation(s) pending approval."
    )
    if narrative_parts:
        summary += " " + " ".join(narrative_parts)

    return DailyBriefing(
        date=now,
        assets_assessed=len(assets),
        high_risk_assets=high_risk_assets,
        recommendations_created=recommendations_created,
        summary=summary,
    )


@app.get("/briefing/today", response_model=BriefingToday)
async def get_briefing_today():
    """TODO(feat-013): rebuild against RECOMMENDATIONS once feat-013 lands."""
    return BriefingToday(
        date=datetime.now(timezone.utc),
        approved_recommendations=[],
        rejected_recommendations=[],
        summary="Stubbed pending feat-013 (rebuilt against RECOMMENDATIONS).",
    )
