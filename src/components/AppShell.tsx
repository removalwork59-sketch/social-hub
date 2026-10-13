import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3, Bell, UserCircle, FileBarChart, History, Building2, ClipboardList, ShieldCheck, UsersRound, Zap, CalendarDays, CreditCard, Home, Inbox, Link2, LogOut, Menu, PanelLeftClose, PanelLeftOpen,
  PenSquare, Plus, Radar, Search, Settings, Sparkles, Users, X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace";

const mobileNav = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/composer", label: "Composer", icon: PenSquare },
  { to: "/scheduler", label: "Calendar", icon: CalendarDays },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/profile", label: "Profile", icon: UserCircle },
] as const;
const ownerNav = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/composer", label: "Composer", icon: PenSquare },
  { to: "/scheduler", label: "Calendar", icon: CalendarDays },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/monitoring", label: "Monitoring", icon: Radar },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/community", label: "Community", icon: UsersRound },
  { to: "/team", label: "Team", icon: Users },
  { to: "/accounts", label: "Accounts", icon: Link2 },
  { to: "/billing", label: "Billing", icon: CreditCard },
  { to: "/activity", label: "Activity log", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;
const memberNav = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/composer", label: "Composer", icon: PenSquare },
  { to: "/scheduler", label: "Calendar", icon: CalendarDays },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/tasks", label: "Tasks", icon: ClipboardList },
] as const;
const freeNav = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/composer", label: "Composer", icon: PenSquare },
  { to: "/scheduler", label: "Calendar", icon: CalendarDays },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/upgrade", label: "Upgrade", icon: Zap },
] as const;

