import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Building2, IndianRupee, Send, UserCheck, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Panel, Pill, Stat, Table, axisTick, inr, tooltipStyle } from "@/components/portal-ui";
import { mrrSeries, partners, services } from "@/lib/sample-data";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Overview,
});

type Stats = { clients: number; users: number; posts: number; published: number; accounts: number; open_messages: number };

function Overview() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_platform_stats");
      if (error) throw error;
      return data as unknown as Stats;
    },
  });
  const stats = [
    { label: "Total partners", value: partners.length, icon: Building2, trend: 8 },
    { label: "Total clients", value: data?.clients ?? "–", icon: Users },
    { label: "MRR", value: inr(mrrSeries[mrrSeries.length - 1]!.mrr), icon: IndianRupee, trend: 9 },
    { label: "Posts published", value: data?.published ?? "–", icon: Send },
    { label: "Server uptime", value: "99.97%", icon: Activity },
    { label: "Registered users", value: data?.users ?? "–", icon: UserCheck },
  ];
  return (
    <>
      <PageHeader subtitle="Platform owner" title="Overview" />
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s, i) => (isLoading ? <div key={s.label} className="skeleton h-28" /> : <Stat key={s.label} {...s} i={i} />))}
      </section>
      <section className="mt-4 grid gap-4 lg:grid-cols-5">
        <Panel title="MRR growth" subtitle="Last 6 months · sample" className="lg:col-span-3">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrSeries} margin={{ left: 0, right: 8 }}>
                <defs>
                  <linearGradient id="mrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => inr(v)} />
                <Area type="monotone" dataKey="mrr" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#mrr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Services" subtitle="Live status · sample" className="lg:col-span-2">
          <Table head={["Service", "Latency", "Status"]} rows={services.map((s) => [s.name, `${s.latency} ms`, <Pill key={s.name} value={s.status} />])} />
        </Panel>
      </section>
    </>
  );
}
