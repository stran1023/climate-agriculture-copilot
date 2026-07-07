# Architecture & scope decisions

## What's real vs. stubbed for the hackathon build

| Piece                          | Status for demo                          |
|---------------------------------|-------------------------------------------|
| Weather ingestion (Open-Meteo)  | Real                                       |
| Snowflake tables + writes       | Real                                       |
| Cortex Agent risk assessment    | Real (built via CoCo)                      |
| Work order creation + approval  | Real (single approve/reject UI)            |
| Sensor data (IoT)               | Simulated — generated via CoCo prompt      |
| Satellite imagery               | Cut for hackathon scope                    |
| Multi-tab dashboard             | Cut — single operations screen only        |

## Flow

```
Open-Meteo (weather)
        │
        ▼
FastAPI /workflow/run
        │
        ▼
Snowflake OPS schema (WEATHER_READINGS, SENSOR_READINGS)
        │
        ▼
Cortex Agent: FARM_OPS_AGENT (risk assessment + recommendations)
        │
        ▼
WORK_ORDERS (pending_approval)
        │
        ▼
Next.js dashboard: approve/reject → status update → daily briefing
```

## Why this scope

Judging emphasizes end-to-end execution over breadth. One real, complete
loop (weather → risk → work order → approval → briefing) demos better than
five half-built dashboard tabs.
