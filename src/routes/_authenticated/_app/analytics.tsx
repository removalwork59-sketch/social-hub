import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Panel, SampleNote, Table, axisTick, btnOutline, tooltipStyle } from "@/components/portal-ui";
import { ageGroups, days, gender, heatmap, platformStats, slots, topPosts } from "@/lib/client-sample";
import { cardCls } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — SocialOS" }, { name: "description", content: "Performance reports." }] }),
  component: Analytics,
});

function exportCsv() {
  const rows = [["Post", "Platform", "Reach", "Likes", "Comments", "Date"], ...topPosts.map((p) => [p.post, p.platform, p.reach, p.likes, p.comments, p.date])];
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "socialos-report.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function Analytics() {
  const [range, setRange] = useState("30");
  const max = Math.max(...heatmap.flat());
  return (
    <>
      <PageHeader
        subtitle="Performance"
        title="Analytics"
        action={
          <div className="flex gap-2">
            <select aria-label="Date range" className="rounded-xl border border-input bg-card px-3 py-2 text-sm" value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button onClick={exportCsv} className={btnOutline}><Download className="h-4 w-4" /> Export CSV</button>
          </div>
        }
      />
      <SampleNote>Sample figures — real analytics sync from each platform once accounts are properly connected.</SampleNote>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {platformStats.map((p, i) => (
          <div key={p.platform} style={{ animationDelay: `${i * 60}ms` }} className={`${cardCls} animate-rise`}>
            <p className="text-sm font-medium">{p.platform}</p>
            <p className="mt-2 text-2xl font-semibold">{p.followers.toLocaleString()}</p>
            <p className={`flex items-center gap-1 text-xs ${p.growth >= 0 ? "text-success" : "text-destructive"}`}>
              {p.growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {Math.abs(p.growth)}% followers
            </p>
            <div className="mt-3 flex justify-between text-xs text-muted-foreground"><span>{p.engagement}% engagement</span><span>{p.posts} posts</span></div>
          </div>
        ))}
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Panel title="Best time to post" subtitle="Average engagement by day and time" className="lg:col-span-3">
          <div className="overflow-x-auto">
            <div className="grid min-w-[420px] gap-1" style={{ gridTemplateColumns: `48px repeat(${slots.length}, 1fr)` }}>
              <div />
              {slots.map((s) => <div key={s} className="text-center text-[11px] text-muted-foreground">{s}</div>)}
              {days.map((d, di) => (
                <div key={d} className="contents">
                  <div className="self-center text-xs text-muted-foreground">{d}</div>
                  {heatmap[di]!.map((v, si) => (
                    <div key={si} title={`${d} ${slots[si]}: ${v}`} className="h-8 rounded-md transition-transform hover:scale-105" style={{ background: `color-mix(in oklab, var(--primary) ${Math.round((v / max) * 90)}%, var(--secondary))` }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Panel>
        <Panel title="Audience" className="lg:col-span-2">
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageGroups}>
                <XAxis dataKey="group" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--secondary)" }} formatter={(v: number) => `${v}%`} />
                <Bar dataKey="value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center gap-4">
            <div className="h-28 w-28">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={gender} dataKey="value" innerRadius="55%" outerRadius="90%" stroke="none">{gender.map((g) => <Cell key={g.name} fill={g.color} />)}</Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-1 text-sm">
              {gender.map((g) => <li key={g.name} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: g.color }} />{g.name} <span className="text-muted-foreground">{g.value}%</span></li>)}
            </ul>
          </div>
        </Panel>
      </div>

      <Panel title="Top posts" className="mt-4">
        <Table head={["Post", "Platform", "Reach", "Likes", "Comments", "Date"]} rows={topPosts.map((p) => [<span key="p" className="line-clamp-1 font-medium">{p.post}</span>, p.platform, p.reach.toLocaleString(), p.likes.toLocaleString(), p.comments, p.date])} />
      </Panel>
      <span className="hidden"><CartesianGrid /></span>
    </>
  );
}
