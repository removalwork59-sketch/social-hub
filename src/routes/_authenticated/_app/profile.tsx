import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace";
import { cardCls, freeNav, memberNav, ownerNav } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — SocialOS" }, { name: "description", content: "Your profile and menu." }] }),
  component: Profile,
});

function Section({ title, children, open: initial = true }: { title: string; children: React.ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(initial);
  return (
    <div className={`${cardCls} p-0`}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-4 text-sm font-semibold">
        {title}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && <div className="border-t border-border">{children}</div>}
    </div>
  );
}

function Profile() {
  const { current, role } = useWorkspace();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; email: string }>({ name: "", email: "" });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase.from("profiles").select("full_name").eq("id", data.user.id).maybeSingle();
      setUser({ name: p?.full_name ?? "", email: data.user.email ?? "" });
    });
  }, []);

  const nav = role === "member" ? memberNav : current?.plan === "free" ? freeNav : ownerNav;
  const main = ["/dashboard", "/composer", "/scheduler", "/inbox"];
  const more = nav.filter((n) => !main.includes(n.to));

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className={`${cardCls} flex items-center gap-4`}>
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-primary text-xl font-semibold text-primary-foreground">{(user.name || "U")[0]?.toUpperCase()}</div>
        <div className="min-w-0">
          <p className="truncate font-semibold">{user.name || "Your profile"}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-xs capitalize text-accent-foreground">{current?.name} · {role ?? "…"} · {current?.plan} plan</p>
        </div>
      </div>

      <Section title="Menu">
        {more.map((n) => (
          <Link key={n.to} to={n.to} className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-secondary/50">
            <n.icon className="h-4 w-4 text-muted-foreground" /> {n.label}
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </Section>

      <Section title="Account">
        {role !== "member" && (
          <Link to={current?.plan === "free" ? "/upgrade" : "/billing"} className="flex items-center px-4 py-3 text-sm hover:bg-secondary/50">
            Billing & plan <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Link>
        )}
        <Link to="/settings" className="flex items-center px-4 py-3 text-sm hover:bg-secondary/50">
          Settings <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
        </Link>
      </Section>

      <button onClick={signOut} className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10">
        <LogOut className="h-4 w-4" /> Log out
      </button>
    </div>
  );
}
