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
(farm_id, ts, flood_risk, drought_risk, disease_risk, notes), and
WORK_ORDERS (work_order_id, farm_id, created_at, action, status,
approved_by, approved_at).
```

Result: _(fill in — table names actually created, any deviations)_

## 2. Seed data

```
Generate realistic sample data for 15 rice farms in the Mekong Delta,
with 30 days of daily weather and sensor readings each, including a few
farms that show a clear flood-risk pattern in the last week of data.
```

Result: _(fill in)_

## 3. Semantic view

```
Build a semantic view over FARMS, RISK_ASSESSMENTS, and WORK_ORDERS that
lets me ask questions like "which farms are at high flood risk this week"
and "how many work orders are pending approval".
```

Result: _(fill in)_

## 4. Cortex Agent

```
Create a Cortex Agent called FARM_OPS_AGENT in CLIMATE_AG_COPILOT.OPS
that uses the semantic view to answer questions and recommend irrigation
or drainage actions based on current risk levels.
```

Result: _(fill in)_

## 5. (Stretch) Cortex Search over agronomy notes

```
...
```

Result: _(fill in)_
