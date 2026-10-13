import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Bell,
  CalendarDays,
  CreditCard,
  ThumbsUp as Facebook,
  Home,
  Inbox,
  Camera as Instagram,
  Briefcase as Linkedin,
  Menu,
  MessageCircle,
  PenSquare,
  Plus,
  Radar,
  Search,
  Settings,
  Sparkles,
  TrendingDown,
  TrendingUp,
  AtSign as Twitter,
  Users,
  UsersRound,
  AlertTriangle,
  Clock,
  X,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home — SocialOS" },
      { name: "description", content: "Your social media overview: reach, engagement, inbox and AI suggestions." },
      { property: "og:title", content: "Home — SocialOS" },
      { property: "og:description", content: "Your social media overview powered by AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const nav = [
  { label: "Home", icon: Home, active: true },
  { label: "Composer", icon: PenSquare },
  { label: "Calendar", icon: CalendarDays },
  { label: "Inbox", icon: Inbox, badge: 12 },
  { label: "Monitoring", icon: Radar },
  { label: "Analytics", icon: BarChart3 },
  { label: "Community", icon: UsersRound },
  { label: "Team", icon: Users },
  { label: "Billing", icon: CreditCard },
  { label: "Settings", icon: Settings },
];

const stats = [
  { label: "Total followers", value: "48.2K", delta: 6.4 },
  { label: "Engagement rate", value: "5.8%", delta: 1.2 },
  { label: "Posts this month", value: "34", delta: 12 },
  { label: "Unreplied messages", value: "12", delta: -18 },
];

const growth = Array.from({ length: 14 }, (_, i) => ({
  day: `Oct ${i + 1}`,
  reach: Math.round(4200 + i * 310 + Math.sin(i) * 900),
  engagement: Math.round(900 + i * 70 + Math.cos(i) * 260),
}));

const sentiment = [
  { name: "Positive", value: 64, color: "var(--success)" },
  { name: "Neutral", value: 26, color: "var(--muted-foreground)" },
  { name: "Negative", value: 10, color: "var(--destructive)" },
];

const accounts = [
  { name: "Instagram", icon: Instagram, followers: "21.4K", status: "Connected" },
  { name: "Facebook", icon: Facebook, followers: "12.9K", status: "Connected" },
  { name: "LinkedIn", icon: Linkedin, followers: "8.1K", status: "Connected" },
  { name: "X", icon: Twitter, followers: "5.8K", status: "Reconnect" },
];

const upcoming = [
  { time: "Today, 6:30 PM", text: "Diwali sale teaser — 30% off everything 🪔", platform: Instagram },
  { time: "Tomorrow, 10:00 AM", text: "Behind the scenes: how our team packs orders", platform: Facebook },
  { time: "Oct 16, 1:00 PM", text: "Hiring: Senior Growth Marketer (Bengaluru)", platform: Linkedin },
];

const suggestions = [
  "Post a Reel between 7–9 PM today — your audience is 2.3× more active then.",
  "3 comments on yesterday's post look like buying intent. Draft replies?",
  "Trending in your niche: #FestiveDeals — create a post with it.",
];

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar p-4 transition-transform lg:static lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-8 flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">SocialOS</span>
          </div>
          <button className="lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((n) => (
            <button
              key={n.label}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                n.active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
              {n.badge && (
                <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                  {n.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Pro plan · ₹499/mo</p>
          <p className="mt-1 text-sm font-medium">312 / 500 AI calls today</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[62%] bg-gradient-primary" />
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:px-8">
          <button className="lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden flex-1 items-center gap-2 rounded-xl border border-input bg-card px-3 py-2 md:flex md:max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search posts, messages…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative rounded-xl p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
            </button>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-sm font-semibold">RK</div>
          </div>
        </header>

        <div className="space-y-6 p-4 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Good evening, Rahul</p>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Brewly Coffee overview</h1>
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Plus className="h-4 w-4" /> Create post with AI
            </button>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p>
              <span className="font-medium">Mention spike:</span>{" "}
              <span className="text-muted-foreground">negative mentions are at 18% in the last hour (alert at 30%). Watching closely.</span>
            </p>
          </div>

          <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {stats.map((s, i) =>
              loading ? (
                <div key={s.label} className="skeleton h-28" />
              ) : (
                <div
                  key={s.label}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="animate-rise rounded-xl border border-border bg-card p-5 shadow-soft transition-colors hover:border-primary/40"
                >
                  <p className="text-xs text-muted-foreground md:text-sm">{s.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">{s.value}</p>
                  <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${s.delta >= 0 ? "text-success" : "text-destructive"}`}>
                    {s.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(s.delta)}% vs last month
                  </p>
                </div>
              ),
            )}
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <Card title="Reach & engagement" subtitle="Last 14 days" className="xl:col-span-2">
              {loading ? (
                <div className="skeleton h-64" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growth} margin={{ left: -20, right: 8 }}>
                      <defs>
                        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="day" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" }}
                      />
                      <Area type="monotone" dataKey="reach" stroke="var(--chart-1)" strokeWidth={2} fill="url(#g1)" />
                      <Area type="monotone" dataKey="engagement" stroke="var(--chart-2)" strokeWidth={2} fill="url(#g2)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card title="Brand sentiment" subtitle="Mentions this week">
              {loading ? (
                <div className="skeleton h-64" />
              ) : (
                <div className="flex h-64 flex-col">
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={sentiment} dataKey="value" innerRadius="60%" outerRadius="85%" paddingAngle={3} stroke="none">
                          {sentiment.map((s) => (
                            <Cell key={s.name} fill={s.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-around text-xs">
                    {sentiment.map((s) => (
                      <div key={s.name} className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                        {s.name} <span className="text-muted-foreground">{s.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <Card title="AI suggestions" subtitle="Based on your audience" icon={<Sparkles className="h-4 w-4 text-primary" />}>
              <ul className="space-y-3">
                {suggestions.map((s) => (
                  <li key={s} className="group rounded-xl border border-border bg-secondary/50 p-3 text-sm transition-colors hover:border-primary/40">
                    {s}
                    <button className="mt-2 block text-xs font-semibold text-accent-foreground opacity-80 group-hover:opacity-100">
                      Do it →
                    </button>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Upcoming posts" subtitle="Next 3 scheduled">
              <ul className="space-y-3">
                {upcoming.map((p) => (
                  <li key={p.text} className="flex gap-3 rounded-xl p-2 transition-colors hover:bg-secondary/60">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent">
                      <p.platform className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.text}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {p.time}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Connected accounts" subtitle="4 of 5 platforms">
              <ul className="space-y-2">
                {accounts.map((a) => (
                  <li key={a.name} className="flex items-center gap-3 rounded-xl p-2 hover:bg-secondary/60">
                    <a.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{a.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{a.followers}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.status === "Connected" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {a.status}
                    </span>
                  </li>
                ))}
              </ul>
              <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-input py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
                <MessageCircle className="h-4 w-4" /> Connect Google Business
              </button>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}

function Card({
  title,
  subtitle,
  icon,
  className = "",
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 shadow-soft ${className}`}>
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <div>
          <h2 className="font-semibold">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}
