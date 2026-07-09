import { CATEGORIES, type Category, type Filters } from "@/lib/types";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X } from "lucide-react";

export function FilterBar({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const activeCount =
    (filters.start ? 1 : 0) +
    (filters.end ? 1 : 0) +
    filters.categories.length +
    (filters.minAmount !== null ? 1 : 0) +
    (filters.maxAmount !== null ? 1 : 0);

  function toggleCategory(cat: Category) {
    const has = filters.categories.includes(cat);
    onChange({
      ...filters,
      categories: has ? filters.categories.filter((c) => c !== cat) : [...filters.categories, cat],
    });
  }

  function reset() {
    onChange({ start: null, end: null, categories: [], minAmount: null, maxAmount: null, search: "" });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <SlidersHorizontal size={13} /> Filters
      </div>

      <div className="flex items-center gap-1.5">
        <Input
          type="date"
          className="h-9 w-[150px] font-mono-data text-xs"
          value={filters.start ?? ""}
          onChange={(e) => onChange({ ...filters, start: e.target.value || null })}
        />
        <span className="text-xs text-muted-foreground">to</span>
        <Input
          type="date"
          className="h-9 w-[150px] font-mono-data text-xs"
          value={filters.end ?? ""}
          onChange={(e) => onChange({ ...filters, end: e.target.value || null })}
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            Category
            {filters.categories.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                {filters.categories.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-72 overflow-y-auto">
          {CATEGORIES.map((cat) => (
            <DropdownMenuCheckboxItem
              key={cat}
              checked={filters.categories.includes(cat)}
              onCheckedChange={() => toggleCategory(cat)}
            >
              {cat}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          placeholder="Min $"
          className="h-9 w-24 font-mono-data text-xs"
          value={filters.minAmount ?? ""}
          onChange={(e) => onChange({ ...filters, minAmount: e.target.value ? Number(e.target.value) : null })}
        />
        <Input
          type="number"
          placeholder="Max $"
          className="h-9 w-24 font-mono-data text-xs"
          value={filters.maxAmount ?? ""}
          onChange={(e) => onChange({ ...filters, maxAmount: e.target.value ? Number(e.target.value) : null })}
        />
      </div>

      <Input
        placeholder="Search description…"
        className="h-9 w-48 text-xs"
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
      />

      {activeCount > 0 && (
        <Button variant="ghost" size="sm" className="h-9 gap-1 text-muted-foreground" onClick={reset}>
          <X size={13} /> Clear
        </Button>
      )}
    </div>
  );
}

export function applyFilters<T extends { date: string; category: Category; amount: number; description: string }>(
  txns: T[],
  filters: Filters
): T[] {
  return txns.filter((t) => {
    if (filters.start && t.date < filters.start) return false;
    if (filters.end && t.date > filters.end) return false;
    if (filters.categories.length > 0 && !filters.categories.includes(t.category)) return false;
    if (filters.minAmount !== null && Math.abs(t.amount) < filters.minAmount) return false;
    if (filters.maxAmount !== null && Math.abs(t.amount) > filters.maxAmount) return false;
    if (filters.search && !t.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });
}
