# CoCo CLI prompt log

Paste each prompt you send CoCo here before running it, then fill in the
"Result" line after. Keep this updated live during the hackathon — it's your
evidence trail.

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