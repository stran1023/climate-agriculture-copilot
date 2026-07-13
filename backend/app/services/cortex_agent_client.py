"""Calls the Cortex Agent (FARM_OPS_AGENT) that we built via CoCo CLI.

Endpoint + payload shape confirmed against Snowflake's Cortex Agents Run
API docs (agent object variant, since FARM_OPS_AGENT is a named agent
created via CREATE AGENT — see snowflake/coco-prompts.md, step 4):
https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents-run
"""

import httpx

from app.config import settings

AGENT_NAME = "FARM_OPS_AGENT"

CORTEX_AGENT_ENDPOINT = (
    f"https://{settings.snowflake_account}.snowflakecomputing.com/api/v2/databases/"
    f"{settings.snowflake_database}/schemas/{settings.snowflake_schema}/agents/{AGENT_NAME}:run"
)


async def ask_agent(prompt: str) -> str:
    """Send a user prompt to FARM_OPS_AGENT and return its final text response."""
    headers = {
        "Authorization": f"Bearer {settings.snowflake_pat}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    payload = {
        "messages": [{"role": "user", "content": [{"type": "text", "text": prompt}]}],
        "stream": False,
    }
    async with httpx.AsyncClient(timeout=90.0) as client:
        resp = await client.post(CORTEX_AGENT_ENDPOINT, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        return "".join(
            item["text"] for item in data.get("content", []) if item.get("type") == "text"
        )
