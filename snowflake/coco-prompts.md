# CoCo CLI prompt log

Paste each prompt you send CoCo here before running it, then fill in the
"Result" line after. Keep this updated live during the hackathon — it's your
evidence trail.

> **2026-07-14 pivot:** Part 1 below (prompts 1–5) built the original
> rice-cooperative schema and was fully run and verified — kept as a true
> historical record, not re-run. The project has since pivoted to
> `docs/FarmTwin-AI-Copilot.md` (single farm, 4 heterogeneous Farm Assets).
> **Part 2** below drafts the new prompts for that schema — none have been
> run yet (`feat-008`/`feat-009` in `feature_list.json`). Running Part 2's
> first prompt will `DROP`/replace the Part 1 tables on the live account —
> confirm with the user before executing it.

## Part 1 — rice-cooperative build (superseded 2026-07-14, kept as history)

## 1. Database + warehouse setup

```
Set up a database called CLIMATE_AG_COPILOT with schema OPS and a small
warehouse called CLIMATE_AG_WH. Create tables for FARMS (farm_id, name,
lat, lon, crop_type, planting_date, area_hectares), WEATHER_READINGS
(farm_id, ts, rainfall_mm, temp_c, humidity_pct, source), SENSOR_READINGS
(farm_id, ts, soil_moisture_pct, water_level_cm), RISK_ASSESSMENTS
(farm_id, ts, flood_risk, drought_risk, disease_risk, notes),
WORK_ORDERS (work_order_id, farm_id, created_at, action, status,
approved_by, approved_at), and CROP_HISTORY (farm_id, season_year,
crop_type, planting_date, harvest_date, yield_kg_per_hectare, notes).
```

Result:
* All objects are created:

  ┌────────────────────────┬─────────────────────────────────────────────────────────────────────────────────┐
  │ Object                 │ Status                                                                          │
  ├────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ CLIMATE_AG_WH          │ XSmall warehouse, auto-suspend 60s                                              │
  ├────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ CLIMATE_AG_COPILOT.OPS │ Database + schema                                                               │
  ├────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ FARMS                  │ farm_id PK, name, lat, lon, crop_type, planting_date, area_hectares             │
  ├────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ WEATHER_READINGS       │ farm_id, ts, rainfall_mm, temp_c, humidity_pct, source                          │
  ├────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ SENSOR_READINGS        │ farm_id, ts, soil_moisture_pct, water_level_cm                                  │
  ├────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ RISK_ASSESSMENTS       │ farm_id, ts, flood_risk, drought_risk, disease_risk, notes                      │
  ├────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ WORK_ORDERS            │ work_order_id PK, farm_id, created_at, action, status, approved_by, approved_at │
  └────────────────────────┴─────────────────────────────────────────────────────────────────────────────────┘

## 2. Seed data

```
Generate realistic sample data for 15 rice farms in the Mekong Delta,
with 30 days of daily weather and sensor readings each, including a few
farms that show a clear flood-risk pattern in the last week of data. Also
generate 3 prior seasons of CROP_HISTORY per farm, with at least one farm
showing a clear yield drop in a season that had a flood or drought event.
```

