# Kumbara

A full-stack personal expense intelligence app: upload bank statements, get auto-categorized
transactions, a multi-chart dashboard, anomaly/trend detection, and an AI finance assistant.

```
kumbara/
  client/   React + Vite + TypeScript + Tailwind + shadcn/ui frontend
  server/   Express + TypeScript + SQLite API (auth, documents, transactions, assistant proxy)
```

## Quick start (two terminals)

```bash
# Terminal 1 — API
cd server
npm install
cp .env.example .env
# set JWT_SECRET in .env (openssl rand -hex 32); ANTHROPIC_API_KEY is optional
npm run dev
```

```bash
# Terminal 2 — frontend
cd client
npm install
npm run dev
```

Open http://localhost:5173, create an account, and upload a CSV or Excel bank statement to see it
come to life. See `client/README.md` and `server/README.md` for full details on each half.

## Architecture

- **Auth**: username/password, bcrypt-hashed server-side, JWT session tokens (7-day expiry) sent as
  `Authorization: Bearer` headers. No third-party auth provider required.
- **Statement parsing**: happens entirely in the browser (CSV via PapaParse, Excel via SheetJS, PDF
  best-effort via pattern extraction). Only structured transaction rows are sent to the server —
  never the raw uploaded file.
- **Storage**: SQLite via better-sqlite3 (a single file, `server/data/kumbara.sqlite`). Swap in
  Postgres/MySQL later by replacing `server/src/db.ts` and the prepared statements in
  `server/src/routes/*` — the route/response shape wouldn't need to change.
- **Assistant**: the client sends a question plus an aggregated (not raw) summary of the user's
  transactions to `POST /api/assistant`, which the server forwards to Claude using your own
  `ANTHROPIC_API_KEY`. The key never touches the browser.

## Known limitations (read before using with real financial data)

- No email verification, password reset, or account lockout after failed attempts.
- PDF statement parsing is best-effort pattern matching, not a real PDF text-extraction library —
  export CSV/XLSX from your bank for reliable results.
- The `xlsx` (SheetJS) package has a known, currently-unpatched prototype-pollution/ReDoS advisory
  in its npm-published version. Risk is limited to files the user themselves chooses to upload, but
  if you productionize this, consider sandboxing that parse step or evaluating `exceljs` as a
  replacement.
- Single SQLite file with no automated backups — fine for personal/self-hosted use, not for
  multi-user production without more work (connection pooling, backups, migrations tooling).
