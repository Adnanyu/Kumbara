import { useState } from "react";
import { AppProvider, useApp } from "@/context/AppContext";
import { Landing } from "@/components/Landing";
import { AuthForm } from "@/components/AuthForm";
import { DashboardShell, type View } from "@/components/DashboardShell";
import { Dashboard } from "@/components/Dashboard";
import { Transactions } from "@/components/Transactions";
import { Upload } from "@/components/Upload";
import { SettingsPage } from "@/components/SettingsPage";
import { Assistant } from "@/components/Assistant";

type Route = "landing" | "auth" | "app";

function Root() {
  const { user, authLoading } = useApp();
  const [route, setRoute] = useState<Route>("landing");
  const [view, setView] = useState<View>("dashboard");

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (user) {
    return (
      <DashboardShell view={view} onNavigate={setView}>
        {view === "dashboard" && <Dashboard />}
        {view === "transactions" && <Transactions />}
        {view === "upload" && <Upload />}
        {view === "settings" && <SettingsPage />}
        {view === "assistant" && <Assistant />}
      </DashboardShell>
    );
  }

  if (route === "auth") {
    return (
      <AuthForm
        onBack={() => setRoute("landing")}
        onSuccess={() => setView("dashboard")}
      />
    );
  }

  return <Landing onGetStarted={() => setRoute("auth")} />;
}

function App() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  );
}

export default App;
