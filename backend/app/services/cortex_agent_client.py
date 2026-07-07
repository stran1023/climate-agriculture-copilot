"""Calls the Cortex Agent (FARM_OPS_AGENT) that we built via CoCo CLI.

TODO: fill in the exact REST endpoint + payload shape from Snowflake's
Cortex Agents REST API docs once the agent is created (see
snowflake/coco-prompts.md, step 4). This is a placeholder showing the
intended call shape so the rest of the workflow can be wired up in
parallel.
"""

import httpx

from app.config import settings

CORTEX_AGENT_ENDPOINT = (
    f"https://{settings.snowflake_account}.snowflakecomputing.com"
    "/api/v2/cortex/agent:run"
)


async def ask_agent(prompt: str) -> str:
    headers = {
        "Authorization": f"Bearer {settings.snowflake_pat}",
        "Content-Type": "application/json",
    }
    payload = {
        "agent": "FARM_OPS_AGENT",
        "database": settings.snowflake_database,
        "schema": settings.snowflake_schema,
        "messages": [{"role": "user", "content": prompt}],
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(CORTEX_AGENT_ENDPOINT, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        return data.get("content", "")
