import { Logo } from "./Logo";
import { useApp } from "@/context/AppContext";
import { LayoutDashboard, Receipt, UploadCloud, Settings, MessageSquareText, LogOut } from "lucide-react";
import type { ReactNode } from "react";

export type View = "dashboard" | "transactions" | "upload" | "settings" | "assistant";

const NAV: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", icon: Receipt },
  { id: "upload", label: "Upload", icon: UploadCloud },
  { id: "assistant", label: "Assistant", icon: MessageSquareText },
  { id: "settings", label: "Settings", icon: Settings },
];

export function DashboardShell({
  view,
  onNavigate,
  children,
}: {
  view: View;
  onNavigate: (v: View) => void;
  children: ReactNode;
}) {
  const { user, logout } = useApp();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card px-4 py-6">
        <div className="mb-8 px-2">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon size={16} strokeWidth={1.75} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-border pt-4">
          <div className="mb-3 px-2">
            <p className="text-sm font-medium leading-tight">{user?.displayName}</p>
            <p className="font-mono-data text-[11px] text-muted-foreground">@{user?.username}</p>
          </div>
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <LogOut size={16} strokeWidth={1.75} />
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