Result: 
All data is loaded. Here's the summary:

  ┌──────────────────┬──────┬───────────────────────────────────────────────────────────────┐
  │ Table            │ Rows │ Notes                                                         │
  ├──────────────────┼──────┼───────────────────────────────────────────────────────────────┤
  │ FARMS            │ 15   │ Mekong Delta rice farms (lat ~9.6-10.3, lon ~105.4-106.2)     │
  ├──────────────────┼──────┼───────────────────────────────────────────────────────────────┤
  │ WEATHER_READINGS │ 450  │ 30 days × 15 farms                                            │
  ├──────────────────┼──────┼───────────────────────────────────────────────────────────────┤
  │ SENSOR_READINGS  │ 450  │ 30 days × 15 farms                                            │
  ├──────────────────┼──────┼───────────────────────────────────────────────────────────────┤
  │ RISK_ASSESSMENTS │ 72   │ Weekly for normal farms; daily for flood farms in last 7 days │
  ├──────────────────┼──────┼───────────────────────────────────────────────────────────────┤
  │ CROP_HISTORY     │ 45   │ 3 seasons × 15 farms                                          │
  └──────────────────┴──────┴───────────────────────────────────────────────────────────────┘

  Flood-risk pattern (farms 1-4, last 7 days):

  • Rainfall escalates from ~50mm to 125mm/day
  • Soil moisture saturates to 95-98%
  • Water level rises from ~50cm to 95cm+
  • Risk escalates: MEDIUM → HIGH → CRITICAL

  Yield-drop story (farm 3):

  • Winter-Spring 2024: 6.8 t/ha (excellent)
  • Summer-Autumn 2024: 6.4 t/ha (normal)
  • Autumn-Winter 2024: 2.1 t/ha — severe flood event, 60% crop loss, field submerged 8 days

  Farm 9 also shows a drought-related dip (5.8 → 3.9 → 5.6 t/ha) in Summer-Autumn 2024.

## 3. Semantic view

```
Build a semantic view over FARMS, RISK_ASSESSMENTS, WORK_ORDERS, and
CROP_HISTORY that lets me ask questions like "which farms are at high
flood risk this week", "how many work orders are pending approval", and
"how did this farm's yield compare to last season when risk was similarly
high".
```

Result:
Everything is working. Here's what was created:

  Semantic View: CLIMATE_AG_COPILOT.OPS.FARM_OPS_VIEW

  4 logical tables with relationships all joining through farms via farm_id:

  • farms (primary entity)
  • risk_assessments → farms
  • work_orders → farms
  • crop_history → farms

  20 dimensions covering farm identity, risk levels, work order status, and crop season details.

  8 metrics: farm_count, total_area, assessment_count, total_work_orders, avg_yield, max_yield, min_yield, total_seasons.

  AI guidance included:

  • AI_SQL_GENERATION custom instruction explaining Mekong Delta rice context, seasonal patterns, and how to handle each question type
  • 3 verified queries (onboarding questions):
    1. "Which farms are at high flood risk this week?"
    2. "How many work orders are pending approval?"
    3. "How did this farm yield compare to last season when risk was similarly high?"

  Both test queries returned correct results — farms 1-4 show HIGH/CRITICAL flood risk this week, and Le Hoang Nam Farm's yield drop from 6.8 → 2.1 t/ha due to flooding
  is clearly visible.

## 4. Cortex Agent

```
Create a Cortex Agent called FARM_OPS_AGENT in CLIMATE_AG_COPILOT.OPS
that uses the semantic view to answer questions and recommend irrigation
or drainage actions based on current risk levels, informed by each farm's
historical yield patterns where relevant.
```

Result:
The agent is live. Here's what was created:

  CLIMATE_AG_COPILOT.OPS.FARM_OPS_AGENT

  • Tool: query_farm_ops — a cortex_analyst_text_to_sql tool backed by FARM_OPS_VIEW
  • Warehouse: CLIMATE_AG_WH
  • Orchestration instructions cover:
    • Always querying real data before recommending actions
    • Flood risk → recommend drainage pump activation, open channels, reference historical losses
    • Drought risk → recommend supplemental irrigation, AWD techniques, reference prior drought impacts
    • Yield comparisons with seasonal and climate-event context
    • Normal yield benchmarks (5-7 t/ha) and loss thresholds (<3 t/ha)
  • Response instructions: concise, actionable, metric units, include assessment dates, end with recommendations when warranted

## 5. (Stretch) Cortex Search over agronomy notes

