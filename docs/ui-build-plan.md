# UI build plan — FarmTwin AI Copilot

> **Status: this is the current target.** It replaces the prior 3-screen
> rice-cooperative plan (card list → risk/work-order detail → briefing,
> real Leaflet/OpenStreetMap Screen 1). That build shipped and passed
> (`feat-001`–`feat-007`); its evidence lives in `progress.md` under
> "Legacy: rice-cooperative build (superseded 2026-07-14)." The map
> approach explicitly changes here: **isometric digital twin, not real
> geography** — confirmed with the user on 2026-07-14 over the working
> Leaflet/OSM implementation.

Scope: one real farm, four heterogeneous assets (Fish Pond, Chicken Coop,
Rice Field, Fruit Orchard), one Cortex Agent producing structured
recommendations. Per `docs/FarmTwin-AI-Copilot.md`'s core philosophy: **the
AI is the primary product** — the digital twin and dashboard exist to give
the AI context, not the other way around. Don't build any screen that could
ship as "just a dashboard with a chatbot bolted on."

## Demo narrative (say this out loud during judging)

> "The farm is simulated end to end — weather, pond, coop, field, orchard —
> written to Snowflake every run. The Cortex Agent doesn't just read sensor
> values back to you: it observes the farm's state, understands the risk,
> recommends one prioritized action per asset with its reasoning and
> evidence, and predicts what happens next. This screen is generated from
> that agent output, not scripted."

Keep the demo to one dramatic risk event on one asset (e.g. dissolved oxygen
crashing in the Fish Pond, or a disease-risk spike in the Orchard) — one
clear story beats four simultaneous alerts.

---

## Screen 1 — Digital Twin home (isometric farm map)

**Purpose:** establish "this is a living farm," not a list of database rows.

- Isometric 2D layout, one interactive object per asset (Fish Pond, Chicken
  Coop, Rice Field, Fruit Orchard), positioned via `FARM_ASSETS.grid_x/grid_y`
- Color-coded per asset: green (healthy) / yellow (needs attention) / red
  (critical) — driven by that asset's latest `ASSET_RISK_ASSESSMENTS.risk_level`
- **Hover:** asset name, health score, current status, latest alert (small
  popover, no navigation)
- **Click:** opens Screen 3 (asset detail) for that asset
- The AI may auto-highlight an asset that needs action (e.g. a pulsing
  border) independent of hover/click state
- Data source: `GET /assets` — asset id/type/name/grid position/health
  score/status/latest risk level

**Open technical decision (resolve at implementation time, not blocking the
feature list):** how to render the isometric layout — hand-rolled CSS
(`transform: rotateX/rotateZ` grid, cheapest, matches "Isometric 2D" in the
doc's tech stack) vs. a small isometric/2.5D rendering library vs. sprite
tiles. Default to plain CSS/SVG unless a session finds a concrete reason
not to — keeps the dependency footprint small, consistent with the prior
build's bias toward minimal new packages (e.g. Leaflet was chosen partly
because it needed no API key).

---

## Screen 2 — Farm Dashboard

**Purpose:** answer "How is my farm doing today?" within a few seconds, per
the vision doc's dashboard requirement.

Display:

- Overall Farm Health Score (aggregate across all 4 assets)
- Active Alerts (derived: latest `ASSET_RISK_ASSESSMENTS` at high/critical)
- Tasks Due Today (derived: `RECOMMENDATIONS` with `status = 'pending_approval'`)
- Farm Statistics (asset count, simple per-type summary)
- Simulated Weather + Weather Forecast (Open-Meteo, farm-wide)
- Daily Recommendations (top N structured recommendations, priority-sorted)
- Asset Status Overview (compact per-asset health/status row, links into
  Screen 3)

Data source: `GET /dashboard/summary` — aggregates across `FARM_ASSETS`,
`ASSET_RISK_ASSESSMENTS`, `RECOMMENDATIONS`, `WEATHER_READINGS`.

---

## Screen 3 — Asset detail

**Purpose:** the per-asset "wow" moment — same role the old Screen 2
(risk + work order) played, generalized to any asset type.

Panels:

1. **Simulated sensor values** — type-specific fields from `ASSET_READINGS`
   (e.g. Fish Pond: water temp/pH/DO/feed level/biomass; Rice Field: growth
   stage/soil moisture/nitrogen/irrigation status), clearly labeled
   "simulated" per the existing convention for non-real data
