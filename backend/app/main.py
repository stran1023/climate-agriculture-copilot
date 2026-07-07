from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models.schemas import DailyBriefing

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

    TODO: replace each stub below with real calls to
    services/weather_client.py, services/snowflake_client.py, and
    services/cortex_agent_client.py as those get wired up.
    """
    # 1. ingest weather for each farm (stub)
    # 2. write readings to Snowflake (stub)
    # 3. ask FARM_OPS_AGENT to assess risk + recommend actions (stub)
    # 4. create work orders in Snowflake for high-risk farms (stub)
    # 5. assemble + return briefing
    return DailyBriefing(
        date="2026-07-08T00:00:00",
        farms_assessed=0,
        high_risk_farms=[],
        work_orders_created=[],
        summary="Workflow not yet wired up — replace stubs in main.py",
    )