```
Verify in Snowsight (or via CoCo)

SELECT COUNT(*) FROM CLIMATE_AG_COPILOT.OPS.FARMS;
SELECT COUNT(*) FROM CLIMATE_AG_COPILOT.OPS.WEATHER_READINGS;
SELECT COUNT(*) FROM CLIMATE_AG_COPILOT.OPS.SENSOR_READINGS;
Each should return non-zero rows. Also ask the agent a test question in Snowsight's Cortex Agent playground (or via CoCo) to confirm FARM_OPS_AGENT actually responds.
```

Result: All verifications pass:

  ┌────────────────────────────┬────────────────────────────────┐
  │ Check                      │ Result                         │
  ├────────────────────────────┼────────────────────────────────┤
  │ FARMS row count            │ 15                             │
  ├────────────────────────────┼────────────────────────────────┤
  │ WEATHER_READINGS row count │ 450                            │
  ├────────────────────────────┼────────────────────────────────┤
  │ SENSOR_READINGS row count  │ 450                            │
  ├────────────────────────────┼────────────────────────────────┤
  │ FARM_OPS_AGENT responds    │ Yes — full actionable response │
  └────────────────────────────┴────────────────────────────────┘

  The agent correctly identified all 4 farms at CRITICAL flood risk (Tran Van Minh, Nguyen Thanh Binh, Le Hoang Nam, Pham Thi Lan), traced the escalation pattern from
  HIGH to CRITICAL over the last week, and recommended drainage pump activation and dyke inspection — all grounded in the actual data from the semantic view.

---

## Part 2 — FarmTwin asset-model rebuild (drafted 2026-07-14, not yet run)

Schema rationale and old-table -> new-table mapping: see
`docs/architecture.md`'s "Snowflake schema" section. These prompts are
drafts for `feat-008`/`feat-009` — review and adjust wording before running
against the live account, since prompt 1 is destructive (drops the Part 1
tables).

### 1. Schema rebuild (feat-008)

```
Drop the existing FARMS, SENSOR_READINGS, RISK_ASSESSMENTS, WORK_ORDERS,
and CROP_HISTORY tables in CLIMATE_AG_COPILOT.OPS (keep WEATHER_READINGS
but redefine it without farm_id, as a single farm-wide time series: ts,
rainfall_mm, temp_c, humidity_pct, wind_speed_kmh, source). Create tables
for FARM_ASSETS (asset_id, asset_type, name, grid_x, grid_y, install_date),
ASSET_READINGS (asset_id, ts, water_temp_c, ph, dissolved_oxygen_mg_l,
feed_level_pct, biomass_kg, air_temp_c, humidity_pct, water_l, egg_count,
growth_stage, soil_moisture_pct, nitrogen_ppm, irrigation_status,
disease_risk_pct, harvest_readiness_pct), ASSET_RISK_ASSESSMENTS
(asset_id, ts, risk_type, risk_level, notes), RECOMMENDATIONS
(recommendation_id, asset_id, created_at, recommendation, reason, evidence,
priority, expected_impact, confidence_pct, status, approved_by,
approved_at), and ASSET_HISTORY (asset_id, period_label, metric_name,
metric_value, notes).
```

Result: 
* Done. Here's what was executed in CLIMATE_AG_COPILOT.OPS:

  Dropped: FARMS, SENSOR_READINGS, RISK_ASSESSMENTS, WORK_ORDERS, CROP_HISTORY

  Created/Replaced:

  Row 1
  Table: WEATHER_READINGS
  Key columns: ts, rainfall_mm, temp_c, humidity_pct, wind_speed_kmh, source
  ────────────────────────────────────────────────────────────
  Row 2
  Table: FARM_ASSETS
  Key columns: asset_id (PK), asset_type, name, grid_x, grid_y, install_date
  ────────────────────────────────────────────────────────────
  Row 3
  Table: ASSET_READINGS
  Key columns: asset_id, ts, + 15 metric columns
  ────────────────────────────────────────────────────────────
  Row 4
  Table: ASSET_RISK_ASSESSMENTS
  Key columns: asset_id, ts, risk_type, risk_level, notes
  ────────────────────────────────────────────────────────────
  Row 5
  Table: RECOMMENDATIONS
  Key columns: recommendation_id (PK), asset_id, created_at, recommendation, reason, evidence, priority, expected_impact, confidence_pct, status, approved_by, approved_at
  ────────────────────────────────────────────────────────────
  Row 6
  Table: ASSET_HISTORY
  Key columns: asset_id, period_label, metric_name, metric_value, notes

