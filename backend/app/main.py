import re
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models.schemas import (
    ApprovalRequest,
    AssetDetail,
    AssetHistory,
    AssetOverview,
    AssetReading,
    AssetRisk,
    AssetStatusSummary,
    BriefingToday,
    CopilotAnswer,
    CopilotQuestion,
    DailyBriefing,
    DashboardSummary,
    Recommendation,
    WeatherReading,
)
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
_NARRATION_LEAD_INS = (
    "I'll ", "I will ", "Let me ", "Let's ", "I'm going to ",
    "I have the ", "I have a ", "I've got the ",
)
_SENTENCE_END_RE = re.compile(r"[.!?]")


def _strip_narration_prefix(text: str) -> str:
    """Repeatedly strip leading tool-planning sentences ("I'll query...",
    "Let me check...") for the case where the agent emits no structural
    marker at all (no <answer> tag, no markdown heading) -- these sentences
    are sometimes joined with no separating whitespace, so this cuts at the
    first sentence-ending punctuation rather than assuming a trailing
    space."""
    while any(text.startswith(lead) for lead in _NARRATION_LEAD_INS):
        match = _SENTENCE_END_RE.search(text)
        if not match:
            break
        text = text[match.end():].lstrip()
    return text


def _clean_agent_answer(text: str) -> str:
    """FARM_OPS_AGENT's response can include its own tool-call narration
    ahead of the real answer -- strip that narration so it doesn't leak
    into summaries. Observed in three shapes across calls: an explicit
    <answer> tag, narration running straight into the first markdown
    heading with no tag, or narration with neither marker at all -- handle
    all three rather than assuming any one is guaranteed."""
    if "<answer>" in text:
        text = text.split("<answer>", 1)[1]
    else:
        match = _MARKDOWN_HEADING_RE.search(text)
        if match:
            text = text[match.start():]
    return _strip_narration_prefix(text.strip())


_RISK_HEALTH_SCORE = {"low": 90, "medium": 60, "high": 35, "critical": 10}
_RISK_STATUS = {"low": "healthy", "medium": "needs_attention", "high": "critical", "critical": "critical"}
_PRIORITY_RANK = {"low": 0, "medium": 1, "high": 2}


def _health_score(risk_level: str) -> int:
    return _RISK_HEALTH_SCORE.get(risk_level, 50)


def _asset_status(risk_level: str) -> str:
    return _RISK_STATUS.get(risk_level, "needs_attention")


def _recommendation_from_row(row: dict) -> Recommendation:
    return Recommendation(
        recommendation_id=row["RECOMMENDATION_ID"],
        asset_id=row["ASSET_ID"],
        created_at=row["CREATED_AT"],
        recommendation=row["RECOMMENDATION"],
        reason=row["REASON"],
        evidence=row["EVIDENCE"],
        priority=row["PRIORITY"],
        expected_impact=row["EXPECTED_IMPACT"],
        confidence_pct=row["CONFIDENCE_PCT"],
        status=row["STATUS"],
        approved_by=row["APPROVED_BY"],
        approved_at=row["APPROVED_AT"],
    )


def _asset_risk_from_row(row: dict) -> AssetRisk:
    return AssetRisk(
        asset_id=row["ASSET_ID"],
        ts=row["TS"],
        risk_type=row["RISK_TYPE"],
        risk_level=row["RISK_LEVEL"],
        notes=row["NOTES"],
    )


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
    rows = snowflake_client.run_query(
        "SELECT * FROM RECOMMENDATIONS "
        "WHERE STATUS IN ('approved', 'rejected') AND DATE(APPROVED_AT) = CURRENT_DATE() "
        "ORDER BY APPROVED_AT DESC"
    )
    approved = [_recommendation_from_row(r) for r in rows if r["STATUS"] == "approved"]
    rejected = [_recommendation_from_row(r) for r in rows if r["STATUS"] == "rejected"]

    if not rows:
        summary = "No recommendations were approved or rejected today."
    else:
        raw = await cortex_agent_client.ask_agent(
            "In 3-5 sentences, summarize today's approved and rejected recommendations "
            "and the risks driving them across all farm assets."
        )
        summary = _clean_agent_answer(raw)

    return BriefingToday(
        date=datetime.now(timezone.utc),
        approved_recommendations=approved,
        rejected_recommendations=rejected,
        summary=summary,
    )


