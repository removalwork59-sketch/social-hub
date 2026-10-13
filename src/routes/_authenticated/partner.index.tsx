import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BadgeIndianRupee, IndianRupee, Palette, Plus, Repeat, Users, Wallet } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Panel, Pill, Stat, Table, axisTick, btnOutline, inr, tooltipStyle } from "@/components/portal-ui";
import { PLAN_PRICE, usePartnerData } from "@/lib/partner";
import { NotLinked } from "@/components/PartnerNotLinked";

export const Route = createFileRoute("/_authenticated/partner/")({
  component: Overview,
});

function Overview() {
  const { data, isLoading } = usePartnerData();
  if (isLoading) return <div className="skeleton h-64" />;
  if (!data?.partner) return <><PageHeader subtitle="Partner" title="Overview" /><NotLinked /></>;
  const { partner, clients, revenue, commission, pct } = data;

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const live = clients.filter((c) => new Date(c.created_at) < end);
    const rev = live.reduce((a, c) => a + (PLAN_PRICE[c.plan] ?? 0), 0);
    return { month: d.toLocaleDateString("en-IN", { month: "short" }), clients: live.length, revenue: rev, commission: Math.round((rev * pct) / 100) };
  });
  const paying = clients.filter((c) => c.plan !== "free");
  const top = [...clients].sort((a, b) => (PLAN_PRICE[b.plan] ?? 0) - (PLAN_PRICE[a.plan] ?? 0)).slice(0, 5);
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <PageHeader
        subtitle={today}
        title={`Welcome, ${partner.name}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/partner/clients" className={btnOutline}><Plus className="h-4 w-4" /> Add Client</Link>
            <Link to="/partner/branding" className={btnOutline}><Palette className="h-4 w-4" /> Customize Branding</Link>
            <Link to="/partner/billing" className={btnOutline}><Wallet className="h-4 w-4" /> View Payouts</Link>
          </div>
        }
      />
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="Total clients" value={clients.length} icon={Users} />
        <Stat label="Active subscriptions" value={paying.length} icon={Repeat} i={1} />
        <Stat label="MRR" value={inr(revenue)} icon={IndianRupee} i={2} />
        <Stat label="Commission this month" value={inr(commission)} icon={BadgeIndianRupee} i={3} />
      </section>
      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Client growth" subtitle="Last 6 months">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={months}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="clients" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Revenue & commission" subtitle="Last 6 months">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => inr(v)} cursor={{ fill: "var(--secondary)" }} />
                <Bar dataKey="revenue" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="commission" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </section>
      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Top clients" subtitle="By monthly revenue">
          {top.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No clients yet.</p> : (
            <Table head={["Client", "Plan", "Revenue / mo"]} rows={top.map((c) => [c.name, <Pill key="p" value={c.plan} />, inr(PLAN_PRICE[c.plan] ?? 0)])} />
          )}
        </Panel>
        <Panel title="Recent activity">
          {clients.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Activity appears as you add clients.</p> : (
            <ul className="divide-y divide-border text-sm">
              {clients.slice(0, 5).map((c) => (
                <li key={c.id} className="flex justify-between py-2.5"><span>New client added: <b>{c.name}</b></span><span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("en-IN")}</span></li>
              ))}
            </ul>
          )}
        </Panel>
      </section>
    </>
  );
}
