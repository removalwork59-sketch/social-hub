import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Building2, FileBarChart, IndianRupee, Plus, Send, UserCheck, Users } from "lucide-react";
import { PageHeader, btnPrimary } from "@/components/AppShell";
import { Panel, SampleNote, Stat, axisTick, inr, tooltipStyle } from "@/components/portal-ui";
import { mrrSeries, services } from "@/lib/sample-data";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Overview — SocialOS Admin" }, { name: "description", content: "Platform overview for super admins." }] }),
  component: Overview,
});

const activity = [
  ["New partner registered: ABC Agency", "5m ago"],
  ["Payment received: ₹4,25,000", "1h ago"],
  ["AI latency spike detected", "2h ago"],
  ["New client added: XYZ Corp", "4h ago"],
  ["System backup completed", "6h ago"],
];
const dot = (s: string) => (s === "healthy" ? "bg-success" : s === "degraded" ? "bg-warning" : "bg-destructive");

function Overview() {
  const [range, setRange] = useState<6 | 12>(6);
  const stats = [
    { label: "Total partners", value: 12, icon: Building2, trend: 8 },
    { label: "Total clients", value: 48, icon: Users, trend: 12 },
    { label: "MRR", value: inr(425000), icon: IndianRupee, trend: 9 },
    { label: "Posts published", value: "1,240", icon: Send, trend: 15 },
    { label: "Server uptime", value: "99.97%", icon: Activity },
    { label: "Registered users", value: "5,420", icon: UserCheck, trend: 6 },
  ];
  const chart = mrrSeries.slice(-range);
  const outline = "inline-flex items-center gap-1.5 rounded-xl border border-input px-3 py-2 text-sm font-medium hover:bg-secondary";
  return (
    <>
      <PageHeader
        subtitle="Platform owner"
        title="Overview"
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/partners" className={btnPrimary}><Plus className="h-4 w-4" /> Add Partner</Link>
            <Link to="/admin/clients" className={outline}><Plus className="h-4 w-4" /> Add Client</Link>
            <Link to="/admin/revenue" className={outline}><FileBarChart className="h-4 w-4" /> View Reports</Link>
          </div>
        }
      />
      <SampleNote>Sample platform figures for demo purposes.</SampleNote>
      <section className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s, i) => <Stat key={s.label} {...s} i={i} />)}
      </section>
      <section className="mt-4 grid gap-4 lg:grid-cols-5">
        <Panel
          title="MRR growth"
          subtitle={`Last ${range} months`}
          className="lg:col-span-3"
          action={
            <div className="flex rounded-xl border border-input p-0.5 text-xs">
              {([6, 12] as const).map((r) => (
                <button key={r} onClick={() => setRange(r)} className={`rounded-lg px-2.5 py-1 ${range === r ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>{r} months</button>
              ))}
            </div>
          }
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ left: 0, right: 8 }}>
                <defs>
                  <linearGradient id="mrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 100000 ? `₹${v / 100000}L` : `₹${v / 1000}K`)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => inr(v)} />
                <Area type="monotone" dataKey="mrr" name="MRR" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#mrr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Services" subtitle="Last checked: 30s ago" className="lg:col-span-2">
          <ul className="divide-y divide-border">
            {services.map((s) => (
              <li key={s.name} className="flex items-center gap-3 py-2.5 text-sm">
                <span className={`h-2.5 w-2.5 rounded-full ${dot(s.status)}`} />
                <span className="flex-1">{s.name}</span>
                <span className={`tabular-nums ${s.status === "degraded" ? "text-warning" : "text-muted-foreground"}`}>{s.latency}ms{s.status === "degraded" && " · slow"}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </section>
      <Panel title="Recent activity" className="mt-4">
        <ul className="divide-y divide-border">
          {activity.map(([t, a]) => (
            <li key={t} className="flex items-center gap-3 rounded-lg px-1 py-3 text-sm hover:bg-secondary/40">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="flex-1">{t}</span>
              <span className="text-xs text-muted-foreground">{a}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