### 2. Seed data (feat-008)

```
Generate realistic seed data for exactly 4 FARM_ASSETS rows: one
fish_pond, one chicken_coop, one rice_field, one fruit_orchard, each
positioned on a small grid (grid_x/grid_y between 0-10). Generate 30 days
of daily ASSET_READINGS per asset with values appropriate to that asset's
type (leave irrelevant columns null), including one asset that shows a
clear risk escalation in the last week (e.g. dissolved oxygen crashing in
the fish pond, or disease risk climbing in the orchard). Generate matching
ASSET_RISK_ASSESSMENTS (weekly for normal assets, daily for the escalating
one) and 3 prior periods of ASSET_HISTORY per asset (yield/production/
biomass as appropriate to each type), with at least one asset showing a
clear historical dip tied to a past risk event.
```

Result:
All seed data is in place:

  ┌────────────────────────┬──────┬─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Table                  │ Rows │ Notes                                                                                                   │
  ├────────────────────────┼──────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ FARM_ASSETS            │ 4    │ fish_pond, chicken_coop, rice_field, fruit_orchard                                                      │
  ├────────────────────────┼──────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ASSET_READINGS         │ 120  │ 30 days x 4 assets, type-appropriate columns only                                                       │
  ├────────────────────────┼──────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ASSET_RISK_ASSESSMENTS │ 22   │ Weekly for 3 normal assets; daily escalation for fish pond last 7 days (low → medium → high → critical) │
  ├────────────────────────┼──────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ASSET_HISTORY          │ 12   │ 3 periods per asset; fish pond shows Q4-2024 biomass crash (310 → 145 kg) from a prior DO event         │
  └────────────────────────┴──────┴─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

  Risk escalation pattern (FP-001): Dissolved oxygen drops from ~7 mg/L to ~3.1 mg/L over the last week, water temp rises to 33C, fish show surface gasping, and risk
  level escalates from low through medium/high to critical with daily assessments. This mirrors the historical Q4-2024 event where 40% of stock was lost.

### 3. Semantic view (feat-009)

```
Build a semantic view over FARM_ASSETS, ASSET_READINGS,
ASSET_RISK_ASSESSMENTS, RECOMMENDATIONS, and ASSET_HISTORY that lets me ask
questions like "which assets need attention today", "what is the current
status of the fish pond", and "how does this asset's recent history
compare to a past risk event".
```

Result:
* The semantic view CLIMATE_AG_COPILOT.OPS.FARM_OPS_VIEW is live. Here's what it provides:

  5 tables linked by relationships:

  • assets (FARM_ASSETS) — the central dimension table, joined to all others via asset_id
  • readings (ASSET_READINGS) — 15 sensor facts + time/stage dimensions
  • risks (ASSET_RISK_ASSESSMENTS) — risk type, level, notes
  • recs (RECOMMENDATIONS) — actions, priority, confidence, approval status
  • history (ASSET_HISTORY) — period-based historical metrics

  15 metrics covering averages, mins, maxes, and counts across readings, risks, recommendations, and history.

  AI_SQL_GENERATION instructions guide Cortex Analyst to handle "current status" (most recent reading), "needs attention" (high/critical risks or threshold breaches), and
   "compare to past" (join history) patterns.

  3 verified queries (all marked as onboarding questions):

  1. "Which assets need attention today?" — returns the fish pond with critical DO alert
  2. "What is the current status of the fish pond?" — latest reading showing DO at 3.5, temp 32.9C
  3. "How does the fish pond recent history compare to the past risk event?" — shows current avg DO of 4.88 alongside the Q4-2024 biomass crash (310 → 145 kg)

