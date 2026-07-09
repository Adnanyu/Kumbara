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
    parse.ts       CSV/XLSX/PDF statement parsing entry point (runs in the browser)
    pdfText.ts      PDF.js text-layer extraction + page-to-canvas rendering
    ocr.ts          Tesseract.js OCR fallback for scanned/image-based PDF statements
    categorize.ts   keyword-based auto-categorization
    analytics.ts   aggregations, anomaly detection, trends
    claude.ts       finance assistant client (calls server's /api/assistant proxy)
    types.ts        shared types
public/
  vendor/tesseract/  self-hosted Tesseract.js worker + wasm core (no third-party CDN)
  tessdata/          self-hosted English OCR language data
```

Bank statement files are parsed entirely in the browser — only the resulting structured
transactions (date, description, merchant, amount, category) are sent to the server, never the raw file.

### PDF parsing pipeline

Many banks (Chase included) render the transaction table in their PDF statements as an image
rather than real text, so a naive text scrape returns nothing. `parse.ts` handles both cases:

1. **Text layer first** — extracts text via PDF.js and looks for transaction-shaped lines
   (`MM/DD  description  amount  balance`). Fast, and works for statements with a real text layer.
2. **OCR fallback** — if fewer than 3 transaction-shaped lines are found, each page is rendered to
   a canvas and read with Tesseract.js (English), entirely client-side. This is slower (several
   seconds per page) and occasionally misreads a character — the UI surfaces a warning asking the
   user to double-check the imported rows when this path is used.
3. The statement's printed date range (e.g. "May 27, 2026 through June 24, 2026") is used to
   resolve the year for `MM/DD`-only transaction dates.

Tesseract's worker, wasm core, and English language data are vendored into `public/vendor` and
`public/tessdata` (~18 MB total) rather than fetched from a CDN, and are only downloaded by the
browser lazily, the first time someone uploads an image-based PDF — CSV/XLSX-only users never
load them, and PDF.js/Tesseract are excluded from the main JS bundle via dynamic `import()`.
