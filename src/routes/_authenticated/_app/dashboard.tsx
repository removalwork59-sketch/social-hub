import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AtSign,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Lock,
  Camera,
  Heart,
  MessageCircle,
  PenSquare,
  Send,
  Sparkles,
  ThumbsUp,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { type Platform, useWorkspace } from "@/lib/workspace";
import { PageHeader, btnPrimary, cardCls } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/_app/dashboard")({
  head: () => ({ meta: [{ title: "Home — SocialOS" }, { name: "description", content: "Workspace overview." }] }),
  component: Dashboard,
});

const lines = [
  { key: "facebook", label: "Facebook", color: "var(--chart-2)", icon: ThumbsUp },
  { key: "instagram", label: "Instagram", color: "var(--chart-4)", icon: Camera },
  { key: "linkedin", label: "LinkedIn", color: "var(--chart-3)", icon: Briefcase },
  { key: "twitter", label: "X", color: "var(--chart-1)", icon: AtSign },
] as const;
const iconFor = (p: string) => lines.find((l) => l.key === p)?.icon ?? AtSign;

const series = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(Date.now() - (29 - i) * 864e5);
  return {
    day: d.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
    facebook: Math.round(420 + i * 9 + Math.sin(i / 2) * 80),
    instagram: Math.round(680 + i * 14 + Math.cos(i / 3) * 120),
    linkedin: Math.round(210 + i * 5 + Math.sin(i / 4) * 40),
    twitter: Math.round(300 + i * 6 + Math.cos(i / 2) * 70),
  };
});

const sentiment = [
  { name: "Positive", value: 812, color: "var(--success)" },
  { name: "Neutral", value: 341, color: "var(--muted-foreground)" },
  { name: "Negative", value: 97, color: "var(--destructive)" },
];
const totalMentions = sentiment.reduce((a, b) => a + b.value, 0);

const activity = [
  { p: "instagram", user: "john_doe", text: "commented on your post", ago: "2m", icon: MessageCircle },
  { p: "facebook", user: "priya.s", text: "liked your Diwali offer", ago: "14m", icon: Heart },
  { p: "linkedin", user: "arjun_m", text: "shared your hiring post", ago: "1h", icon: Send },
  { p: "twitter", user: "techdaily", text: "mentioned your brand", ago: "3h", icon: AtSign },
  { p: "instagram", user: "neha.k", text: "sent you a message", ago: "5h", icon: MessageCircle },
];

const aiPosts: { id: number; platform: Platform; caption: string; hue: string }[] = [
  { id: 1, platform: "instagram", caption: "Festive season is here ✨ Grab 30% off everything this week only. #FestiveDeals", hue: "var(--chart-4)" },
  { id: 2, platform: "linkedin", caption: "We grew 3× this year. Here are 5 lessons from building a remote-first team.", hue: "var(--chart-3)" },
  { id: 3, platform: "facebook", caption: "Behind the scenes: how our team packs 500 orders a day 📦", hue: "var(--chart-2)" },
];

function Dashboard() {
  const { current, role } = useWorkspace();
  const navigate = useNavigate();
  useEffect(() => {
    if (current && role === "owner" && !current.onboarded) navigate({ to: "/onboarding" });
  }, [current, role, navigate]);
  if (role === "member") return <MemberHome />;
  return <OwnerHome />;
}

