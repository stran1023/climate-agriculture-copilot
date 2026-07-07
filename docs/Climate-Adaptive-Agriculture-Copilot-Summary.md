# Climate-Adaptive Agriculture Copilot

## Vision

An AI Operations Copilot for Vietnamese agricultural cooperatives that
transforms weather, sensor, and farm data into intelligent operational
decisions through workflow automation.

**Hackathon Track:** Domain-Specific AI Copilot

**Differentiator:** 80% of the engineering demonstrates Intelligent
Workflow Automation.

------------------------------------------------------------------------

## Problem

Vietnamese agriculture is increasingly affected by: - Floods - Drought -
Salinity intrusion - Unpredictable weather

Farm managers need actionable decisions, not dashboards.

------------------------------------------------------------------------

## Initial Scope

Focus on **Vietnam first**, with a preference for **rice cooperatives**.

Future expansion: - Coffee - Fruit - Other ASEAN countries

------------------------------------------------------------------------

## Core Value

Instead of answering questions, the AI performs work.

Workflow:

Weather + Farm Data + Crop History + Forecasts → Analyze → Predict risks
→ Recommend actions → Create work orders → Request approval → Generate
daily report

------------------------------------------------------------------------

## Daily Workflow

1.  Ingest latest weather.
2.  Update Snowflake.
3.  Assess flood, drought, and disease risks.
4.  Generate irrigation/fertilizer recommendations.
5.  Create work orders.
6.  Request manager approval.
7.  Notify stakeholders.
8.  Produce a daily briefing.

------------------------------------------------------------------------

## Key Data Sources

-   Weather API
-   Historical weather
-   Farm metadata
-   Crop growth stage
-   Simulated IoT sensor data
-   Historical yields
-   Optional satellite imagery

------------------------------------------------------------------------

## Recommended Tech Stack

### Frontend

-   Next.js
-   React
-   Mapbox or Leaflet
-   Charts

### Backend

-   FastAPI (Python)

### AI

-   LangGraph
-   Snowflake Cortex
-   LLM APIs

### Database

-   Snowflake

### External APIs

-   Open-Meteo
-   Optional satellite providers

------------------------------------------------------------------------

## AI Agent Architecture

Planner Agent → Weather Agent → Risk Assessment Agent → Crop Planning
Agent → Task Generator → Report Generator

------------------------------------------------------------------------

## Dashboard

-   Farm map
-   Risk heatmap
-   Today's recommendations
-   Approval center
-   Workflow timeline
-   Reports

------------------------------------------------------------------------

## Demo Story

"Every morning before managers arrive, the system automatically:

-   Collects weather forecasts
-   Updates Snowflake
-   Evaluates every field
-   Detects climate risks
-   Plans daily operations
-   Generates work orders
-   Requests approvals
-   Produces an operational briefing"

This demonstrates an AI teammate rather than a chatbot.

------------------------------------------------------------------------

## Why This Fits the Hackathon

-   Domain-specific AI Copilot
-   Intelligent workflow automation
-   Enterprise data with Snowflake
-   Real business value
-   End-to-end autonomous workflow
