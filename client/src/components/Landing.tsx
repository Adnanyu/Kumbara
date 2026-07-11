import { useEffect, useRef, useState } from "react";
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
  ImageOff,
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

// Swap `media` for a real screenshot/video path once assets are ready.
// mediaType controls whether it renders <img>, <video>, or the placeholder.
const WALKTHROUGH_STEPS = [
  {
    tag: "01",
    label: "UPLOAD",
    title: "Drop in a statement",
    body: "Drag in a CSV, Excel, or PDF export from your bank. Kumbara reads the columns and line items automatically — no template required.",
    icon: UploadCloud,
    media: "/walkthrough/upload.mp4",
    mediaType: "video" as const,
  },
  {
    tag: "02",
    label: "ANALYZE",
    title: "Watch it categorize itself",
    body: "Every transaction lands in a category — Grocery, Gas, Subscriptions — and rolls straight into the dashboard's charts.",
    icon: PieChart,
    media: "/walkthrough/show.mp4",
    mediaType: "video" as const,
  },
  {
    tag: "03",
    label: "CURATE",
    title: "Choose what counts",
    body: "Toggle any statement in or out of your totals. The charts recalculate instantly, so you're only ever looking at the numbers you trust.",
    icon: FolderCog,
    media: "/walkthrough/manage.mp4",
    mediaType: "video" as const,
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
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 pb-20 pt-8 md:grid-cols-2 md:pt-16 md:pl-6 md:pr-0">
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

        <img
          src="/walkthrough/heroSS.png"
          alt="Kumbara dashboard showing categorized transactions and spending charts"
          className="w-full md:w-[130%] md:max-w-none"
        />
      </section>

      {/* Walkthrough */}
      <Walkthrough />

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

function Walkthrough() {
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = stepRefs.current.findIndex((el) => el === entry.target);
            if (idx !== -1) setActiveIndex(idx);
          }
        });
      },
      {
        // Trigger when a step is roughly centered in the viewport.
        rootMargin: "-40% 0px -40% 0px",
        threshold: 0,
      }
    );

    stepRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const active = WALKTHROUGH_STEPS[activeIndex];

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-16 flex items-end justify-between border-b border-border pb-6">
          <h2 className="font-display text-3xl tracking-tight">How a statement becomes a dashboard</h2>
          <span className="hidden font-mono-data text-xs text-muted-foreground md:block">02 / THREE STEPS</span>
        </div>

        <div className="grid grid-cols-1 gap-16 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
          {/* Steps column */}
          {/* Steps column */}
          <div className="flex flex-col gap-64 md:gap-64">
            {WALKTHROUGH_STEPS.map((step, i) => (
              <div
                key={step.tag}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                className={`transition-opacity duration-500 ${
                  i === activeIndex ? "opacity-100" : "opacity-40"
                }`}
              >
                <span className="font-mono-data text-xs tracking-widest text-primary">
                  {step.tag} — {step.label}
                </span>
                <h3 className="my-8 font-display text-2xl tracking-tight">{step.title}</h3>
                <p className="my-8 max-w-sm text-base leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>

          {/* Sticky media column */}
          <div className="md:sticky md:top-24 md:self-start">
            <div className="perforated relative overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              {/* Tab strip */}
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div className="flex items-center gap-4">
                  {WALKTHROUGH_STEPS.map((step, i) => (
                    <span
                      key={step.tag}
                      className={`font-mono-data text-[10px] tracking-widest transition-colors ${
                        i === activeIndex ? "text-primary" : "text-muted-foreground/50"
                      }`}
                    >
                      {step.tag}
                    </span>
                  ))}
                </div>
                <span className="stamp rounded border border-primary/40 px-2 py-0.5 font-mono-data text-[10px] text-primary">
                  live preview
                </span>
              </div>

              {/* Media frame */}
              <div className="relative aspect-[16/10] w-full bg-secondary/30">
                {WALKTHROUGH_STEPS.map((step, i) => (
                  <div
                    key={step.tag}
                    className={`absolute inset-0 flex flex-col items-center justify-center gap-3 transition-opacity duration-500 ${
                      i === activeIndex ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                  >
                    {step.media ? (
                      step.mediaType === "video" ? (
                        <video
                          src={step.media}
                          className="h-full w-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        <img src={step.media} alt={step.title} className="h-full w-full object-cover" />
                      )
                    ) : (
                      <>
                        <div className="flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
                          <step.icon size={22} strokeWidth={1.5} />
                        </div>
                        <p className="font-mono-data text-[11px] uppercase tracking-widest text-muted-foreground">
                          {step.mediaType === "video" ? "Recording" : "Screenshot"} pending
                        </p>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                          <ImageOff size={12} />
                          {step.label.toLowerCase()} preview
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Progress dots for mobile, where sticky scroll feels less natural */}
            <div className="mt-4 flex justify-center gap-2 md:hidden">
              {WALKTHROUGH_STEPS.map((step, i) => (
                <span
                  key={step.tag}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeIndex ? "w-6 bg-primary" : "w-1.5 bg-border"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
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