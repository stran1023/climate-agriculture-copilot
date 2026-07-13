from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models.schemas import DailyBriefing
from app.services import cortex_agent_client, snowflake_client, weather_client

app = FastAPI(title="Climate-Adaptive Agriculture Copilot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/workflow/run", response_model=DailyBriefing)
async def run_daily_workflow():
    """
    The core demo endpoint. Chains:
    ingest weather -> write to Snowflake -> ask Cortex Agent for risk +
    recommendations -> create work orders -> return briefing.

    TODO: steps 4-5 are still stubbed pending feat-004/feat-006.
    """
    # 1. ingest weather for each farm
    farms = snowflake_client.run_query(
        "SELECT FARM_ID, NAME, LAT, LON FROM FARMS"
    )
    readings = []
    for farm in farms:
        reading = await weather_client.get_today_reading(farm["LAT"], farm["LON"])
        readings.append((farm["FARM_ID"], reading))

    # 2. write readings to Snowflake
    if readings:
        snowflake_client.execute_many(
            "INSERT INTO WEATHER_READINGS "
            "(farm_id, ts, rainfall_mm, temp_c, humidity_pct, source) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            [
                (
                    farm_id,
                    reading["ts"],
                    reading["rainfall_mm"],
                    reading["temp_c"],
                    reading["humidity_pct"],
                    "open-meteo",
                )
                for farm_id, reading in readings
            ],
        )

    # 3. ask FARM_OPS_AGENT to assess risk + recommend actions
    narrative = await cortex_agent_client.ask_agent(
        "Which farms are currently at high or critical flood, drought, or "
        "disease risk, and what actions do you recommend? List each "
        "at-risk farm by name."
    )
    high_risk_farms = [
        str(farm["FARM_ID"]) for farm in farms if farm["NAME"] in narrative
    ]

    # 4. create work orders in Snowflake for high-risk farms (stub)
    # 5. assemble + return briefing
    return DailyBriefing(
        date=datetime.now(timezone.utc),
        farms_assessed=len(farms),
        high_risk_farms=high_risk_farms,
        work_orders_created=[],
        summary=narrative,
    )
