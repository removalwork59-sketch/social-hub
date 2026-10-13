import { createFileRoute } from "@tanstack/react-router";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Database, Gauge, ServerCrash } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Panel, Pill, SampleNote, Stat, Table, axisTick, tooltipStyle } from "@/components/portal-ui";
import { errorLogs, latencySeries, services } from "@/lib/sample-data";

export const Route = createFileRoute("/_authenticated/admin/health")({
  component: Health,
});

function Health() {
  return (
    <>
      <PageHeader subtitle="Infrastructure" title="System Health" />
      <SampleNote>Sample metrics — live monitoring connects when the monitoring service is set up.</SampleNote>
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="Uptime (30d)" value="99.97%" icon={Activity} />
        <Stat label="Avg API latency" value="96 ms" icon={Gauge} i={1} />
        <Stat label="Errors (24h)" value={errorLogs.filter((e) => e.level === "error").length} icon={ServerCrash} i={2} />
        <Stat label="Database size" value="1.8 GB" icon={Database} i={3} />
      </section>
      <section className="mt-4 grid gap-4 lg:grid-cols-5">
        <Panel title="API latency" subtitle="Last 24 hours" className="lg:col-span-3">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencySeries}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="hour" tick={axisTick} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} unit="ms" />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="api" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Server status" className="lg:col-span-2">
          <ul className="space-y-2">
            {services.map((s) => (
              <li key={s.name} className="flex items-center gap-3 rounded-xl p-2 text-sm hover:bg-secondary/40">
                <span className={`h-2.5 w-2.5 rounded-full ${s.status === "healthy" ? "bg-success" : "bg-warning animate-pulse"}`} />
                {s.name}
                <span className="ml-auto text-xs text-muted-foreground">{s.uptime}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </section>
      <Panel title="Error logs" className="mt-4">
        <Table head={["Time", "Level", "Source", "Message"]} rows={errorLogs.map((e) => [e.time, <Pill key="l" value={e.level === "error" ? "high" : "medium"} />, e.source, <span key="m" className="font-mono text-xs">{e.msg}</span>])} />
      </Panel>
    </>
  );
}
