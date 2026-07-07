# Frontend

Not scaffolded in version control on purpose — `create-next-app` generates a
lot of boilerplate that's noisy to review and easy to regenerate. Run this
once, from this directory:

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
```

Then add:

```bash
npm install mapbox-gl react-map-gl recharts
```

## Pages to build (priority order for the demo)

1. `/` — single-screen operations view: today's risk map + pending work
   orders + approve/reject buttons. This is the one screen judges should see
   end-to-end.
2. `/reports` — daily briefing history (stretch)

Point API calls at `NEXT_PUBLIC_API_URL` (backend, default
`http://localhost:8000`).
