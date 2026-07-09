import { useState } from "react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp, logIn } from "@/lib/auth";
import { useApp } from "@/context/AppContext";
import { ArrowLeft } from "lucide-react";

export function AuthForm({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const { setSession } = useApp();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = mode === "login" ? await logIn(username, password) : await signUp(username, displayName, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await setSession(result.user);
    onSuccess();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <Logo className="mb-8" />
        <h1 className="font-display text-2xl">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">
          {mode === "login" ? "Log in to see your dashboard." : "It only takes a moment."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="jane_doe"
              required
              autoComplete="username"
            />
          </div>
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Jane"
                autoComplete="name"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full font-medium" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? "New to Ledgerline?" : "Already have an account?"}{" "}
          <button
            className="font-medium text-primary underline-offset-2 hover:underline"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
            }}
          >
            {mode === "login" ? "Create an account" : "Log in"}
          </button>
        </p>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Demo-grade auth: your password is hashed with bcrypt on the server, never stored in plain text. Don't reuse a
          sensitive password here.
        </p>
      </div>
    </div>
  );
}
