import { useRef, useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { askFinanceAssistant, type ChatMessage } from "@/lib/claude";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Info } from "lucide-react";

const SUGGESTIONS = [
  "Where is most of my money going this month?",
  "How can I cut my spending on Dining?",
  "Did anything unusual show up in my transactions?",
  "Give me 3 practical ways to save $200 a month.",
];

export function Assistant() {
  const { includedTransactions } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    setError(null);
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);
    try {
      const reply = await askFinanceAssistant(text, includedTransactions, messages);
      setMessages([...nextMessages, { role: "assistant", content: reply }]);
    } catch {
      setError("The assistant couldn't respond just now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const hasData = includedTransactions.length > 0;

  return (
    <div className="flex h-screen flex-col p-8">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Assistant</p>
        <h1 className="font-display text-3xl tracking-tight">Ask about your money</h1>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info size={12} /> Your transaction summary is sent to Claude to answer your question. This isn't licensed
          financial advice.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-lg border border-border bg-card p-6">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Sparkles className="mb-3 text-primary" size={24} />
            <p className="font-display text-lg">
              {hasData ? "Ask me anything about your spending" : "Upload a statement to unlock the assistant"}
            </p>
            {hasData && (
              <div className="mt-5 grid max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-md border border-border px-3 py-2 text-left text-xs text-muted-foreground hover:border-primary hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] whitespace-pre-wrap rounded-lg px-4 py-2.5 text-sm ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-background"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-muted-foreground">
              Thinking…
            </div>
          </div>
        )}
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-4 flex items-end gap-2"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder={hasData ? "Ask about a category, merchant, or trend…" : "Upload a statement first"}
          disabled={!hasData || busy}
          className="min-h-[44px] flex-1 resize-none"
        />
        <Button type="submit" disabled={!hasData || busy || !input.trim()} size="icon">
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}
