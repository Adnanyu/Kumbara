import { useCallback, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { parseFile, detectColumns, rowsToTransactions } from "@/lib/parse";
import type { Document, Transaction } from "@/lib/types";
import { UploadCloud, FileSpreadsheet, FileText, FileType, CheckCircle2, AlertCircle } from "lucide-react";

type Stage = "idle" | "parsing" | "preview" | "error";

export function Upload() {
  const { addDocument } = useApp();
  const [stage, setStage] = useState<Stage>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [preview, setPreview] = useState<{ txns: Transaction[]; skipped: number; warning?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDoc, setPendingDoc] = useState<Omit<Document, "included" | "transactionCount"> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setStage("parsing");
    setError(null);
    setFileName(file.name);
    try {
      const { rows, warning } = await parseFile(file);
      const mapping = detectColumns(rows);
      if (!mapping.dateKey || !mapping.descKey || (!mapping.amountKey && !mapping.debitKey && !mapping.creditKey)) {
        setError(
          "We couldn't confidently detect date, description, and amount columns in this file. Try exporting your statement with clearer headers (Date, Description, Amount)."
        );
        setStage("error");
        return;
      }
      const ext = file.name.split(".").pop()?.toLowerCase();
      const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const { txns, skipped } = rowsToTransactions(rows, mapping, docId);
      setPendingDoc({
        id: docId,
        name: file.name,
        type: (ext === "xls" ? "xlsx" : ext) as Document["type"],
        uploadedAt: new Date().toISOString(),
        status: txns.length > 0 ? "ready" : "issue",
        note: warning,
      });
      setPreview({ txns, skipped, warning });
      setStage("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong reading that file.");
      setStage("error");
    }
  }, []);

  async function confirmImport() {
    if (!pendingDoc || !preview) return;
    await addDocument(
      { name: pendingDoc.name, type: pendingDoc.type, note: pendingDoc.note },
      preview.txns.map(({ date, description, merchant, amount, category }) => ({
        date,
        description,
        merchant,
        amount,
        category,
      }))
    );
    reset();
  }

  function reset() {
    setStage("idle");
    setPreview(null);
    setPendingDoc(null);
    setError(null);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Import</p>
        <h1 className="font-display text-3xl tracking-tight">Add a bank statement</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          CSV and Excel files parse reliably. PDF support is best-effort — for scanned or complex statements, export
          CSV or Excel from your bank for the most accurate results.
        </p>
      </div>

      {stage !== "preview" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-14 text-center transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border bg-card"
          }`}
        >
          <UploadCloud size={30} className="mb-3 text-primary" />
          <p className="font-display text-lg">Drag a statement here</p>
          <p className="mb-4 text-sm text-muted-foreground">or choose a file from your computer</p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <Button onClick={() => inputRef.current?.click()} disabled={stage === "parsing"}>
            {stage === "parsing" ? "Reading file…" : "Choose file"}
          </Button>
          <div className="mt-6 flex items-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <FileSpreadsheet size={14} /> CSV
            </span>
            <span className="flex items-center gap-1.5">
              <FileSpreadsheet size={14} /> XLSX
            </span>
            <span className="flex items-center gap-1.5">
              <FileType size={14} /> PDF (beta)
            </span>
          </div>
        </div>
      )}

      {stage === "error" && error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Couldn't import {fileName}</p>
            <p className="mt-1 text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={reset}>
              Try another file
            </Button>
          </div>
        </div>
      )}

      {stage === "preview" && preview && pendingDoc && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <FileText size={20} className="text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">{fileName}</p>
              <p className="text-xs text-muted-foreground">
                {preview.txns.length} transactions detected
                {preview.skipped > 0 ? ` · ${preview.skipped} rows skipped` : ""}
              </p>
            </div>
            <CheckCircle2 size={18} className="text-primary" />
          </div>

          {preview.warning && (
            <div className="flex items-start gap-3 rounded-lg border border-accent/40 bg-accent/5 p-4 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
              <p className="text-muted-foreground">{preview.warning}</p>
            </div>
          )}

          <div className="max-h-80 overflow-y-auto rounded-lg border border-border">
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
                {preview.txns.slice(0, 50).map((t) => (
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

          <div className="flex gap-3">
            <Button onClick={confirmImport} className="font-medium">
              Add to dashboard
            </Button>
            <Button variant="outline" onClick={reset}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
