# Frontend

Next.js (App Router, TypeScript, Tailwind) client for the climate-adaptive
agriculture copilot. Scaffolded via `create-next-app`; built against the
real FastAPI backend in `../backend`.

## Setup

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL, default http://localhost:8000
npm run dev
```

Backend must be running (`cd ../backend && uvicorn app.main:app --reload`)
for any page to show real data.

## Pages

Three screens, per `../docs/ui-build-plan.md`:

1. `/` — plot list (`GET /plots`), one card per plot with a risk badge.
2. `/plots/[id]` — risk narrative + recommended work order for one plot
   (`GET /plots/{id}/risk`), with Approve/Reject buttons
   (`POST /workorders/{id}/approve|reject`).
3. `/briefing` — today's approved/rejected work orders + generated daily
   briefing (`GET /briefing/today`).

All API calls point at `NEXT_PUBLIC_API_URL`.
