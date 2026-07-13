# Architecture & scope decisions

> **2026-07-14 pivot:** this project rebuilt around `docs/FarmTwin-AI-Copilot.md`
> — a single mixed farm with heterogeneous **Farm Assets** (Fish Pond, Chicken
> Coop, Rice Field, Fruit Orchard) rendered as an isometric digital twin, with
> an AI Copilot as the primary product surface. This replaces the prior
> rice-cooperative build (15 separate rice farms on a real OpenStreetMap,
> `feat-001` through `feat-007`, all previously `passing`). That build's full
> evidence trail is preserved in `progress.md` under "Legacy: rice-cooperative
> build (superseded 2026-07-14)" — nothing was deleted, the roadmap just moved
> forward. See `feature_list.json` for the current active features.

## Why the pivot

The original build proved the real, end-to-end loop (weather → Snowflake →
Cortex Agent → work order → approval → briefing) across many identical rice
farms. `docs/FarmTwin-AI-Copilot.md` asks for a different shape: **one** farm
with **heterogeneous** assets, framed explicitly as "decision intelligence,"
not monitoring — every AI output must carry Recommendation / Reason /
Evidence / Priority / Expected Impact / Confidence, not a free-text
narrative. The two data models (many identical rice plots vs. one farm with
four different asset types) don't reconcile without a schema rewrite, so this
is a full pivot rather than an additive layer. Decisions below were confirmed
with the user on 2026-07-14.

## What's real vs. planned for the new build

| Piece                              | Status                                       |
|-------------------------------------|-----------------------------------------------|
| Weather ingestion (Open-Meteo)      | Real (carried over, farm-wide instead of per-plot) |
| Snowflake tables + writes           | To rebuild — see schema below                |
| Cortex Agent, structured output     | To rebuild — 6-field recommendation format   |
| Simulated per-asset sensor data     | To build — no physical IoT, must "behave realistically over time" per the vision doc |
| Recommendation approve/reject       | Carried over conceptually, rebuilt on the new `RECOMMENDATIONS` table |
| Isometric digital twin map          | To build — replaces the real Leaflet/OpenStreetMap view (`feat-007`, superseded) |
| AI Copilot as centerpiece           | To build — the vision doc's core requirement: "The application should never feel like a dashboard with a chatbot attached." |

## Farm Assets (replaces the 15-rice-farm model)

One farm, four asset instances for the hackathon build:

- Fish Pond
- Chicken Coop
- Rice Field
- Fruit Orchard

Future assets should be addable without a schema change to the core tables
(new `asset_type` value + new nullable columns on `ASSET_READINGS` as
needed) — see `docs/FarmTwin-AI-Copilot.md`'s "Future Features."

## Snowflake schema (target — rebuild via CoCo, see `snowflake/coco-prompts.md`)

| Table | Columns | Notes |
|---|---|---|
| `FARM_ASSETS` | `asset_id` PK, `asset_type`, `name`, `grid_x`, `grid_y`, `install_date` | Replaces `FARMS`. `grid_x`/`grid_y` position the asset on the isometric map. |
| `WEATHER_READINGS` | `ts`, `rainfall_mm`, `temp_c`, `humidity_pct`, `wind_speed_kmh`, `source` | Farm-wide now (one location), not per-farm-id. |
| `ASSET_READINGS` | `asset_id`, `ts`, + per-type nullable columns: `water_temp_c`/`ph`/`dissolved_oxygen_mg_l`/`feed_level_pct`/`biomass_kg` (fish pond), `air_temp_c`/`humidity_pct`/`water_l`/`egg_count` (chicken coop), `growth_stage`/`soil_moisture_pct`/`nitrogen_ppm`/`irrigation_status` (rice field), `growth_stage`/`soil_moisture_pct`/`disease_risk_pct`/`harvest_readiness_pct` (orchard) | Replaces `SENSOR_READINGS`. One wide table (mirrors the existing `WEATHER_READINGS` pattern) rather than 4 separate tables, so the semantic view can join asset readings uniformly regardless of type. |
| `ASSET_RISK_ASSESSMENTS` | `asset_id`, `ts`, `risk_type`, `risk_level`, `notes` | Replaces `RISK_ASSESSMENTS`. `risk_type` is now free-form per asset (e.g. `flood`, `drought`, `disease`, `water_quality`, `feed_shortage`) instead of the fixed flood/drought/disease triad. |
| `RECOMMENDATIONS` | `recommendation_id` PK, `asset_id`, `created_at`, `recommendation`, `reason`, `evidence`, `priority`, `expected_impact`, `confidence_pct`, `status`, `approved_by`, `approved_at` | Replaces `WORK_ORDERS`. Structured 6-field format is mandatory per the vision doc; `status`/`approved_by`/`approved_at` carry over the real approve/reject write-back loop. |
| `ASSET_HISTORY` | `asset_id`, `period_label`, `metric_name`, `metric_value`, `notes` | Replaces `CROP_HISTORY`, generalized to any asset (rice/orchard yield, chicken egg production, fish harvest biomass). |

**Scope decision — no separate `ALERTS` or `TASKS` tables.** The vision doc
lists Alerts and Tasks alongside Recommendations as things "Snowflake
stores," but for this build both are derived rather than stored
separately, to avoid duplicating state that already lives in
`ASSET_RISK_ASSESSMENTS` and `RECOMMENDATIONS`:

- **Active Alerts** = latest `ASSET_RISK_ASSESSMENTS` rows at `high`/`critical`.
- **Tasks Due Today** = `RECOMMENDATIONS` rows with `status = 'pending_approval'`.

Revisit this if a future session finds a real need for alert/task state that
doesn't map cleanly to those two tables (e.g. non-AI-generated routine
chores).

## Flow

```
Simulation engine (per-asset realistic time-series) + Open-Meteo (farm weather)
        │
        ▼
FastAPI /workflow/run — Observe → Understand → Recommend → Predict
        │
        ▼
Snowflake OPS schema (ASSET_READINGS, WEATHER_READINGS, ASSET_RISK_ASSESSMENTS)
        │
        ▼
Cortex Agent (structured recommendation: Recommendation/Reason/Evidence/
Priority/Expected Impact/Confidence)
        │
        ▼
RECOMMENDATIONS (pending_approval)
        │
        ▼
Next.js: isometric digital twin home → asset detail → AI Copilot panel →
approve/reject
        │
        ▼
GET /briefing/today → daily briefing
```

Full screen-by-screen breakdown and the target API contract live in
`docs/ui-build-plan.md`.

## Why this scope

Per `docs/FarmTwin-AI-Copilot.md`'s "Important Development Rules": the AI is
always the main feature, and every feature should belong to one of Observe /
Understand / Recommend / Predict. The four-asset digital twin gives the demo
visual variety (pond/coop/field/orchard) without the complexity of a
multi-tenant or multi-farm model. One real farm, four real asset types,
fully simulated sensor data, one Cortex Agent producing structured,
explainable recommendations — that beats a wide dashboard for judging, same
reasoning as the original build's scope call.