function OwnerHome() {
  const { current } = useWorkspace();
  const isFree = current?.plan === "free";
  const qc = useQueryClient();
  const wsId = current?.id;
  const [shown, setShown] = useState<Record<string, boolean>>({ facebook: true, instagram: true, linkedin: true, twitter: true });
  const [skipped, setSkipped] = useState<number[]>([]);
  const [chatOpen, setChatOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["overview", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase.from("posts").select("id, scheduled_at, created_at").eq("workspace_id", wsId!);
      return data ?? [];
    },
  });
  const now = new Date();
  const thisMonth = (data ?? []).filter((p) => {
    const d = new Date(p.scheduled_at ?? p.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const scheduled = (data ?? []).filter((p) => p.scheduled_at && new Date(p.scheduled_at) > now).length;

  const stats = [
    { label: "Total followers", value: "48.2K", trend: "+12%", icon: Users },
    { label: "Engagement rate", value: "5.8%", trend: "+5%", icon: TrendingUp },
    { label: "Posts this month", value: thisMonth, icon: PenSquare },
    { label: "Scheduled posts", value: scheduled, icon: CalendarClock },
  ];

  async function approve(p: (typeof aiPosts)[number]) {
    if (!wsId) return;
    const at = new Date(Date.now() + 864e5);
    at.setHours(18, 0, 0, 0);
    const { error } = await supabase
      .from("posts")
      .insert({ workspace_id: wsId, content: p.caption, platforms: [p.platform], scheduled_at: at.toISOString() });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Scheduled for tomorrow, 6 PM");
    setSkipped((s) => [...s, p.id]);
    qc.invalidateQueries({ queryKey: ["overview"] });
    qc.invalidateQueries({ queryKey: ["posts"] });
  }

  const visibleAi = aiPosts.filter((p) => !skipped.includes(p.id)).slice(0, isFree ? 1 : 3);
  const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" };

  return (
    <>
      <PageHeader subtitle="Welcome back" title={current?.name ?? "…"} />
      {isFree && (
        <div className="mb-4 flex flex-col gap-3 overflow-hidden rounded-xl bg-gradient-primary p-5 text-primary-foreground shadow-glow sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="font-semibold">You're on the Free plan</p>
            <p className="text-sm opacity-90">Unlock unlimited posts, 5 platforms and AI replies with Pro — ₹499/month.</p>
          </div>
          <Link to="/upgrade" className="rounded-xl bg-background px-4 py-2 text-center text-sm font-semibold text-foreground transition-transform hover:-translate-y-0.5">Upgrade now</Link>
        </div>
      )}

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s, i) =>
          isLoading || !wsId ? (
            <div key={s.label} className="skeleton h-28" />
          ) : (
            <div
              key={s.label}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`${cardCls} animate-rise transition-all hover:-translate-y-0.5 hover:border-primary/40`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground md:text-sm">{s.label}</p>
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent">
                  <s.icon className="h-4 w-4 text-accent-foreground" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{s.value}</p>
              {s.trend && (
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-success">
                  <TrendingUp className="h-3 w-3" /> {s.trend} this month
                </p>
              )}
            </div>
          ),
        )}
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className={`${cardCls} lg:col-span-3`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold">Engagement</h2>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {lines.map((l) => (
                <button
                  key={l.key}
                  onClick={() => setShown({ ...shown, [l.key]: !shown[l.key] })}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                    shown[l.key] ? "border-input text-foreground" : "border-transparent text-muted-foreground opacity-50"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ left: -20, right: 8 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                {lines.map((l) =>
                  shown[l.key] ? (
                    <Line key={l.key} type="monotone" dataKey={l.key} name={l.label} stroke={l.color} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                  ) : null,
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${cardCls} lg:col-span-2`}>
          <h2 className="font-semibold">Sentiment</h2>
          <p className="text-xs text-muted-foreground">Brand mentions this month</p>
          <div className="relative h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sentiment} dataKey="value" innerRadius="62%" outerRadius="88%" paddingAngle={3} stroke="none">
                  {sentiment.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-2xl font-semibold">{totalMentions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">mentions</p>
              </div>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            {sentiment.map((s) => (
              <div key={s.name} className="rounded-lg bg-secondary/60 py-2">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </div>
                <p className="mt-0.5 font-semibold">{Math.round((s.value / totalMentions) * 100)}%</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className={`${cardCls} lg:col-span-3`}>
          <h2 className="mb-3 font-semibold">Recent activity</h2>
          <ul className="divide-y divide-border">
            {activity.map((a, i) => {
              const P = iconFor(a.p);
              return (
                <li key={i} className="flex items-center gap-3 rounded-lg px-1 py-3 transition-colors hover:bg-secondary/40">
                  <div className="relative">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-xs font-semibold uppercase">
                      {a.user.slice(0, 2)}
                    </div>
                    <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-card bg-accent">
                      <P className="h-2.5 w-2.5 text-accent-foreground" />
                    </span>
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm">
                    <span className="font-medium">@{a.user}</span> <span className="text-muted-foreground">{a.text}</span>
                  </p>
                  <span className="shrink-0 text-xs text-muted-foreground">{a.ago} ago</span>
                </li>
              );
            })}
          </ul>
          <button className="mt-2 text-sm font-semibold text-accent-foreground hover:underline">View all →</button>
        </div>

        <div className={`${cardCls} lg:col-span-2`}>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">AI ready to publish</h2>
          </div>
          {visibleAi.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">All caught up. Generate more ideas below.</p>
          ) : (
            <ul className="space-y-3">
              {visibleAi.map((p) => {
                const P = iconFor(p.platform);
                return (
                  <li key={p.id} className="animate-rise rounded-xl border border-border bg-secondary/40 p-3">
                    <div className="flex gap-3">
                      <div
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-lg"
                        style={{ background: `color-mix(in oklab, ${p.hue} 30%, transparent)` }}
                      >
                        <P className="h-5 w-5" style={{ color: p.hue }} />
                      </div>
                      <p className="line-clamp-2 text-sm">{p.caption}</p>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => approve(p)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                        Approve
                      </button>
                      <Link to="/scheduler" className="rounded-lg border border-input px-3 py-1.5 text-xs font-medium hover:bg-secondary">
                        Edit
                      </Link>
                      <button onClick={() => setSkipped((s) => [...s, p.id])} className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
                        Skip
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {isFree ? (
            <Link to="/upgrade" className={`${btnPrimary} mt-4 w-full`}><Lock className="h-4 w-4" /> More AI ideas with Pro</Link>
          ) : (
            <button onClick={() => setSkipped([])} className={`${btnPrimary} mt-4 w-full`}>
              <Sparkles className="h-4 w-4" /> Generate more
            </button>
          )}
        </div>
      </section>

      <button
        onClick={() => setChatOpen(true)}
        aria-label="Open AI assistant"
        className="fixed bottom-20 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-gradient-primary shadow-glow transition-transform hover:scale-105 lg:bottom-6"
      >
        <Sparkles className="h-6 w-6 text-primary-foreground" />
      </button>

      {chatOpen && <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" onClick={() => setChatOpen(false)} />}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-border bg-card shadow-soft transition-transform duration-300 ${chatOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">AI assistant</h2>
          </div>
          <button onClick={() => setChatOpen(false)} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
          <div className="rounded-xl bg-secondary p-3">Hi! I can write posts, suggest hashtags and find the best time to post. What would you like to do?</div>
          {["Write a festive offer post", "Best time to post this week", "Hashtags for coffee brand"].map((q) => (
            <button key={q} className="block w-full rounded-xl border border-input p-2.5 text-left transition-colors hover:border-primary">
              {q}
            </button>
          ))}
        </div>
        <div className="border-t border-border p-3">
          <input placeholder="Ask anything… (AI coming soon)" disabled className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" />
        </div>
      </aside>
    </>
  );
}

function MemberHome() {
  const { current, userId } = useWorkspace();
  const { data, isLoading } = useQuery({
    queryKey: ["member-home", current?.id, userId],
    enabled: !!current && !!userId,
    queryFn: async () => {
      const [posts, tasks, inbox] = await Promise.all([
        supabase.from("posts").select("*").eq("workspace_id", current!.id).eq("created_by", userId!).order("scheduled_at"),
        supabase.from("tasks").select("*").eq("workspace_id", current!.id).eq("assigned_to", userId!).eq("status", "todo"),
        supabase.from("inbox_messages").select("*").eq("workspace_id", current!.id).eq("assigned_to", userId!).eq("status", "open"),
      ]);
      return { posts: posts.data ?? [], tasks: tasks.data ?? [], inbox: inbox.data ?? [] };
    },
  });
  const today = new Date().toDateString();
  const pending = (data?.posts ?? []).filter((p) => p.status === "pending_approval");
  const todays = (data?.posts ?? []).filter((p) => p.scheduled_at && new Date(p.scheduled_at).toDateString() === today);
  const stats = [
    { label: "My posts", value: data?.posts.length ?? 0, icon: PenSquare },
    { label: "Pending approval", value: pending.length, icon: CalendarClock },
    { label: "Open tasks", value: data?.tasks.length ?? 0, icon: ClipboardList },
    { label: "Assigned messages", value: data?.inbox.length ?? 0, icon: MessageCircle },
  ];
  return (
    <>
      <PageHeader subtitle="Team member" title={current?.name ?? "…"} action={<Link to="/composer" className={btnPrimary}><PenSquare className="h-4 w-4" /> New post</Link>} />
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s, i) => isLoading ? <div key={s.label} className="skeleton h-24" /> : (
          <div key={s.label} style={{ animationDelay: `${i * 60}ms` }} className={`${cardCls} animate-rise`}>
            <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{s.label}</p><s.icon className="h-4 w-4 text-primary" /></div>
            <p className="mt-2 text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </section>
      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className={cardCls}>
          <h2 className="mb-3 font-semibold">Today's schedule</h2>
          {todays.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Nothing scheduled today.</p> : (
            <ul className="space-y-2">{todays.map((p) => <li key={p.id} className="flex gap-3 text-sm"><span className="w-14 shrink-0 font-semibold">{new Date(p.scheduled_at!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span><span className="truncate">{p.content}</span></li>)}</ul>
          )}
        </div>
        <div className={cardCls}>
          <h2 className="mb-3 font-semibold">Waiting for approval</h2>
          {pending.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No posts waiting.</p> : (
            <ul className="space-y-2">{pending.map((p) => <li key={p.id} className="flex items-center gap-2 text-sm"><span className="h-2 w-2 shrink-0 rounded-full bg-warning" /><span className="truncate">{p.content}</span></li>)}</ul>
          )}
        </div>
        <div className={`${cardCls} lg:col-span-2`}>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">My tasks</h2><Link to="/tasks" className="text-sm font-semibold text-accent-foreground">View all →</Link></div>
          {(data?.tasks.length ?? 0) === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">All done 🎉</p> : (
            <ul className="space-y-2">{data!.tasks.slice(0, 5).map((t) => <li key={t.id} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-muted-foreground" />{t.title}{t.due_date && <span className="ml-auto text-xs text-muted-foreground">Due {t.due_date}</span>}</li>)}</ul>
          )}
        </div>
      </section>
    </>
  );
}
