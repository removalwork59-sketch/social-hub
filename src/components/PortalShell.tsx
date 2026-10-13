import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bell, LogOut, Menu, Search, Sparkles, X, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type PortalNavItem = { to: string; label: string; icon: LucideIcon; exact?: boolean };

/** Shared shell for Super Admin and Partner portals. `to` values must be existing routes. */
export function PortalShell({ badge, nav, children }: { badge: string; nav: PortalNavItem[]; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const item = "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors";

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      {open && <div className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar p-3 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-6 flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">SocialOS</p>
              <p className="text-[11px] font-medium uppercase tracking-wider text-accent-foreground">{badge}</p>
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {nav.map((n) => (
            <Link
              key={n.to}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              to={n.to as any}
              activeOptions={{ exact: !!n.exact }}
              onClick={() => setOpen(false)}
              className={`${item} text-muted-foreground hover:bg-secondary hover:text-foreground`}
              activeProps={{ className: "!bg-sidebar-accent !text-sidebar-accent-foreground" }}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <Link to="/dashboard" className={`${item} text-muted-foreground hover:bg-secondary hover:text-foreground`}>
          <ArrowLeft className="h-4 w-4" /> Back to workspace
        </Link>
        <button onClick={signOut} className={`${item} text-muted-foreground hover:bg-secondary hover:text-foreground`}>
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden flex-1 items-center gap-2 rounded-xl border border-input bg-card px-3 py-2 md:flex md:max-w-xs">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input placeholder="Search…" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <button className="relative ml-auto rounded-xl p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
          </button>
        </header>
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
