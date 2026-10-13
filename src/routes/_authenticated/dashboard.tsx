import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, Link2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { platformLabel, useWorkspace } from "@/lib/workspace";
import { PageHeader, btnPrimary, cardCls } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Home — SocialOS" }, { name: "description", content: "Workspace overview." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { current } = useWorkspace();
  const wsId = current?.id;
  const { data, isLoading } = useQuery({
    queryKey: ["overview", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const [acc, posts] = await Promise.all([
        supabase.from("social_accounts").select("*").eq("workspace_id", wsId!),
        supabase.from("posts").select("*").eq("workspace_id", wsId!).order("scheduled_at"),
      ]);
      return { accounts: acc.data ?? [], posts: posts.data ?? [] };
    },
  });

  const now = Date.now();
  const upcoming = (data?.posts ?? []).filter((p) => p.scheduled_at && new Date(p.scheduled_at).getTime() > now);
  const stats = [
    { label: "Connected accounts", value: data?.accounts.length ?? 0 },
    { label: "Scheduled posts", value: upcoming.length },
    { label: "Total posts", value: data?.posts.length ?? 0 },
    { label: "Plan", value: (current?.plan ?? "free").toUpperCase() },
  ];

  return (
    <>
      <PageHeader
        subtitle="Workspace overview"
        title={current?.name ?? "…"}
        action={
          <Link to="/scheduler" className={btnPrimary}>
            <Plus className="h-4 w-4" /> Schedule a post
          </Link>
        }
      />
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s, i) =>
          isLoading || !wsId ? (
            <div key={s.label} className="skeleton h-24" />
          ) : (
            <div key={s.label} style={{ animationDelay: `${i * 60}ms` }} className={`${cardCls} animate-rise`}>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-2 text-2xl font-semibold">{s.value}</p>
            </div>
          ),
        )}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className={cardCls}>
          <h2 className="mb-4 font-semibold">Upcoming posts</h2>
          {upcoming.length === 0 ? (
            <Empty icon={CalendarDays} text="Nothing scheduled yet." cta="Open scheduler" to="/scheduler" />
          ) : (
            <ul className="space-y-2">
              {upcoming.slice(0, 5).map((p) => (
                <li key={p.id} className="rounded-xl p-2 hover:bg-secondary/60">
                  <p className="truncate text-sm font-medium">{p.content}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {new Date(p.scheduled_at!).toLocaleString()} ·{" "}
                    {p.platforms.map(platformLabel).join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={cardCls}>
          <h2 className="mb-4 font-semibold">Social accounts</h2>
          {(data?.accounts.length ?? 0) === 0 ? (
            <Empty icon={Link2} text="No accounts connected." cta="Connect an account" to="/accounts" />
          ) : (
            <ul className="space-y-2">
              {data!.accounts.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-xl p-2 text-sm hover:bg-secondary/60">
                  <span className="font-medium">{platformLabel(a.platform)}</span>
                  <span className="text-muted-foreground">@{a.handle}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}

function Empty({ icon: Icon, text, cta, to }: { icon: typeof Link2; text: string; cta: string; to: "/scheduler" | "/accounts" }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-accent">
        <Icon className="h-5 w-5 text-accent-foreground" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{text}</p>
      <Link to={to} className="mt-2 text-sm font-semibold text-accent-foreground">
        {cta} →
      </Link>
    </div>
  );
}
