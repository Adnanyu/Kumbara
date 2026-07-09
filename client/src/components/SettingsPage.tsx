import { useApp } from "@/context/AppContext";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileType, Trash2 } from "lucide-react";

export function SettingsPage() {
  const { documents, toggleDocument, removeDocument, user } = useApp();

  return (
    <div className="space-y-8 p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Settings</p>
        <h1 className="font-display text-3xl tracking-tight">Manage your data</h1>
      </div>

      <section className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-6">
          <h2 className="font-display text-lg">Uploaded documents</h2>
          <p className="text-sm text-muted-foreground">
            Toggle a document off to exclude its transactions from your dashboard and totals without deleting it.
          </p>
        </div>
        {documents.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No documents uploaded yet.</p>
        ) : (
          <ul>
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-4 border-b border-border p-5 last:border-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                  {doc.type === "pdf" ? <FileType size={16} /> : <FileSpreadsheet size={16} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.transactionCount} transactions · uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                    {doc.status === "issue" && <span className="text-destructive"> · needs review</span>}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{doc.included ? "Included" : "Excluded"}</span>
                <Switch checked={doc.included} onCheckedChange={(v) => toggleDocument(doc.id, v)} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeDocument(doc.id)}
                  aria-label={`Delete ${doc.name}`}
                >
                  <Trash2 size={16} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-display text-lg">Account</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Display name</p>
            <p className="mt-0.5">{user?.displayName}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Username</p>
            <p className="mt-0.5 font-mono-data">@{user?.username}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-display text-lg">Privacy &amp; security</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>• Statements are parsed locally in your browser — raw files are never uploaded to a server.</li>
          <li>• Passwords are hashed with bcrypt on the server before being stored, never in plain text.</li>
          <li>• This is a demo-grade prototype: don't use a password you rely on elsewhere.</li>
        </ul>
      </section>
    </div>
  );
}
