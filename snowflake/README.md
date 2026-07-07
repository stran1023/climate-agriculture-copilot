# Snowflake side — built with CoCo CLI

This folder tracks what we asked Snowflake CoCo CLI to build, so the judging
panel (and future us) can see the actual CoCo interaction, not just the
end result.

## Workflow

1. Launch CoCo in this repo's `snowflake/` directory: `cortex`
2. Set your connection: `cortex connections set <name>`
3. Paste prompts from `coco-prompts.md` one at a time, in order
4. After each meaningful step, copy the prompt + a summary of what CoCo did
   into `coco-prompts.md` under "Session log"
5. If CoCo generates SQL you want to keep permanently (DDL, seed data), save
   it into this folder as a plain `.sql` file too — CoCo's own session
   history is local and not part of the repo

## What we're building here

- `CLIMATE_AG_COPILOT` database, `OPS` schema
- Tables: `FARMS`, `WEATHER_READINGS`, `SENSOR_READINGS`, `RISK_ASSESSMENTS`,
  `WORK_ORDERS`, `CROP_HISTORY`
- A Cortex Search service over historical agronomy notes (optional stretch)
- A semantic view over `FARMS` + `RISK_ASSESSMENTS` + `WORK_ORDERS`
- A Cortex Agent (`FARM_OPS_AGENT`) grounded on that semantic view, which the
  FastAPI backend calls to turn structured risk data into recommendations

See `coco-prompts.md` for the exact prompts.
