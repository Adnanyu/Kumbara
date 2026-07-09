# Kumbara — Client

React + Vite + TypeScript + Tailwind + shadcn/ui frontend for Kumbara.

## Setup

```bash
npm install
cp .env.example .env   # only needed if your API isn't on http://localhost:4000
npm run dev
```

Runs at http://localhost:5173. Requires the `server` to be running (see `../server/README.md`).

## Build

```bash
npm run build   # outputs static files to dist/
npm run preview # serve the production build locally
```

Deploy `dist/` to any static host (Vercel, Netlify, S3+CloudFront, nginx, etc.), and set `VITE_API_URL`
at build time to point at your deployed API.

## Structure

```
src/
  components/   UI screens and shared components (Dashboard, Upload, Transactions, Settings, Assistant, ui/*)
  context/      AppContext — auth session + documents/transactions state, talks to the API
  lib/
    api.ts        fetch wrapper + JWT token storage
    auth.ts        signup/login calls
    parse.ts       CSV/XLSX/PDF statement parsing (runs in the browser)
    categorize.ts   keyword-based auto-categorization
    analytics.ts   aggregations, anomaly detection, trends
    claude.ts       finance assistant client (calls server's /api/assistant proxy)
    types.ts        shared types
```

Bank statement files are parsed entirely in the browser — only the resulting structured
transactions (date, description, merchant, amount, category) are sent to the server, never the raw file.
