# FarmTwin AI Copilot

> **From Monitoring to Decision Intelligence**

FarmTwin AI Copilot is a web-based AI decision-support platform for mixed farms. Instead of simply monitoring sensors and displaying dashboards, the system continuously analyzes the farm's current state, predicts upcoming risks, and recommends actionable tasks to help farmers make better operational decisions.

This project is being built for the Snowflake AI Hackathon and is designed around **Snowflake CoCo CLI**, **Snowflake Cortex AI**, and **Agent Skills**.

---

# Vision

Traditional farm management systems focus on monitoring.

FarmTwin focuses on **decision intelligence**.

Rather than asking farmers to interpret dozens of sensor values, FarmTwin answers questions like:

- What should I do today?
- Which farm asset requires immediate attention?
- Can I delay irrigation?
- Which animals are at risk tomorrow?
- How will tomorrow's weather affect my farm?
- What tasks should I prioritize?

Every recommendation includes reasoning and supporting evidence.

---

# Core Philosophy

The AI is the primary product.

The dashboard and digital twin exist to provide context for the AI.

The application should never feel like a dashboard with a chatbot attached.

Instead, it should feel like an intelligent farm manager that happens to visualize the farm.

---

# Product Goal

Create an AI Copilot that understands farm operations and helps farmers make operational decisions across multiple farm assets.

The AI should observe the farm, understand its condition, recommend actions, and predict future risks.

---

# Design Principles

The application should always follow this cycle.

Observe

↓

Understand

↓

Recommend

↓

Predict

Every feature should belong to one of these four stages.

---

# Farm Assets

The farm is represented as a Living Digital Twin.

Instead of generic "zones", the system manages **Farm Assets**.

Current assets include:

- Fish Pond
- Chicken Coop
- Rice Field
- Fruit Orchard

Each asset has:

- simulated sensor data
- operational status
- health score
- AI recommendations
- daily tasks
- predictions

Future assets should be easy to add.

---

# Digital Twin

The homepage displays an isometric farm map.

Each asset appears as an interactive object.

Hover

Displays

- asset name
- health score
- current status
- latest alert

Click

Opens

- asset dashboard
- simulated sensor values
- AI analysis
- recommendations
- today's tasks
- prediction
- history

The map should visually indicate:

Green

Healthy

Yellow

Needs attention

Red

Critical

The AI may also highlight assets automatically when they require action.

---

# Dashboard

The dashboard summarizes the entire farm.

Display:

- Overall Farm Health Score
- Active Alerts
- Tasks Due Today
- Farm Statistics
- Simulated Weather
- Weather Forecast
- Daily Recommendations
- Asset Status Overview

The dashboard should answer:

"How is my farm doing today?"

within a few seconds.

---

# AI Copilot

The AI Copilot is the center of the application.

It understands:

Weather

Farm Assets

Growth stages

Feeding schedules

Irrigation cycles

Disease risks

Harvest readiness

Task history

The AI should never provide generic agricultural advice.

Instead, it should analyze the current farm state before responding.

Example:

Bad

"Rice generally needs watering."

Good

"Rice Field A already has adequate soil moisture and rainfall is expected tomorrow morning. Delay irrigation to save water."

---

# AI Responsibilities

The AI should:

Analyze

Recommend

Explain

Predict

Prioritize

Summarize

It should never simply repeat sensor values.

---

# Recommendation Format

Every recommendation should contain:

Recommendation

Reason

Evidence

Priority

Expected Impact

Confidence

Example

Recommendation

Delay irrigation.

Reason

Rain is expected tomorrow.

Evidence

Current soil moisture is 72%.

Expected Impact

Save approximately 450 liters of water.

Priority

Medium

Confidence

94%

---

# Example User Questions

What should I do today?

Which asset needs attention?

Should I feed the fish?

Should I irrigate today?

Which task is most urgent?

What happens if tomorrow reaches 37°C?

Summarize today's farm status.

How healthy is the farm?

---

# Decision Intelligence

The system should focus on answering:

What should I do?

instead of

What is happening?

Every AI response should end with actionable next steps.

---

# Simulated Data

No physical IoT devices are required.

Instead, realistic farm data is generated.

Examples include:

Weather

Temperature

Humidity

Rain Probability

Wind Speed

Fish

Water Temperature

pH

Dissolved Oxygen

Feed Level

Biomass

Chicken

Temperature

Humidity

Feed

Water

Egg Production

Rice

Growth Stage

Soil Moisture

Nitrogen

Irrigation Status

Fruit Orchard

Growth Stage

Soil Moisture

Disease Risk

Harvest Readiness

The simulated data should behave realistically over time.

---

# Snowflake

Snowflake stores:

Farm Assets

Sensor Data

Tasks

Alerts

Recommendations

Weather

Predictions

Historical Data

Agent Skills retrieve and analyze this information before producing recommendations.

---

# Agent Skills

Example skills:

Daily Farm Brief

Zone Health Analyzer

Livestock Advisor

Crop Advisor

Weather Impact Analyzer

Harvest Planner

Task Planner

Risk Assessment

Scenario Simulator

Each skill should produce structured responses suitable for the AI Copilot.

---

# Future Features

Disease prediction

Yield estimation

Cost optimization

Resource planning

Harvest scheduling

Water usage optimization

Scenario simulation

Autonomous daily planning

---

# Technical Stack

Frontend

Next.js

React

Tailwind CSS

TypeScript

Map

Isometric 2D

Backend

Python Fast API

Snowflake

Snowflake Cortex AI

Snowflake CoCo CLI

Agent Skills

---

# Important Development Rules

The AI is always the main feature.

Avoid building a traditional farm dashboard.

Always explain recommendations.

Always prioritize actions.

Always provide reasoning.

Always support operational decision making.

Think like an AI Farm Manager instead of a monitoring application.

Every feature should make it easier for a farmer to decide what to do next.

---

# Success Criteria

A judge should be able to open the application and immediately understand:

This is not another dashboard.

This is an AI Copilot that continuously observes a digital twin of a farm, understands its condition, predicts risks, and recommends the best operational decisions.