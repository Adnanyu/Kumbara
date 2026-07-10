import type { Category, Transaction } from "./types";

export function expensesOnly(txns: Transaction[]): Transaction[] {
  return txns.filter((t) => t.amount < 0 && t.category !== "Income");
}

export function monthKey(date: string): string {
  return date.slice(0, 7); // yyyy-mm
}

export function monthlyTotals(txns: Transaction[]): { month: string; total: number }[] {
  const map = new Map<string, number>();
  for (const t of expensesOnly(txns)) {
    const key = monthKey(t.date);
    map.set(key, (map.get(key) ?? 0) + Math.abs(t.amount));
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 }));
}

export function categoryTotals(txns: Transaction[]): { category: Category; total: number; count: number }[] {
  const map = new Map<Category, { total: number; count: number }>();
  for (const t of expensesOnly(txns)) {
    const cur = map.get(t.category) ?? { total: 0, count: 0 };
    cur.total += Math.abs(t.amount);
    cur.count += 1;
    map.set(t.category, cur);
  }
  return Array.from(map.entries())
    .map(([category, v]) => ({ category, total: Math.round(v.total * 100) / 100, count: v.count }))
    .sort((a, b) => b.total - a.total);
}

export function categoryByMonth(txns: Transaction[]): { month: string; [k: string]: number | string }[] {
  const months = new Set<string>();
  const byMonthCat = new Map<string, Map<Category, number>>();
  for (const t of expensesOnly(txns)) {
    const m = monthKey(t.date);
    months.add(m);
    if (!byMonthCat.has(m)) byMonthCat.set(m, new Map());
    const catMap = byMonthCat.get(m)!;
    catMap.set(t.category, (catMap.get(t.category) ?? 0) + Math.abs(t.amount));
  }
  return Array.from(months)
    .sort()
    .map((m) => {
      const row: { month: string; [k: string]: number | string } = { month: m };
      const catMap = byMonthCat.get(m)!;
      for (const [cat, val] of catMap.entries()) {
        row[cat] = Math.round(val * 100) / 100;
      }
      return row;
    });
}