### 4. Cortex Agent (feat-009)

```
Create a Cortex Agent in CLIMATE_AG_COPILOT.OPS that uses the semantic
view to assess each asset's current condition and recommend actions.
Every recommendation must include exactly 6 fields: Recommendation
(one sentence), Reason, Evidence (cite specific current data), Priority
(low/medium/high), Expected Impact, and Confidence (a percentage). Ground
every recommendation in that asset's real current data and, where
relevant, its ASSET_HISTORY. Never give generic agricultural advice not
grounded in this farm's actual state.
```

Result:
* The agent is working perfectly. Here's a summary of what was created:

  Agent: CLIMATE_AG_COPILOT.OPS.FARM_OPS_AGENT

  Configuration:

  • Tool: query_farm_ops (cortex_analyst_text_to_sql) backed by the FARM_OPS_VIEW semantic view
  • Orchestration instructions: Asset-specific thresholds (DO < 5.0 = stress, < 3.5 = critical; water temp > 32C; disease risk > 20%; etc.), plus explicit guidance to
  compare against historical patterns like the Q4-2024 DO crash
  • Response instructions: Enforces the exact 6-field format (Recommendation, Reason, Evidence, Priority, Expected Impact, Confidence) and requires all data citations to
  reference specific current values

  Test result: The agent correctly identified FP-001 as critical, cited exact sensor values (DO 3.5 mg/L, water temp 32.9C, biomass 319 kg), compared the current
  trajectory to the Q4-2024 crash (310 → 145 kg), produced two high-priority recommendations with 95%/85% confidence, and confirmed the other three assets are healthy
  with supporting data. No generic advice was given.

### 5. Verification (feat-008/feat-009)

```
Verify in Snowsight (or via CoCo):

SELECT COUNT(*) FROM CLIMATE_AG_COPILOT.OPS.FARM_ASSETS;  -- expect 4
SELECT COUNT(*) FROM CLIMATE_AG_COPILOT.OPS.ASSET_READINGS;
SELECT COUNT(*) FROM CLIMATE_AG_COPILOT.OPS.ASSET_RISK_ASSESSMENTS;

Ask the agent a test question in the Cortex Agent playground (or via CoCo)
and confirm the response contains all 6 required recommendation fields for
a specific asset.
```

Result:
* All verifications pass:

  Table counts:

  ┌────────────────────────┬───────┬──────────────────────────┐
  │ Table                  │ Count │ Expected                 │
  ├────────────────────────┼───────┼──────────────────────────┤
  │ FARM_ASSETS            │ 4     │ 4                        │
  ├────────────────────────┼───────┼──────────────────────────┤
  │ ASSET_READINGS         │ 120   │ 120 (30 days x 4 assets) │
  ├────────────────────────┼───────┼──────────────────────────┤
  │ ASSET_RISK_ASSESSMENTS │ 22    │ 22                       │
  └────────────────────────┴───────┴──────────────────────────┘

  Agent response verification: The agent produced 4 recommendations for FP-001, each containing all 6 required fields:

  1. Recommendation - one actionable sentence
  2. Reason - grounded in current situation
  3. Evidence - cites specific data (DO 3.1 mg/L, water temp 32.9C, biomass 319 kg, dated July 12)
  4. Priority - high/medium as appropriate
  5. Expected Impact - concrete outcome description
  6. Confidence - percentage (95%, 90%, 85%, 88%)

  The agent also correctly compared the current trajectory to the Q4-2024 historical crash (310 → 145 kg, ~53% loss) and avoided generic advice — every recommendation is
  tied to specific current readings or risk assessment notes.