@app.get("/assets", response_model=list[AssetOverview])
def get_assets():
    rows = snowflake_client.run_query(
        "WITH latest_risk AS ("
        "  SELECT ASSET_ID, RISK_LEVEL, NOTES FROM ASSET_RISK_ASSESSMENTS "
        "  WHERE RISK_TYPE NOT LIKE '%%_forecast_24h' "
        "  QUALIFY ROW_NUMBER() OVER (PARTITION BY ASSET_ID ORDER BY TS DESC) = 1"
        "), latest_reading AS ("
        "  SELECT ASSET_ID, GROWTH_STAGE, IRRIGATION_STATUS, HARVEST_READINESS_PCT FROM ASSET_READINGS "
        "  QUALIFY ROW_NUMBER() OVER (PARTITION BY ASSET_ID ORDER BY TS DESC) = 1"
        ") "
        "SELECT a.ASSET_ID, a.ASSET_TYPE, a.NAME, a.GRID_X, a.GRID_Y, r.RISK_LEVEL, r.NOTES, "
        "       rd.GROWTH_STAGE, rd.IRRIGATION_STATUS, rd.HARVEST_READINESS_PCT "
        "FROM FARM_ASSETS a "
        "LEFT JOIN latest_risk r ON r.ASSET_ID = a.ASSET_ID "
        "LEFT JOIN latest_reading rd ON rd.ASSET_ID = a.ASSET_ID "
        "ORDER BY a.ASSET_ID"
    )
    overviews = []
    for row in rows:
        risk_level = (row["RISK_LEVEL"] or "low").lower()
        overviews.append(
            AssetOverview(
                asset_id=row["ASSET_ID"],
                asset_type=row["ASSET_TYPE"],
                name=row["NAME"],
                grid_x=row["GRID_X"],
                grid_y=row["GRID_Y"],
                risk_level=risk_level,
                health_score=_health_score(risk_level),
                status=_asset_status(risk_level),
                latest_alert=row["NOTES"] if risk_level != "low" else None,
                growth_stage=row["GROWTH_STAGE"],
                irrigation_status=row["IRRIGATION_STATUS"],
                harvest_readiness_pct=row["HARVEST_READINESS_PCT"],
            )
        )
    return overviews


