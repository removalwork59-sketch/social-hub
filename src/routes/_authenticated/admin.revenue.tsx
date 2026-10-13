import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { IndianRupee, Percent, TrendingDown, Users } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Panel, SampleNote, Stat, Table, axisTick, inr, tooltipStyle } from "@/components/portal-ui";
import { mrrSeries, planBreakdown, sampleClients } from "@/lib/sample-data";

export const Route = createFileRoute("/_authenticated/admin/revenue")({
  component: Revenue,
});

function Revenue() {
  const last = mrrSeries[mrrSeries.length - 1]!;
  const top = [...sampleClients].sort((a, b) => b.mrr - a.mrr).slice(0, 5);
  return (
    <>
      <PageHeader subtitle="Subscriptions" title="Revenue" />
      <SampleNote />
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="MRR" value={inr(last.mrr)} icon={IndianRupee} trend={9} />
        <Stat label="ARR" value={inr(last.mrr * 12)} icon={IndianRupee} i={1} />
        <Stat label="Churn rate" value={`${last.churn}%`} icon={TrendingDown} trend={-8} i={2} />
        <Stat label="Paying clients" value={planBreakdown[1]!.value + planBreakdown[2]!.value} icon={Users} i={3} />
      </section>
      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="MRR by month">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mrrSeries}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => inr(v)} cursor={{ fill: "var(--secondary)" }} />
                <Bar dataKey="mrr" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Churn rate" subtitle="Monthly %">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mrrSeries}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="churn" stroke="var(--destructive)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Plan breakdown">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={planBreakdown} dataKey="value" innerRadius="60%" outerRadius="90%" paddingAngle={3} stroke="none">
                    {planBreakdown.map((p) => <Cell key={p.name} fill={p.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-2 text-sm">
              {planBreakdown.map((p) => (
                <li key={p.name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                  {p.name}
                  <span className="ml-auto text-muted-foreground">{p.value} clients</span>
                  <span className="w-24 text-right font-medium">{inr(p.revenue)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
        <Panel title="Top paying clients">
          <Table head={["Client", "Plan", "MRR"]} rows={top.map((c) => [c.name, c.plan, inr(c.mrr)])} />
        </Panel>
      </section>
      <span className="hidden"><Percent /></span>
    </>
  );
}
