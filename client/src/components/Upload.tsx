import { useCallback, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { parseFile, detectColumns, rowsToTransactions } from "@/lib/parse";
import { buildLearnedCategoryMap } from "@/lib/categorize";
import type { Document, Transaction } from "@/lib/types";
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  FileType,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

type ItemStage = "parsing" | "preview" | "error";

interface UploadItem {
  id: string;
  file: File;
  stage: ItemStage;
  progressText: string;
  preview?: { txns: Transaction[]; skipped: number; warning?: string };
  pendingDoc?: Omit<Document, "included" | "transactionCount">;
  error?: string;
  expanded: boolean;
}

export function Upload() {
  const { addDocument, transactions } = useApp();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [committing, setCommitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const processFile = useCallback(
    async (id: string, file: File) => {
      try {
        const { rows, warning } = await parseFile(file, (status) => updateItem(id, { progressText: status }));
        const mapping = detectColumns(rows);
        if (!mapping.dateKey || !mapping.descKey || (!mapping.amountKey && !mapping.debitKey && !mapping.creditKey)) {
          updateItem(id, {
            stage: "error",
            error:
              "We couldn't confidently detect date, description, and amount columns in this file. Try exporting your statement with clearer headers (Date, Description, Amount).",
          });
          return;
        }
        const ext = file.name.split(".").pop()?.toLowerCase();
        const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        // Merchants the user has already categorized (manually or otherwise)
        // take priority over the static keyword rules for this new import.
        const learnedMap = buildLearnedCategoryMap(transactions);
        const { txns, skipped } = rowsToTransactions(rows, mapping, docId, learnedMap);
        updateItem(id, {
          stage: "preview",
          pendingDoc: {
            id: docId,
            name: file.name,
            type: (ext === "xls" ? "xlsx" : ext) as Document["type"],
            uploadedAt: new Date().toISOString(),
            status: txns.length > 0 ? "ready" : "issue",
            note: warning,
          },
          preview: { txns, skipped, warning },
        });
      } catch (e) {
        updateItem(id, {
          stage: "error",
          error: e instanceof Error ? e.message : "Something went wrong reading that file.",
        });
      }
    },
    [updateItem, transactions]
  );

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;
      const newItems: UploadItem[] = files.map((file) => ({
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        stage: "parsing",
        progressText: "Reading file…",
        expanded: false,
      }));
      setItems((prev) => [...prev, ...newItems]);
      // Process sequentially — OCR is CPU-heavy, so running several PDFs at
      // once would just make every one of them slower.
      (async () => {
        for (const item of newItems) {
          await processFile(item.id, item.file);
        }
      })();
    },
    [processFile]
  );

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function toggleExpanded(id: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, expanded: !it.expanded } : it)));
  }

  async function addAllToDashboard() {
    const ready = items.filter((it) => it.stage === "preview" && it.preview && it.pendingDoc);
    if (ready.length === 0) return;
    setCommitting(true);
    try {
      for (const item of ready) {
        await addDocument(
          { name: item.pendingDoc!.name, type: item.pendingDoc!.type, note: item.pendingDoc!.note },
          item.preview!.txns.map(({ date, description, merchant, amount, category }) => ({
            date,
            description,
            merchant,
            amount,
            category,
          }))
        );
      }
      setItems((prev) => prev.filter((it) => !ready.some((r) => r.id === it.id)));
    } finally {
      setCommitting(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const readyCount = items.filter((it) => it.stage === "preview").length;
  const parsingCount = items.filter((it) => it.stage === "parsing").length;

  return (
    <div className="space-y-6 p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Import</p>
        <h1 className="font-display text-3xl tracking-tight">Add bank statements</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Drop in one or several statements at once. CSV and Excel files parse instantly. PDF statements are read
          directly when they contain real text, and automatically fall back to in-browser OCR for scanned/image-based
          statements (common with some banks) — either way, nothing leaves your browser.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-14 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border bg-card"
        }`}
      >
        <UploadCloud size={30} className="mb-3 text-primary" />
        <p className="font-display text-lg">Drag statements here</p>
        <p className="mb-4 text-sm text-muted-foreground">or choose one or more files from your computer</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
          }}
        />
        <Button onClick={() => inputRef.current?.click()}>Choose files</Button>
        <div className="mt-6 flex items-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <FileSpreadsheet size={14} /> CSV
          </span>
          <span className="flex items-center gap-1.5">
            <FileSpreadsheet size={14} /> XLSX
          </span>
          <span className="flex items-center gap-1.5">
            <FileType size={14} /> PDF (text or scanned)
          </span>
        </div>
      </div>

      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <UploadItemCard
              key={item.id}
              item={item}
              onRemove={() => removeItem(item.id)}
              onToggleExpand={() => toggleExpanded(item.id)}
            />
          ))}

          {readyCount > 0 && (
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={addAllToDashboard} disabled={committing} className="font-medium">
                {committing
                  ? "Adding…"
                  : `Add ${readyCount} ${readyCount === 1 ? "file" : "files"} to dashboard`}
              </Button>
              {parsingCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {parsingCount} more still {parsingCount === 1 ? "is" : "are"} being read…
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UploadItemCard({
  item,
  onRemove,
  onToggleExpand,
}: {
  item: UploadItem;
  onRemove: () => void;
  onToggleExpand: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-3 p-4">
        <FileText size={18} className="shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.file.name}</p>
          <p className="text-xs text-muted-foreground">
            {item.stage === "parsing" && item.progressText}
            {item.stage === "preview" &&
              `${item.preview!.txns.length} transactions detected${
                item.preview!.skipped > 0 ? ` · ${item.preview!.skipped} rows skipped` : ""
              }`}
            {item.stage === "error" && "Couldn't import this file"}
          </p>
        </div>
        {item.stage === "parsing" && <Loader2 size={18} className="shrink-0 animate-spin text-muted-foreground" />}
        {item.stage === "preview" && <CheckCircle2 size={18} className="shrink-0 text-primary" />}
        {item.stage === "error" && <AlertCircle size={18} className="shrink-0 text-destructive" />}
        {item.stage === "preview" && (
          <button
            onClick={onToggleExpand}
            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label={item.expanded ? "Collapse preview" : "Expand preview"}
          >
            {item.expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
        <button
          onClick={onRemove}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive"
          aria-label={`Remove ${item.file.name}`}
        >
          <X size={16} />
        </button>
      </div>

      {item.stage === "error" && item.error && (
        <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">{item.error}</div>
      )}

      {item.stage === "preview" && item.preview?.warning && (
        <div className="flex items-start gap-2 border-t border-border bg-accent/5 px-4 py-3 text-xs text-muted-foreground">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-accent" />
          <p>{item.preview.warning}</p>
        </div>
      )}

      {item.stage === "preview" && item.expanded && (
        <div className="max-h-72 overflow-y-auto border-t border-border">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 border-b border-border bg-card">
              <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {item.preview!.txns.slice(0, 50).map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 font-mono-data text-xs">{t.date}</td>
                  <td className="max-w-xs truncate px-4 py-2">{t.description}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{t.category}</td>
                  <td className={`px-4 py-2 text-right font-mono-data text-xs ${t.amount < 0 ? "" : "text-primary"}`}>
                    {t.amount < 0 ? "-" : "+"}${Math.abs(t.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}