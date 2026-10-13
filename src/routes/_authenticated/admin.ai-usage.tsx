import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Bot, Coins, Cpu } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Panel, Pill, SampleNote, Stat, Table, axisTick, inr, tooltipStyle } from "@/components/portal-ui";
import { aiByClient, aiDaily, rateAlerts } from "@/lib/sample-data";

export const Route = createFileRoute("/_authenticated/admin/ai-usage")({
  component: AiUsage,
});

function AiUsage() {
  const today = aiDaily[aiDaily.length - 1]!;
  return (
    <>
      <PageHeader subtitle="AI engine" title="AI Usage" />
      <SampleNote />
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="Calls today" value={today.calls.toLocaleString()} icon={Bot} trend={6} />
        <Stat label="Tokens today" value={`${today.tokens}M`} icon={Cpu} i={1} />
        <Stat label="Cost this month" value={inr(48230)} icon={Coins} i={2} />
        <Stat label="Rate-limit alerts" value={rateAlerts.length} icon={AlertTriangle} i={3} />
      </section>
      <section className="mt-4 grid gap-4 lg:grid-cols-5">
        <Panel title="API calls per day" subtitle="Last 14 days" className="lg:col-span-3">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aiDaily}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={axisTick} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--secondary)" }} />
                <Bar dataKey="calls" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Rate limit alerts" className="lg:col-span-2">
          <ul className="space-y-3">
            {rateAlerts.map((a) => (
              <li key={a.client} className="flex gap-3 rounded-xl border border-border bg-secondary/40 p-3 text-sm">
                <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${a.level === "high" ? "text-destructive" : "text-warning"}`} />
                <div className="flex-1">
                  <p className="font-medium">{a.client}</p>
                  <p className="text-muted-foreground">{a.msg}</p>
                </div>
                <Pill value={a.level} />
              </li>
            ))}
          </ul>
        </Panel>
      </section>
      <Panel title="Cost per client" subtitle="This month" className="mt-4">
        <Table head={["Client", "API calls", "Tokens", "Cost"]} rows={aiByClient.map((c) => [c.name, c.calls.toLocaleString(), c.tokens, inr(c.cost)])} />
      </Panel>
    </>
  );
}
