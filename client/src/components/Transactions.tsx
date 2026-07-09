import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { FilterBar, applyFilters } from "./FilterBar";
import { CATEGORIES, CATEGORY_COLORS, type Filters, type Category } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EMPTY_FILTERS: Filters = { start: null, end: null, categories: [], minAmount: null, maxAmount: null, search: "" };

export function Transactions() {
  const { includedTransactions, updateTransactionCategory } = useApp();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sortDesc, setSortDesc] = useState(true);

  const filtered = useMemo(() => {
    const list = applyFilters(includedTransactions, filters);
    return [...list].sort((a, b) => (sortDesc ? (a.date < b.date ? 1 : -1) : a.date > b.date ? 1 : -1));
  }, [includedTransactions, filters, sortDesc]);

  return (
    <div className="space-y-6 p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Ledger</p>
        <h1 className="font-display text-3xl tracking-tight">All transactions</h1>
        <p className="mt-1 text-sm text-muted-foreground">{filtered.length} of {includedTransactions.length} shown</p>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-card">
            <tr className="text-xs uppercase tracking-wide text-muted-foreground">
              <th className="cursor-pointer select-none px-4 py-3" onClick={() => setSortDesc(!sortDesc)}>
                Date {sortDesc ? "↓" : "↑"}
              </th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  No transactions match these filters.
                </td>
              </tr>
            )}
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-border bg-card/40 last:border-0 hover:bg-card">
                <td className="px-4 py-2.5 font-mono-data text-xs text-muted-foreground">{t.date}</td>
                <td className="px-4 py-2.5">
                  <p className="leading-tight">{t.description}</p>
                  {t.isAnomaly && <span className="text-[11px] text-destructive">Flagged as unusual</span>}
                </td>
                <td className="px-4 py-2.5">
                  <Select value={t.category} onValueChange={(v) => updateTransactionCategory(t.id, v as Category)}>
                    <SelectTrigger className="h-7 w-36 border-none bg-transparent px-2 text-xs shadow-none">
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[t.category] }} />
                        <SelectValue />
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className={`px-4 py-2.5 text-right font-mono-data text-xs ${t.amount < 0 ? "" : "text-primary"}`}>
                  {t.amount < 0 ? "-" : "+"}${Math.abs(t.amount).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
