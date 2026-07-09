import Papa from "papaparse";
import * as XLSX from "xlsx";
import { categorizeTransaction, extractMerchant } from "./categorize";
import type { Transaction } from "./types";

export interface RawRow {
  [key: string]: string | number;
}

export interface ParseResult {
  rows: RawRow[];
  warning?: string;
}

export type ProgressCallback = (status: string) => void;

export async function parseFile(file: File, onProgress?: ProgressCallback): Promise<ParseResult> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") return parseCsv(file);
  if (ext === "xlsx" || ext === "xls") return parseXlsx(file);
  if (ext === "pdf") return parsePdf(file, onProgress);
  throw new Error("Unsupported file type. Please upload a .csv, .xlsx, or .pdf file.");
}

function parseCsv(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        resolve({ rows: result.data as RawRow[] });
      },
      error: (err) => reject(err),
    });
  });
}

async function parseXlsx(file: File): Promise<ParseResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as RawRow[];
  return { rows };
}

// Matches a transaction line like:
//   06/01 Card Purchase 05/29 Marhaba Mclean VA Card 0712 -35.73 931.50
// Captures: leading date, description, amount, and (optionally) running balance.
const TXN_LINE_RE =
  /^(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s+(.+?)\s+(-?\$?[\d,]+\.\d{2})(?:\s+(-?\$?[\d,]+\.\d{2}))?\s*$/;

const STATEMENT_PERIOD_RE =
  /([A-Z][a-z]+ \d{1,2},? \d{4})\s*(?:through|-|to|–)\s*([A-Z][a-z]+ \d{1,2},? \d{4})/;

function tryParseMonthDayYear(text: string): Date | null {
  const d = new Date(text.replace(",", ""));
  return isNaN(d.getTime()) ? null : d;
}

// Bank statements often print transaction dates as "MM/DD" with no year,
// relying on the printed statement period for context. This resolves the
// year by picking whichever of the statement's start/end years lands the
// date inside (or just before) the statement window.
function resolveYear(monthDay: string, periodStart: Date | null, periodEnd: Date | null): string {
  const [mm, dd] = monthDay.split("/").map(Number);
  const candidateYears = new Set<number>();
  if (periodStart) candidateYears.add(periodStart.getFullYear());
  if (periodEnd) candidateYears.add(periodEnd.getFullYear());
  if (candidateYears.size === 0) candidateYears.add(new Date().getFullYear());

  let best = Array.from(candidateYears)[0];
  if (periodStart && periodEnd) {
    const lowerBound = new Date(periodStart);
    lowerBound.setDate(lowerBound.getDate() - 3);
    const upperBound = new Date(periodEnd);
    upperBound.setDate(upperBound.getDate() + 3);
    for (const year of candidateYears) {
      const candidate = new Date(year, mm - 1, dd);
      if (candidate >= lowerBound && candidate <= upperBound) {
        best = year;
        break;
      }
    }
  }
  return String(best);
}

function linesToRows(lines: string[], periodStart: Date | null, periodEnd: Date | null): RawRow[] {
  const rows: RawRow[] = [];
  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+/g, " ").trim();
    const match = line.match(TXN_LINE_RE);
    if (!match) continue;
    const [, monthDay, descriptionRaw, amountRaw] = match;
    const description = descriptionRaw.replace(/\s{2,}/g, " ").trim();
    // Skip obvious non-transaction rows (e.g. "Beginning Balance $1,020.23"
    // can slip through if it happens to have a date-like prefix nearby).
    if (/^(beginning|ending|opening|closing)\s+balance$/i.test(description)) continue;
    if (description.length < 2) continue;

    const year = resolveYear(monthDay, periodStart, periodEnd);
    const [mm, dd] = monthDay.split("/");
    const isoDate = `${year}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;

    rows.push({
      Date: isoDate,
      Description: description,
      Amount: amountRaw.replace(/[$,]/g, ""),
    });
  }
  return rows;
}

async function parsePdf(file: File, onProgress?: ProgressCallback): Promise<ParseResult> {
  onProgress?.("Reading PDF…");
  const { extractTextLayer } = await import("./pdfText");
  const { pages, fullText } = await extractTextLayer(file);

  const periodMatch = fullText.match(STATEMENT_PERIOD_RE);
  const periodStart = periodMatch ? tryParseMonthDayYear(periodMatch[1]) : null;
  const periodEnd = periodMatch ? tryParseMonthDayYear(periodMatch[2]) : null;

  const textLayerLines = pages.flatMap((p) => p.lines);
  let rows = linesToRows(textLayerLines, periodStart, periodEnd);
  let usedOcr = false;

  // If the text layer barely produced any transaction-shaped lines, the
  // statement table is most likely rendered as an image (common for Chase
  // and several other banks). Fall back to in-browser OCR.
  if (rows.length < 3) {
    usedOcr = true;
    const { ocrPdfPages } = await import("./ocr");
    const pageTexts = await ocrPdfPages(file, (page, total, stage) => {
      onProgress?.(stage === "rendering" ? `Rendering page ${page} of ${total}…` : `Reading page ${page} of ${total}…`);
    });
    const ocrLines = pageTexts.flatMap((t) => t.split("\n"));
    rows = linesToRows(ocrLines, periodStart, periodEnd);
  }

  if (rows.length === 0) {
    return {
      rows: [],
      warning:
        "We couldn't find readable transaction lines in this PDF, even with OCR. Some statements use layouts our reader can't parse reliably — exporting CSV or Excel from your bank will always work best.",
    };
  }

  const warnings: string[] = [];
  if (usedOcr) {
    warnings.push(
      "This statement's transaction table appears to be an image, so we read it with in-browser OCR. Please double check amounts and dates below — OCR can occasionally misread a character."
    );
  } else {
    warnings.push("Please review the imported transactions below for accuracy.");
  }
  if (!periodMatch) {
    warnings.push("We couldn't find a statement period to confirm the year on each date — please verify the dates below.");
  }

  return { rows, warning: warnings.join(" ") };
}

const DATE_KEYS = ["date", "transaction date", "posted date", "posting date", "trans date"];
const DESC_KEYS = ["description", "memo", "details", "narrative", "payee", "merchant"];
const AMOUNT_KEYS = ["amount", "transaction amount", "value"];
const DEBIT_KEYS = ["debit", "withdrawal", "money out"];
const CREDIT_KEYS = ["credit", "deposit", "money in"];

function findKey(headers: string[], candidates: string[]): string | null {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const cand of candidates) {
    const idx = lower.findIndex((h) => h === cand || h.includes(cand));
    if (idx >= 0) return headers[idx];
  }
  return null;
}

function normalizeDate(raw: string): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // mm/dd/yyyy or m/d/yy
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let [, mo, da, yr] = m;
    if (yr.length === 2) yr = `20${yr}`;
    return `${yr}-${mo.padStart(2, "0")}-${da.padStart(2, "0")}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

function toNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const s = String(raw).replace(/[$,]/g, "").trim();
  const negParens = /^\(.*\)$/.test(s);
  const n = parseFloat(negParens ? s.slice(1, -1) : s);
  if (isNaN(n)) return null;
  return negParens ? -n : n;
}

