import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { FilterBar, applyFilters } from "./FilterBar";
import type { Filters } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/types";
import {
  monthlyTotals,
  categoryTotals,
  topMerchants,
  categoryByMonth,
  categoryTrends,
  detectAnomalies,
  overallStats,
} from "@/lib/analytics";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Repeat, TrendingUp, AlertTriangle, Trophy, TrendingDown } from "lucide-react";

const EMPTY_FILTERS: Filters = { start: null, end: null, categories: [], minAmount: null, maxAmount: null, search: "" };

export function Dashboard() {
  const { includedTransactions, documents } = useApp();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const filtered = useMemo(() => applyFilters(includedTransactions, filters), [includedTransactions, filters]);

  const stats = useMemo(() => overallStats(filtered), [filtered]);
  const monthly = useMemo(() => monthlyTotals(filtered), [filtered]);
  const byCategory = useMemo(() => categoryTotals(filtered), [filtered]);
  const merchants = useMemo(() => topMerchants(filtered, 7), [filtered]);
  const trendByMonth = useMemo(() => categoryByMonth(filtered), [filtered]);
  const trends = useMemo(() => categoryTrends(filtered).slice(0, 5), [filtered]);
  const anomalies = useMemo(() => detectAnomalies(filtered).slice(0, 5), [filtered]);

  const hasData = includedTransactions.length > 0;
  const topCatKeys = byCategory.slice(0, 6).map((c) => c.category);

  if (!hasData) {
    return (
      <div className="p-8">
        <EmptyState hasDocuments={documents.length > 0} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Overview</p>
        <h1 className="font-display text-3xl tracking-tight">Your spending, at a glance</h1>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total spent"
          value={`$${stats.totalSpent.toLocaleString()}`}
          icon={ArrowDownRight}
          tone="destructive"
        />
        <StatCard label="Total income" value={`$${stats.totalIncome.toLocaleString()}`} icon={ArrowUpRight} tone="primary" />
        <StatCard
          label="Net"
          value={`${stats.net >= 0 ? "+" : "-"}$${Math.abs(stats.net).toLocaleString()}`}
          icon={stats.net >= 0 ? TrendingUp : TrendingDown}
          tone={stats.net >= 0 ? "primary" : "destructive"}
        />
        <StatCard label="Avg / month" value={`$${stats.avgPerMonth.toLocaleString()}`} icon={Repeat} tone="muted" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6 lg:col-span-2">
          <h3 className="font-display text-base">Spending over time</h3>
          <p className="mb-4 text-xs text-muted-foreground">Total expenses per month</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid hsl(var(--border))" }}
                formatter={((v: number) => [`$${v.toLocaleString()}`, "Spent"]) as any}
              />
              <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="url(#spendFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-display text-base">By category</h3>
          <p className="mb-4 text-xs text-muted-foreground">Share of total spend</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={byCategory}
                dataKey="total"
                nameKey="category"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
              >
                {byCategory.map((entry) => (
                  <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category]} />
                ))}
              </Pie>
              <Tooltip formatter={((v: number, n: string) => [`$${v.toLocaleString()}`, n]) as any} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid max-h-24 grid-cols-2 gap-x-3 gap-y-1 overflow-y-auto text-xs">
            {byCategory.slice(0, 8).map((c) => (
              <div key={c.category} className="flex items-center gap-1.5 truncate">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c.category] }} />
                <span className="truncate text-muted-foreground">{c.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-display text-base">Top merchants</h3>
          <p className="mb-4 text-xs text-muted-foreground">Where your money went most</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={merchants} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
              <YAxis
                dataKey="merchant"
                type="category"
                width={110}
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip formatter={((v: number) => [`$${v.toLocaleString()}`, "Spent"]) as any} />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-display text-base">Category trend</h3>
          <p className="mb-4 text-xs text-muted-foreground">Monthly spend by top categories</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trendByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={((v: number) => `$${Number(v).toLocaleString()}`) as any} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {topCatKeys.map((cat) => (
                <Bar key={cat} dataKey={cat} stackId="a" fill={CATEGORY_COLORS[cat]} radius={[2, 2, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <InsightCard icon={Trophy} title="Biggest category" tone="destructive">
          {stats.topCategory ? (
            <>
              <p className="font-display text-2xl">{stats.topCategory.category}</p>
              <p className="text-sm text-muted-foreground">
                ${stats.topCategory.total.toLocaleString()} across {stats.topCategory.count} transactions
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Not enough data yet.</p>
          )}
        </InsightCard>

        <InsightCard icon={Repeat} title="Most repeated" tone="primary">
          {stats.mostRepeatedMerchant ? (
            <>
              <p className="font-display text-2xl">{stats.mostRepeatedMerchant.merchant}</p>
              <p className="text-sm text-muted-foreground">{stats.mostRepeatedMerchant.count} transactions</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Not enough data yet.</p>
          )}
        </InsightCard>

        <InsightCard icon={TrendingDown} title="Smallest category" tone="muted">
          {stats.leastCategory ? (
            <>
              <p className="font-display text-2xl">{stats.leastCategory.category}</p>
              <p className="text-sm text-muted-foreground">${stats.leastCategory.total.toLocaleString()} total</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Not enough data yet.</p>
          )}
        </InsightCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-destructive" />
            <h3 className="font-display text-base">Anomalies detected</h3>
          </div>
          {anomalies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No unusual transactions found in this range.</p>
          ) : (
            <ul className="space-y-3">
              {anomalies.map((a) => (
                <li key={a.id} className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-0">
                  <div>
                    <p>{a.merchant}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.date} · {a.category}
                    </p>
                  </div>
                  <span className="font-mono-data text-destructive">${Math.abs(a.amount).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            <h3 className="font-display text-base">Month-over-month trend</h3>
          </div>
          {trends.length === 0 ? (
            <p className="text-sm text-muted-foreground">Upload more than one month of data to see trends.</p>
          ) : (
            <ul className="space-y-3">
              {trends.map((t) => (
                <li key={t.category} className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-0">
                  <span>{t.category}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-mono-data">${t.currentMonth.toLocaleString()}</span>
                    {t.pctChange !== null && (
                      <span className={`font-mono-data text-xs ${t.pctChange > 0 ? "text-destructive" : "text-primary"}`}>
                        {t.pctChange > 0 ? "+" : ""}
                        {t.pctChange.toFixed(0)}%
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof ArrowDownRight;
  tone: "primary" | "destructive" | "muted";
}) {
  const toneClass =
    tone === "primary" ? "text-primary" : tone === "destructive" ? "text-destructive" : "text-muted-foreground";
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon size={15} className={toneClass} />
      </div>
      <p className="font-mono-data text-2xl">{value}</p>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  title,
  tone,
  children,
}: {
  icon: typeof Trophy;
  title: string;
  tone: "primary" | "destructive" | "muted";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "primary" ? "text-primary" : tone === "destructive" ? "text-destructive" : "text-muted-foreground";
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-2 flex items-center gap-2">
        <Icon size={15} className={toneClass} />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ hasDocuments }: { hasDocuments: boolean }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Nothing here yet</p>
      <h2 className="font-display text-3xl">
        {hasDocuments ? "All your statements are excluded" : "Upload a statement to get started"}
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {hasDocuments
          ? "Head to Settings and include at least one uploaded document to see your dashboard."
          : "Head to the Upload tab and add a CSV, Excel, or PDF bank statement to see your dashboard come to life."}
      </p>
    </div>
  );
}
