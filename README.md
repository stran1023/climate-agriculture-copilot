# FarmTwin AI Copilot

An AI decision-intelligence copilot for a mixed farm (Fish Pond, Chicken
Coop, Rice Field, Fruit Orchard), rendered as a living digital twin. The AI
observes the farm's current state, predicts risks, and recommends
prioritized, explainable actions — not a monitoring dashboard with a
chatbot attached. Built on Snowflake Cortex and Snowflake CoCo CLI. See
`docs/FarmTwin-AI-Copilot.md` for the full product vision and
`docs/architecture.md` for what's real vs. planned in this build.

Built for: Snowflake CoCo CLI Hackathon 2026 (Domain-Specific AI Copilot /
Autonomous Workflow track)

> **Note:** this repo previously built a different scope (a multi-farm rice
> cooperative copilot). It pivoted 2026-07-14 to the FarmTwin vision above —
> see `progress.md`'s "Legacy: rice-cooperative build" section for that
> earlier build's preserved evidence.

## Repo layout

```
climate-agriculture-copilot/
├── snowflake/         # SQL + CoCo session logs — how we built the Snowflake side
├── backend/           # FastAPI app: orchestrates the Observe/Understand/Recommend/Predict workflow
├── frontend/          # Next.js digital-twin UI + AI Copilot
├── scripts/           # one-off seed / demo data scripts
└── docs/              # vision doc, architecture notes, UI build plan
```

## Prerequisites

- Snowflake account (trial is fine — see [sign up](https://signup.snowflake.com))
- [Snowflake CoCo CLI](https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code-cli) installed locally
- Python 3.11+
- Node.js 20+
- Git + a GitHub account

## Setup

### 1. Snowflake CoCo CLI

```bash
# macOS / Linux / WSL
curl -fsSL https://ai.snowflake.com/static/cc-scripts/install.sh | sh

# verify
cortex --version
cortex   # launches setup wizard, connects to your Snowflake account
```

CoCo stores your connection in `~/.snowflake/connections.toml` — this is
**never committed** to the repo (see `.gitignore`).

We use CoCo interactively to scaffold the Snowflake-side objects (tables,
Cortex Search service, semantic view, Cortex Agent). See `snowflake/README.md`
for the exact prompts we used — keep that file updated as you go, since it
doubles as your "how we used CoCo" evidence for judging.

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env        # fill in your Snowflake + weather API creds
uvicorn app.main:app --reload
```

### 3. Frontend

```bash
cd frontend
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
npm install
npm run dev
```

(We scaffold this with `create-next-app` directly rather than committing
generated boilerplate — see `frontend/README.md`.)

## Environment variables

See `.env.example` at repo root. Copy it into `backend/.env` and fill in real
values. Never commit `.env`.