export function topMerchants(txns: Transaction[], limit = 8): { merchant: string; total: number; count: number }[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const t of expensesOnly(txns)) {
    const cur = map.get(t.merchant) ?? { total: 0, count: 0 };
    cur.total += Math.abs(t.amount);
    cur.count += 1;
    map.set(t.merchant, cur);
  }
  return Array.from(map.entries())
    .map(([merchant, v]) => ({ merchant, total: Math.round(v.total * 100) / 100, count: v.count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export function mostRepeatedMerchant(txns: Transaction[]): { merchant: string; count: number } | null {
  const map = new Map<string, number>();
  for (const t of expensesOnly(txns)) {
    map.set(t.merchant, (map.get(t.merchant) ?? 0) + 1);
  }
  let best: { merchant: string; count: number } | null = null;
  for (const [merchant, count] of map.entries()) {
    if (!best || count > best.count) best = { merchant, count };
  }
  return best;
}

function mean(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / (nums.length || 1);
}
function stdDev(nums: number[], avg: number): number {
  const variance = mean(nums.map((n) => (n - avg) ** 2));
  return Math.sqrt(variance);
}

// Flags transactions whose absolute amount is a statistical outlier
// relative to other transactions in the same category (z-score > 2.25),
// plus any single transaction that is unusually large in absolute terms.
export function detectAnomalies(txns: Transaction[]): Transaction[] {
  const byCat = new Map<Category, Transaction[]>();
  for (const t of expensesOnly(txns)) {
    if (!byCat.has(t.category)) byCat.set(t.category, []);
    byCat.get(t.category)!.push(t);
  }
  const flagged: Transaction[] = [];
  for (const [, list] of byCat.entries()) {
    if (list.length < 4) continue; // not enough history to judge
    const amounts = list.map((t) => Math.abs(t.amount));
    const avg = mean(amounts);
    const sd = stdDev(amounts, avg);
    if (sd === 0) continue;
    for (const t of list) {
      const z = (Math.abs(t.amount) - avg) / sd;
      if (z > 2.25) {
        flagged.push({ ...t, isAnomaly: true });
      }
    }
  }
  return flagged.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
}

export interface CategoryTrend {
  category: Category;
  currentMonth: number;
  previousMonth: number;
  pctChange: number | null; // null when previous month had no spend
}

export function categoryTrends(txns: Transaction[]): CategoryTrend[] {
  const months = Array.from(new Set(expensesOnly(txns).map((t) => monthKey(t.date)))).sort();
  if (months.length === 0) return [];
  const current = months[months.length - 1];
  const previous = months.length > 1 ? months[months.length - 2] : null;

  const totalsFor = (month: string) => {
    const map = new Map<Category, number>();
    for (const t of expensesOnly(txns)) {
      if (monthKey(t.date) !== month) continue;
      map.set(t.category, (map.get(t.category) ?? 0) + Math.abs(t.amount));
    }
    return map;
  };

  const curTotals = totalsFor(current);
  const prevTotals = previous ? totalsFor(previous) : new Map<Category, number>();
  const categories = new Set([...curTotals.keys(), ...prevTotals.keys()]);

  return Array.from(categories)
    .map((category) => {
      const currentMonth = Math.round((curTotals.get(category) ?? 0) * 100) / 100;
      const previousMonth = Math.round((prevTotals.get(category) ?? 0) * 100) / 100;
      const pctChange = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : null;
      return { category, currentMonth, previousMonth, pctChange };
    })
    .sort((a, b) => b.currentMonth - a.currentMonth);
}

export function overallStats(txns: Transaction[]) {
  const exp = expensesOnly(txns);
  const total = exp.reduce((a, t) => a + Math.abs(t.amount), 0);
  const income = txns.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0);
  const catTotals = categoryTotals(txns);
  const top = catTotals[0] ?? null;
  const least = catTotals[catTotals.length - 1] ?? null;
  const repeated = mostRepeatedMerchant(txns);
  const months = new Set(exp.map((t) => monthKey(t.date))).size || 1;
  return {
    totalSpent: Math.round(total * 100) / 100,
    totalIncome: Math.round(income * 100) / 100,
    net: Math.round((income - total) * 100) / 100,
    avgPerMonth: Math.round((total / months) * 100) / 100,
    topCategory: top,
    leastCategory: least,
    mostRepeatedMerchant: repeated,
    transactionCount: txns.length,
  };
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Parses a "YYYY-MM-DD" date as a local calendar date (not UTC midnight)
// so the weekday matches what the user actually sees on their statement.
function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function spendingByWeekday(txns: Transaction[]): { day: string; total: number }[] {
  const totals = new Array(7).fill(0);
  for (const t of expensesOnly(txns)) {
    const day = parseLocalDate(t.date).getDay();
    totals[day] += Math.abs(t.amount);
  }
  // Order Mon -> Sun, which reads more naturally than starting on Sunday.
  const order = [1, 2, 3, 4, 5, 6, 0];
  return order.map((day) => ({ day: WEEKDAY_LABELS[day], total: Math.round(totals[day] * 100) / 100 }));
}

export function incomeVsExpenseByMonth(txns: Transaction[]): { month: string; income: number; expense: number }[] {
  const map = new Map<string, { income: number; expense: number }>();
  for (const t of txns) {
    const key = monthKey(t.date);
    if (!map.has(key)) map.set(key, { income: 0, expense: 0 });
    const cur = map.get(key)!;
    if (t.amount > 0) cur.income += t.amount;
    else if (t.category !== "Income") cur.expense += Math.abs(t.amount);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, v]) => ({
      month,
      income: Math.round(v.income * 100) / 100,
      expense: Math.round(v.expense * 100) / 100,
    }));
}

// Running total of spend across the (already filtered) transaction set,
// in date order — shows the shape of a burn-down within the selected range
// rather than just a per-month bucket total.
export function cumulativeSpending(txns: Transaction[]): { date: string; cumulative: number }[] {
  const sorted = [...expensesOnly(txns)].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  let running = 0;
  const byDate = new Map<string, number>();
  for (const t of sorted) {
    running += Math.abs(t.amount);
    byDate.set(t.date, Math.round(running * 100) / 100);
  }
  return Array.from(byDate.entries()).map(([date, cumulative]) => ({ date, cumulative }));
}