@app.get("/assets/{asset_id}", response_model=AssetDetail)
def get_asset_detail(asset_id: str):
    asset_rows = snowflake_client.run_query("SELECT * FROM FARM_ASSETS WHERE ASSET_ID = %s", (asset_id,))
    if not asset_rows:
        raise HTTPException(status_code=404, detail=f"No asset found with id {asset_id}")
    asset_row = asset_rows[0]

    reading_rows = snowflake_client.run_query(
        "SELECT * FROM ASSET_READINGS WHERE ASSET_ID = %s ORDER BY TS DESC LIMIT 1", (asset_id,)
    )
    latest_reading = None
    if reading_rows:
        r = reading_rows[0]
        latest_reading = AssetReading(
            asset_id=r["ASSET_ID"],
            ts=r["TS"],
            **{field: r[field.upper()] for field in asset_simulator.ALL_READING_FIELDS},
        )

    risk_rows = snowflake_client.run_query(
        "SELECT * FROM ASSET_RISK_ASSESSMENTS WHERE ASSET_ID = %s AND RISK_TYPE NOT LIKE '%%_forecast_24h' "
        "ORDER BY TS DESC LIMIT 1",
        (asset_id,),
    )
    latest_risk = _asset_risk_from_row(risk_rows[0]) if risk_rows else None

    prediction_rows = snowflake_client.run_query(
        "SELECT * FROM ASSET_RISK_ASSESSMENTS WHERE ASSET_ID = %s AND RISK_TYPE LIKE '%%_forecast_24h' "
        "ORDER BY TS DESC LIMIT 1",
        (asset_id,),
    )
    prediction = _asset_risk_from_row(prediction_rows[0]) if prediction_rows else None

    history_rows = snowflake_client.run_query(
        "SELECT * FROM ASSET_HISTORY WHERE ASSET_ID = %s ORDER BY PERIOD_LABEL", (asset_id,)
    )
    history = [
        AssetHistory(
            asset_id=h["ASSET_ID"],
            period_label=h["PERIOD_LABEL"],
            metric_name=h["METRIC_NAME"],
            metric_value=h["METRIC_VALUE"],
            notes=h["NOTES"],
        )
        for h in history_rows
    ]

    risk_level = latest_risk.risk_level if latest_risk else "low"
    overview = AssetOverview(
        asset_id=asset_row["ASSET_ID"],
        asset_type=asset_row["ASSET_TYPE"],
        name=asset_row["NAME"],
        grid_x=asset_row["GRID_X"],
        grid_y=asset_row["GRID_Y"],
        risk_level=risk_level,
        health_score=_health_score(risk_level),
        status=_asset_status(risk_level),
        latest_alert=latest_risk.notes if latest_risk and risk_level != "low" else None,
    )

    return AssetDetail(
        asset=overview,
        latest_reading=latest_reading,
        latest_risk=latest_risk,
        prediction=prediction,
        history=history,
    )


@app.get("/assets/{asset_id}/recommendations", response_model=list[Recommendation])
def get_asset_recommendations(asset_id: str):
    asset_rows = snowflake_client.run_query("SELECT ASSET_ID FROM FARM_ASSETS WHERE ASSET_ID = %s", (asset_id,))
    if not asset_rows:
        raise HTTPException(status_code=404, detail=f"No asset found with id {asset_id}")
    rows = snowflake_client.run_query(
        "SELECT * FROM RECOMMENDATIONS WHERE ASSET_ID = %s AND STATUS = 'pending_approval' "
        "ORDER BY CREATED_AT DESC",
        (asset_id,),
    )
    return [_recommendation_from_row(r) for r in rows]


def _set_recommendation_status(recommendation_id: str, status: str, approved_by: str) -> Recommendation:
    rowcount = snowflake_client.execute(
        "UPDATE RECOMMENDATIONS SET STATUS = %s, APPROVED_BY = %s, APPROVED_AT = %s WHERE RECOMMENDATION_ID = %s",
        (status, approved_by, datetime.now(timezone.utc), recommendation_id),
    )
    if rowcount == 0:
        raise HTTPException(status_code=404, detail=f"No recommendation found with id {recommendation_id}")
    row = snowflake_client.run_query(
        "SELECT * FROM RECOMMENDATIONS WHERE RECOMMENDATION_ID = %s", (recommendation_id,)
    )[0]
    return _recommendation_from_row(row)


@app.post("/recommendations/{recommendation_id}/approve", response_model=Recommendation)
def approve_recommendation(recommendation_id: str, body: ApprovalRequest = ApprovalRequest()):
    return _set_recommendation_status(recommendation_id, "approved", body.approved_by)


@app.post("/recommendations/{recommendation_id}/reject", response_model=Recommendation)
def reject_recommendation(recommendation_id: str, body: ApprovalRequest = ApprovalRequest()):
    return _set_recommendation_status(recommendation_id, "rejected", body.approved_by)


