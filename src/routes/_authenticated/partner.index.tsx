import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BadgeIndianRupee, IndianRupee, Repeat, Users } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Panel, Pill, SampleNote, Stat, Table, axisTick, inr, tooltipStyle } from "@/components/portal-ui";
import { partnerEarnings, sampleClients } from "@/lib/sample-data";

export const Route = createFileRoute("/_authenticated/partner/")({
  component: Overview,
});

function Overview() {
  const last = partnerEarnings[partnerEarnings.length - 1]!;
  const mine = sampleClients.slice(0, 5);
  return (
    <>
      <PageHeader subtitle="GrowthLab Agency" title="Partner overview" />
      <SampleNote />
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="My clients" value={42} icon={Users} trend={10} />
        <Stat label="My revenue" value={inr(last.revenue)} icon={IndianRupee} trend={12} i={1} />
        <Stat label="Commission earned" value={inr(last.commission)} icon={BadgeIndianRupee} trend={12} i={2} />
        <Stat label="Active subscriptions" value={36} icon={Repeat} i={3} />
      </section>
      <section className="mt-4 grid gap-4 lg:grid-cols-5">
        <Panel title="Revenue & commission" subtitle="Last 6 months" className="lg:col-span-3">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={partnerEarnings}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => inr(v)} cursor={{ fill: "var(--secondary)" }} />
                <Bar dataKey="revenue" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="commission" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Recent clients" className="lg:col-span-2">
          <Table head={["Client", "Plan", "Status"]} rows={mine.map((c) => [c.name, c.plan, <Pill key="s" value={c.status} />])} />
        </Panel>
      </section>
    </>
  );
}
