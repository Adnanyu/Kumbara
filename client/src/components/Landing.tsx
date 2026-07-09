import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  PieChart,
  Sparkles,
  ShieldCheck,
  MessageSquareText,
  AlertTriangle,
  SlidersHorizontal,
  FolderCog,
} from "lucide-react";

const FEATURES = [
  {
    icon: UploadCloud,
    title: "Drop in any statement",
    body: "Upload CSV, Excel, or PDF exports from your bank. We detect the columns and line items automatically.",
  },
  {
    icon: PieChart,
    title: "See it from every angle",
    body: "Filter and aggregate by date, category, account, or amount across a dashboard of purpose-built charts.",
  },
  {
    icon: Sparkles,
    title: "Auto-categorized",
    body: "Every transaction is sorted into categories like Grocery, Gas, Subscriptions, and Insurance — no manual tagging.",
  },
  {
    icon: AlertTriangle,
    title: "Catches what you'd miss",
    body: "Kumbara flags unusual charges and surfaces month-over-month trends before they become a habit.",
  },
  {
    icon: MessageSquareText,
    title: "Ask it anything",
    body: "A built-in assistant answers questions about your spending and suggests concrete ways to save.",
  },
  {
    icon: FolderCog,
    title: "You stay in control",
    body: "Manage every upload — include or exclude any statement from your totals at any time.",
  },
];

export function Landing({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <Button onClick={onGetStarted} variant="outline" className="font-medium">
          Log in
        </Button>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 pb-20 pt-8 md:grid-cols-2 md:pt-16">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Statement in, clarity out
          </p>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight md:text-6xl">
            Where your money went, <span className="italic text-primary">line by line.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            Upload a bank statement and Kumbara turns it into a categorized, searchable dashboard —
            with trends, anomalies, and an assistant that actually knows your numbers.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button onClick={onGetStarted} size="lg" className="font-medium">
              Create your free account
            </Button>
            <span className="text-sm text-muted-foreground">No bank connection required.</span>
          </div>
        </div>

        <StatementMock />
      </section>

      {/* Feature grid */}
      <section className="border-t border-border bg-card/60">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 flex items-end justify-between border-b border-border pb-6">
            <h2 className="font-display text-3xl tracking-tight">Everything a statement can tell you</h2>
            <span className="hidden font-mono-data text-xs text-muted-foreground md:block">01 / SIX CORE TOOLS</span>
          </div>
          <div className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="group">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md border border-border bg-background text-primary transition-colors group-hover:border-primary">
                  <f.icon size={20} strokeWidth={1.75} />
                </div>
                <h3 className="mb-2 font-display text-lg">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security note */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col items-start gap-6 rounded-lg border border-border bg-card p-8 md:flex-row md:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 className="font-display text-lg">Built with your privacy in mind</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Your statements are parsed in your browser and stored under your own account. Passwords are never
              stored in plain text. This is a personal finance tool, not a bank — always review your real
              statements for anything account-critical.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-20 text-center">
          <SlidersHorizontal className="text-primary" size={28} />
          <h2 className="font-display text-3xl tracking-tight">Ready to see your spending clearly?</h2>
          <Button onClick={onGetStarted} size="lg" className="font-medium">
            Get started — it's free
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Kumbara — a demo expense intelligence app. Not a substitute for professional financial advice.
      </footer>
    </div>
  );
}

function StatementMock() {
  const rows = [
    { label: "Whole Foods Market", cat: "Grocery", amt: "-$84.12" },
    { label: "Shell Gas #4471", cat: "Gas", amt: "-$41.30" },
    { label: "Netflix", cat: "Subscriptions", amt: "-$15.49" },
    { label: "Direct Deposit", cat: "Income", amt: "+$2,410.00" },
  ];
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="perforated rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-mono-data text-[11px] uppercase tracking-widest text-muted-foreground">
            July Statement
          </span>
          <span className="stamp rounded border border-primary/40 px-2 py-0.5 font-mono-data text-[10px] text-primary">
            reviewed
          </span>
        </div>
        <div className="ledger-rule mb-4" />
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between text-sm">
              <div>
                <p className="leading-tight">{r.label}</p>
                <p className="text-[11px] text-muted-foreground">{r.cat}</p>
              </div>
              <span
                className={`font-mono-data text-sm ${r.amt.startsWith("+") ? "text-primary" : "text-foreground"}`}
              >
                {r.amt}
              </span>
            </li>
          ))}
        </ul>
        <div className="ledger-rule my-4" />
        <div className="flex items-end justify-between">
          <span className="text-xs text-muted-foreground">Auto-categorized in seconds</span>
          <div className="flex items-end gap-1">
            {[14, 22, 10, 30, 18, 26].map((h, i) => (
              <div key={i} className="w-2 rounded-sm bg-primary/70" style={{ height: `${h}px` }} />
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-lg border border-border bg-secondary/40" />
    </div>
  );
}