2. **AI analysis** — the Cortex Agent's grounded explanation of this
   asset's current condition (not a repeated sensor dump)
3. **Recommendation card(s)** — full structured format, one card per
   pending recommendation:
   - Recommendation (one sentence)
   - Reason
   - Evidence
   - Priority (low/medium/high)
   - Expected Impact
   - Confidence (%)
   - Approve / Reject buttons
4. **Today's tasks** — this asset's pending recommendations, task-framed
5. **Prediction** — short-horizon forecast for this asset (e.g. "if this
   trend continues, dissolved oxygen drops below safe levels within 18
   hours")
6. **History** — recent `ASSET_HISTORY` entries (yield, production,
   biomass, as applicable to the asset type)

Data source: `GET /assets/{id}` (readings + risk + history) and
`GET /assets/{id}/recommendations` (structured cards). Approve/reject:
`POST /recommendations/{id}/approve` / `/reject` — real Snowflake
write-back, same non-negotiable proof-of-loop requirement as the prior
build.

---

## Screen 4 — AI Copilot panel

**Purpose:** the literal center of the application, per the vision doc's
core philosophy. Not a screen you visit occasionally — a persistent surface
(side panel or dedicated route, decide at implementation time based on
layout constraints) that:

- Surfaces a prioritized, farm-wide list of structured recommendations
  (same 6-field format as Screen 3, but cross-asset and priority-sorted)
- Answers free-form questions grounded in current farm state — the example
  questions in `docs/FarmTwin-AI-Copilot.md` ("What should I do today?",
  "Should I feed the fish?", "What happens if tomorrow reaches 37°C?") are
  the acceptance bar, not aspirational copy
- Every response ends with actionable next steps, per "Decision
  Intelligence": answer *what should I do*, not *what is happening*

Data source: `POST /copilot/ask` (free-form question → grounded Cortex
Agent answer) plus the same `GET /dashboard/summary` recommendation feed
used on Screen 2.

---

## Screen 5 — Daily briefing

**Purpose:** unchanged from the prior build's payoff screen — approved
actions roll up into something a human reads each morning.

- Today's approved/rejected recommendations across all assets
- Generated 3–5 sentence natural-language summary (Cortex Agent output)

Data source: `GET /briefing/today` (rebuilt on `RECOMMENDATIONS` instead of
`WORK_ORDERS`, same shape otherwise).

---

## Component notes (Next.js)

- Screen 1 (digital twin) is the entry point and should read as alive, not
  static — even a subtle idle animation (e.g. a slow pulse on the
  highest-priority asset) reinforces "this is not a dashboard"
- Reuse one recommendation-card component across Screens 2/3/4 (all three
  render the same 6-field structure)
- Poll or refetch on approve/reject rather than building websockets — same
  call as the prior build, still not worth the complexity for a demo
- Keep the "simulated" labeling convention from the prior build for any
  sensor-derived field

## Data contract summary (confirm with backend before building)

| Endpoint | Method | Returns |
|---|---|---|
| `/assets` | GET | all farm assets with latest health/status/risk |
| `/assets/{id}` | GET | asset detail: readings, risk, history |
| `/assets/{id}/recommendations` | GET | structured recommendation cards for that asset |
| `/recommendations/{id}/approve` | POST | updates status in Snowflake |
| `/recommendations/{id}/reject` | POST | updates status in Snowflake |
| `/dashboard/summary` | GET | farm health score, alerts, tasks, weather, top recommendations, asset overview |
| `/copilot/ask` | POST | free-form question → grounded Cortex Agent answer |
| `/briefing/today` | GET | approved/rejected list + generated summary |

## Build order

1. Confirm the new Snowflake schema is live (`feat-008`/`feat-009` in
   `feature_list.json`) before any frontend work starts — same rule as the
   prior build.
2. Backend: models + read/write layer + `/workflow/run` rewrite +
   endpoints (`feat-010`–`feat-014`).
3. Frontend: digital twin home first (it's the entry point and the
   clearest visual proof of the pivot), then dashboard, then asset detail,
   then the AI Copilot panel, then briefing (`feat-015`–`feat-019`).
4. Wire every approve/reject and copilot-ask call to hit real Snowflake
   before polishing visuals — non-negotiable, matches the prior build's
   verification bar.