export interface ColumnMapping {
  dateKey: string | null;
  descKey: string | null;
  amountKey: string | null;
  debitKey: string | null;
  creditKey: string | null;
}

export function detectColumns(rows: RawRow[]): ColumnMapping {
  if (rows.length === 0) return { dateKey: null, descKey: null, amountKey: null, debitKey: null, creditKey: null };
  const headers = Object.keys(rows[0]);
  return {
    dateKey: findKey(headers, DATE_KEYS),
    descKey: findKey(headers, DESC_KEYS),
    amountKey: findKey(headers, AMOUNT_KEYS),
    debitKey: findKey(headers, DEBIT_KEYS),
    creditKey: findKey(headers, CREDIT_KEYS),
  };
}

export function rowsToTransactions(rows: RawRow[], mapping: ColumnMapping, docId: string): { txns: Transaction[]; skipped: number } {
  const txns: Transaction[] = [];
  let skipped = 0;
  rows.forEach((row, i) => {
    const dateRaw = mapping.dateKey ? row[mapping.dateKey] : null;
    const date = dateRaw ? normalizeDate(String(dateRaw)) : null;
    const description = mapping.descKey ? String(row[mapping.descKey] ?? "").trim() : "";

    let amount: number | null = null;
    if (mapping.amountKey) {
      amount = toNumber(row[mapping.amountKey]);
    } else if (mapping.debitKey || mapping.creditKey) {
      const debit = mapping.debitKey ? toNumber(row[mapping.debitKey]) : null;
      const credit = mapping.creditKey ? toNumber(row[mapping.creditKey]) : null;
      if (debit) amount = -Math.abs(debit);
      else if (credit) amount = Math.abs(credit);
    }

    if (!date || !description || amount === null) {
      skipped += 1;
      return;
    }

    const merchant = extractMerchant(description);
    const category = amount > 0 && /payroll|salary|deposit|refund/i.test(description) ? "Income" : categorizeTransaction(description);

    txns.push({
      id: `${docId}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      docId,
      date,
      description,
      merchant,
      amount,
      category,
    });
  });
  return { txns, skipped };
}