export { ownerNav, memberNav, freeNav };

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [allRead, setAllRead] = useState(false);
  const { workspaces, current, setCurrentId, refresh, role } = useWorkspace();
  const { data: userName } = useQuery({
    queryKey: ["my-name"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("profiles").select("full_name").eq("id", u.user!.id).single();
      return data?.full_name ?? u.user!.email ?? "Account";
    },
  });
  const { data: unread } = useQuery({
    queryKey: ["inbox-unread", current?.id],
    enabled: !!current?.id,
    queryFn: async () => {
      const { count } = await supabase.from("inbox_messages").select("id", { count: "exact", head: true }).eq("workspace_id", current!.id).eq("status", "open");
      return count ?? 0;
    },
  });
  const nav = role === "member" ? memberNav : current?.plan === "free" ? freeNav : ownerNav;
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function newWorkspace() {
    const name = prompt("Client workspace name");
    if (!name?.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("workspaces")
      .insert({ name: name.trim(), owner_id: u.user!.id })
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    refresh();
    setCurrentId(data.id);
    toast.success(`Workspace "${data.name}" created`);
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const { data: isAdmin } = useQuery({
    queryKey: ["is-super-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.rpc("has_role", { _user_id: u.user!.id, _role: "super_admin" });
      return !!data;
    },
  });

  const item = "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors";

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      {open && (
        <div className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar p-3 transition-all lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "lg:w-[72px]" : "lg:w-64"}`}
      >
        <div className="mb-6 flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-primary shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && <span className="text-lg font-semibold tracking-tight">SocialOS</span>}
          </div>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              title={n.label}
              onClick={() => setOpen(false)}
              className={`${item} text-muted-foreground hover:bg-secondary hover:text-foreground`}
              activeProps={{ className: "!bg-sidebar-accent !text-sidebar-accent-foreground" }}
            >
              <n.icon className="h-4 w-4 shrink-0" />
              {!collapsed && n.label}
              {n.to === "/inbox" && !!unread && (
                <span className={`rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground ${collapsed ? "absolute ml-3 -mt-4" : "ml-auto"}`}>{unread > 99 ? "99+" : unread}</span>
              )}
            </Link>
          ))}
        </nav>

        {isAdmin && (
          <div className="mb-1 border-t border-sidebar-border pt-2">
            <Link to="/admin" title="Super Admin" className={`${item} text-accent-foreground hover:bg-secondary`}>
              <ShieldCheck className="h-4 w-4 shrink-0" /> {!collapsed && "Super Admin"}
            </Link>
            <Link to="/partner" title="Partner portal" className={`${item} text-accent-foreground hover:bg-secondary`}>
              <Building2 className="h-4 w-4 shrink-0" /> {!collapsed && "Partner portal"}
            </Link>
          </div>
        )}
        {current?.plan === "free" && (
          <Link to="/upgrade" title="Upgrade" onClick={() => setOpen(false)} className={`${item} text-accent-foreground hover:bg-secondary`}>
            <Zap className="h-4 w-4 shrink-0" />
            {!collapsed && <>Upgrade <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">Pro</span></>}
          </Link>
        )}
        <button onClick={signOut} title="Sign out" className={`${item} text-muted-foreground hover:bg-secondary hover:text-foreground`}>
          <LogOut className="h-4 w-4 shrink-0" /> {!collapsed && "Sign out"}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`${item} hidden text-muted-foreground hover:bg-secondary hover:text-foreground lg:flex`}
          aria-label="Collapse sidebar"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && "Collapse"}
        </button>
      </aside>

      <main className="min-w-0 flex-1 pb-20 lg:pb-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden flex-1 items-center gap-2 rounded-xl border border-input bg-card px-3 py-2 md:flex md:max-w-xs">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input placeholder="Search…" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <select
              aria-label="Workspace"
              value={current?.id ?? ""}
              onChange={(e) => setCurrentId(e.target.value)}
              className="max-w-40 rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <button onClick={newWorkspace} aria-label="New workspace" className="rounded-xl border border-input p-2 text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
              <Plus className="h-4 w-4" />
            </button>
            <div className="relative">
              <button onClick={() => setBellOpen((v) => !v)} className="relative rounded-xl p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {!allRead && <span className="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full bg-destructive" />}
              </button>
              {bellOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setBellOpen(false)} />
                  <div className="absolute right-0 z-40 mt-2 w-72 rounded-xl border border-border bg-card p-1.5 shadow-soft">
                    <div className="flex items-center justify-between border-b border-border px-3 py-2">
                      <p className="text-sm font-semibold">Notifications</p>
                      <button onClick={() => setAllRead(true)} className="text-xs font-medium text-accent-foreground hover:underline">Mark all as read</button>
                    </div>
                    {[
                      ["New comment from @john_doe", "2m"],
                      ["Payment received ₹499", "1h"],
                      ["Post published successfully", "3h"],
                      ["New follower on Instagram", "5h"],
                      ["AI generated 3 new post ideas", "1d"],
                    ].map(([t, a]) => (
                      <div key={t} className="flex items-start gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary">
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${allRead ? "bg-transparent" : "bg-primary"}`} />
                        <span className={`flex-1 ${allRead ? "text-muted-foreground" : ""}`}>{t}</span>
                        <span className="text-xs text-muted-foreground">{a}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                aria-label="Profile menu"
                className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
              >
                {(current?.name ?? "S").slice(0, 1).toUpperCase()}
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 z-40 mt-2 w-52 rounded-xl border border-border bg-card p-1.5 shadow-soft">
                    <div className="border-b border-border px-3 py-2">
                      <p className="truncate text-sm font-semibold">{userName ?? "Account"}</p>
                      <p className="truncate text-xs text-muted-foreground">{current?.name}</p>
                    </div>
                    {([
                      { to: "/profile", label: "Profile", icon: UserCircle },
                      { to: "/settings", label: "Settings", icon: Settings },
                      { to: "/billing", label: "Billing", icon: CreditCard },
                      { to: "/upgrade", label: "Upgrade", icon: Zap },
                    ] as const).map((m) => (
                      <Link key={m.to} to={m.to} onClick={() => setProfileOpen(false)} className="mt-0.5 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
                        <m.icon className="h-4 w-4" /> {m.label}
                      </Link>
                    ))}
                    <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <div className="p-4 md:p-8">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-border bg-sidebar/95 py-2 backdrop-blur lg:hidden">
        {mobileNav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="flex flex-col items-center gap-0.5 px-3 text-[11px] text-muted-foreground"
            activeProps={{ className: "!text-primary" }}
          >
            <n.icon className="h-5 w-5" />
            {n.label.split(" ")[0]}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string | undefined; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      </div>
      {action}
    </div>
  );
}

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
export const inputCls =
  "w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";
export const cardCls = "rounded-xl border border-border bg-card p-5 shadow-soft";