@app.get("/dashboard/summary", response_model=DashboardSummary)
def get_dashboard_summary():
    asset_rows = snowflake_client.run_query(
        "SELECT a.ASSET_ID, a.ASSET_TYPE, a.NAME, r.RISK_LEVEL "
        "FROM FARM_ASSETS a "
        "LEFT JOIN ASSET_RISK_ASSESSMENTS r "
        "  ON r.ASSET_ID = a.ASSET_ID AND r.RISK_TYPE NOT LIKE '%%_forecast_24h' "
        "QUALIFY ROW_NUMBER() OVER (PARTITION BY a.ASSET_ID ORDER BY r.TS DESC) = 1 "
        "ORDER BY a.ASSET_ID"
    )
    assets: list[AssetStatusSummary] = []
    scores: list[int] = []
    for row in asset_rows:
        risk_level = (row["RISK_LEVEL"] or "low").lower()
        score = _health_score(risk_level)
        scores.append(score)
        assets.append(
            AssetStatusSummary(
                asset_id=row["ASSET_ID"],
                asset_type=row["ASSET_TYPE"],
                name=row["NAME"],
                health_score=score,
                status=_asset_status(risk_level),
            )
        )
    farm_health_score = round(sum(scores) / len(scores)) if scores else 0

    alert_rows = snowflake_client.run_query(
        "SELECT * FROM ASSET_RISK_ASSESSMENTS "
        "WHERE RISK_LEVEL IN ('high', 'critical') AND RISK_TYPE NOT LIKE '%%_forecast_24h' "
        "QUALIFY ROW_NUMBER() OVER (PARTITION BY ASSET_ID ORDER BY TS DESC) = 1 "
        "ORDER BY TS DESC"
    )
    active_alerts = [_asset_risk_from_row(r) for r in alert_rows]

    task_rows = snowflake_client.run_query(
        "SELECT * FROM RECOMMENDATIONS WHERE STATUS = 'pending_approval' ORDER BY CREATED_AT DESC"
    )
    tasks_due_today = [_recommendation_from_row(r) for r in task_rows]
    top_recommendations = sorted(
        tasks_due_today,
        key=lambda r: (_PRIORITY_RANK.get(r.priority, 0), r.confidence_pct),
        reverse=True,
    )[:5]

    weather_rows = snowflake_client.run_query("SELECT * FROM WEATHER_READINGS ORDER BY TS DESC LIMIT 1")
    weather = None
    if weather_rows:
        w = weather_rows[0]
        weather = WeatherReading(
            ts=w["TS"],
            rainfall_mm=w["RAINFALL_MM"],
            temp_c=w["TEMP_C"],
            humidity_pct=w["HUMIDITY_PCT"],
            wind_speed_kmh=w["WIND_SPEED_KMH"],
            source=w["SOURCE"],
        )

    return DashboardSummary(
        date=datetime.now(timezone.utc),
        farm_health_score=farm_health_score,
        active_alerts=active_alerts,
        tasks_due_today=tasks_due_today,
        asset_count=len(assets),
        weather=weather,
        top_recommendations=top_recommendations,
        assets=assets,
    )


@app.post("/copilot/ask", response_model=CopilotAnswer)
async def ask_copilot(body: CopilotQuestion):
    """Free-form Q&A, grounded in the farm's real current state via the
    same semantic view /workflow/run and /briefing/today use. Per
    docs/FarmTwin-AI-Copilot.md's 'Decision Intelligence' principle, every
    answer should end with a concrete next step, not just an observation."""
    prompt = (
        f"{body.question}\n\n"
        "Ground your answer in this farm's actual current data (assets, sensor readings, "
        "risk assessments, recommendations, and history) via the semantic view -- never give "
        "generic agricultural advice that isn't tied to this farm's real state. End your answer "
        "with a concrete, actionable next step."
    )
    raw = await cortex_agent_client.ask_agent(prompt)
    return CopilotAnswer(question=body.question, answer=_clean_agent_answer(raw))
