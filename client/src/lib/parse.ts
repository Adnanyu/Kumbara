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

export async function parseFile(file: File): Promise<ParseResult> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") return parseCsv(file);
  if (ext === "xlsx" || ext === "xls") return parseXlsx(file);
  if (ext === "pdf") return parsePdfBestEffort(file);
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

// Bank-issued PDF statements are usually scanned/vector text without a
// stable structure, and we don't have a PDF text-extraction library
// available client-side. We make a best-effort pass by reading the raw
// bytes for a text stream and pattern-matching date/amount/description
// triples. This works for simple text-based PDF exports but is not
// reliable for all banks — CSV or XLSX exports are recommended instead.
async function parsePdfBestEffort(file: File): Promise<ParseResult> {
  const text = await file.text();
  // Extract anything that looks like readable text between PDF stream markers
  const cleaned = text.replace(/[^\x20-\x7E\n]+/g, " ");
  const lines = cleaned.split(/\n|\\n/).map((l) => l.trim()).filter(Boolean);

  const dateRe = /(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/;
  const amountRe = /-?\$?\d{1,3}(?:,\d{3})*\.\d{2}/g;

  const rows: RawRow[] = [];
  for (const line of lines) {
    const dateMatch = line.match(dateRe);
    if (!dateMatch) continue;
    const amounts = line.match(amountRe);
    if (!amounts || amounts.length === 0) continue;
    const amountStr = amounts[amounts.length - 1];
    const description = line
      .replace(dateMatch[0], "")
      .replace(amountStr, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (description.length < 2) continue;
    rows.push({ Date: dateMatch[0], Description: description, Amount: amountStr.replace(/[$,]/g, "") });
  }

  if (rows.length === 0) {
    return {
      rows: [],
      warning:
        "We couldn't find readable transaction lines in this PDF. Many bank PDF exports are scanned images or use complex layouts our in-browser reader can't parse reliably. For best results, export your statement as CSV or Excel instead.",
    };
  }
  return {
    rows,
    warning:
      "PDF parsing is best-effort and may miss or misread some lines. Please review the imported transactions below for accuracy.",
  };
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
