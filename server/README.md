# Kumbara — Server

Express + TypeScript + SQLite (better-sqlite3) API for Kumbara.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env: set JWT_SECRET (openssl rand -hex 32), optionally ANTHROPIC_API_KEY
npm run dev
```

Runs at http://localhost:4000. Data is stored in `data/kumbara.sqlite` (created automatically,
gitignored).

## Build for production

```bash
npm run build
npm start
```

## Environment variables

| Variable            | Required | Purpose                                                              |
| -------------------- | -------- | ---------------------------------------------------------------------|
| `JWT_SECRET`         | yes      | Signs login sessions. Use a long random string, keep it secret.      |
| `ANTHROPIC_API_KEY`  | no       | Enables the finance assistant. Without it, that feature returns a clear "not configured" message instead of failing. |
| `PORT`               | no       | Defaults to `4000`.                                                   |
| `CLIENT_ORIGIN`      | no       | CORS-allowed origin for the frontend. Defaults to `http://localhost:5173`. |

## API overview

All routes except `/api/health`, `/api/auth/signup`, and `/api/auth/login` require
`Authorization: Bearer <token>`.

- `POST /api/auth/signup` `{ username, displayName?, password }` → `{ token, user }`
- `POST /api/auth/login` `{ username, password }` → `{ token, user }`
- `GET  /api/auth/me` → `{ user }`
- `GET  /api/documents` → `{ documents }`
- `POST /api/documents` `{ name, type, note?, transactions[] }` → `{ document }`
- `PATCH /api/documents/:id` `{ included }` → `{ ok }`
- `DELETE /api/documents/:id` → `{ ok }`
- `GET  /api/transactions` → `{ transactions }`
- `PATCH /api/transactions/:id` `{ category }` → `{ ok }`
- `POST /api/assistant` `{ question, context, history[] }` → `{ reply }`

## Security notes

- Passwords are hashed with bcrypt (12 rounds) — never stored or logged in plain text.
- Auth endpoints and the assistant endpoint are rate-limited separately from the general API limiter.
- All queries use parameterized statements (better-sqlite3) — no string-built SQL.
- CORS is locked to `CLIENT_ORIGIN`; Helmet sets standard security headers.
- The login endpoint always runs a bcrypt comparison (even for unknown usernames) to reduce
  timing-based user enumeration.
- This is a self-hosted, single-tenant demo-grade setup — there's no email verification, password
  reset flow, refresh-token rotation, or account lockout. Add those before treating it as
  production-hardened for real financial data.
