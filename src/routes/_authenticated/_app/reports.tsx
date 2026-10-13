import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowRight, ArrowUpRight, CheckCircle2, Clock, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace";
import { recommendTimes, summarizeTrends } from "@/lib/ai.functions";
import { PageHeader, btnPrimary, inputCls } from "@/components/AppShell";
import { Panel, SampleNote, axisTick, tooltipStyle } from "@/components/portal-ui";

export const Route = createFileRoute("/_authenticated/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — SocialOS" }, { name: "description", content: "Compare analytics and brand mentions across date ranges and export reports." }] }),
  component: Reports,
});

const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => iso(new Date(Date.now() - n * 86400_000));
const PLATFORMS = [["instagram", "Instagram"], ["facebook", "Facebook"], ["linkedin", "LinkedIn"], ["twitter", "X"]] as const;

type Day = { day: string; platform: string; followers: number; engagement: number; reach: number; is_sample: boolean };
type Mention = { created_at: string; sentiment: string; reach: number; source: string; content: string; is_sample: boolean };

function summarize(days: Day[], mentions: Mention[], from: string, to: string) {
  const d = days.filter((r) => r.day >= from && r.day <= to);
  const m = mentions.filter((r) => r.created_at.slice(0, 10) >= from && r.created_at.slice(0, 10) <= to);
  const lastDay = d.reduce((a, r) => (r.day > a ? r.day : a), "");
  return {
    followers: d.filter((r) => r.day === lastDay).reduce((a, r) => a + r.followers, 0),
    engagement: d.reduce((a, r) => a + r.engagement, 0),
    reach: d.reduce((a, r) => a + r.reach, 0),
    mentions: m.length,
    negative: m.length ? Math.round((m.filter((x) => x.sentiment === "negative").length / m.length) * 100) : 0,
  };
}

function download(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = name;
  a.click();
}

function Reports() {
  const { current } = useWorkspace();
  const [a, setA] = useState({ from: daysAgo(29), to: daysAgo(0) });
  const [b, setB] = useState({ from: daysAgo(59), to: daysAgo(30) });
  const [platform, setPlatform] = useState<string>("instagram");
  const recommend = useServerFn(recommendTimes);
  const [advice, setAdvice] = useState<{ slots: { day: string; time: string; why: string }[]; explanation: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const trendsFn = useServerFn(summarizeTrends);
  const [report, setReport] = useState<Awaited<ReturnType<typeof summarizeTrends>> | null>(null);
  const [trendBusy, setTrendBusy] = useState(false);
  async function getReport() {
    if (!current) return;
    setTrendBusy(true);
    try { setReport(await trendsFn({ data: { workspaceId: current.id, a, b } })); }
    catch (e) { toast.error((e as Error).message); }
    finally { setTrendBusy(false); }
  }

  const { data, isLoading } = useQuery({
    queryKey: ["history", current?.id],
    enabled: !!current,
    queryFn: async () => {
      const since = daysAgo(120);
      const [d, m] = await Promise.all([
        supabase.from("analytics_daily").select("day, platform, followers, engagement, reach, is_sample").eq("workspace_id", current!.id).gte("day", since).order("day"),
        supabase.from("mentions").select("created_at, sentiment, reach, source, content, is_sample").eq("workspace_id", current!.id).gte("created_at", since).order("created_at").limit(5000),
      ]);
      return { days: (d.data ?? []) as Day[], mentions: (m.data ?? []) as Mention[] };
    },
  });

  const days = data?.days ?? [];
  const mentions = data?.mentions ?? [];
  const sa = useMemo(() => summarize(days, mentions, a.from, a.to), [days, mentions, a]);
  const sb = useMemo(() => summarize(days, mentions, b.from, b.to), [days, mentions, b]);
  const chart = useMemo(() => {
    const map = new Map<string, { day: string; engagement: number; mentions: number }>();
    days.filter((r) => r.day >= a.from && r.day <= a.to).forEach((r) => {
      const e = map.get(r.day) ?? { day: r.day.slice(5), engagement: 0, mentions: 0 };
      e.engagement += r.engagement;
      map.set(r.day, e);
    });
    mentions.forEach((m) => { const e = map.get(m.created_at.slice(0, 10)); if (e) e.mentions += 1; });
    return [...map.entries()].sort().map(([, v]) => v);
  }, [days, mentions, a]);
  const sample = days.some((d) => d.is_sample) || mentions.some((m) => m.is_sample);

  function exportCsv() {
    const rows: (string | number)[][] = [["Metric", `${a.from} to ${a.to}`, `${b.from} to ${b.to}`, "Change %"]];
    (["followers", "engagement", "reach", "mentions", "negative"] as const).forEach((k) => {
      rows.push([k === "negative" ? "negative mentions %" : k, sa[k], sb[k], sb[k] ? Math.round(((sa[k] - sb[k]) / sb[k]) * 100) : ""]);
    });
    rows.push([], ["Date", "Platform", "Followers", "Engagement", "Reach"]);
    days.filter((r) => r.day >= a.from && r.day <= a.to).forEach((r) => rows.push([r.day, r.platform, r.followers, r.engagement, r.reach]));
    rows.push([], ["Mention date", "Source", "Sentiment", "Reach", "Text"]);
    mentions.filter((m) => m.created_at.slice(0, 10) >= a.from && m.created_at.slice(0, 10) <= a.to).forEach((m) => rows.push([m.created_at.slice(0, 16), m.source, m.sentiment, m.reach, m.content]));
    download(`socialos-report-${a.from}-${a.to}.csv`, rows);
  }

  async function getAdvice() {
    if (!current) return;
    setBusy(true);
    try {
      setAdvice(await recommend({ data: { workspaceId: current.id, platform } }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const Range = ({ label, v, set }: { label: string; v: { from: string; to: string }; set: (v: { from: string; to: string }) => void }) => (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="w-20 text-muted-foreground">{label}</span>
      <input type="date" className={`${inputCls} w-auto`} value={v.from} max={v.to} onChange={(e) => set({ ...v, from: e.target.value })} />
      <span className="text-muted-foreground">to</span>
      <input type="date" className={`${inputCls} w-auto`} value={v.to} min={v.from} onChange={(e) => set({ ...v, to: e.target.value })} />
    </div>
  );

  return (
    <>
      <PageHeader subtitle="History & trends" title="Reports" action={<button onClick={exportCsv} disabled={!days.length} className={btnPrimary}><Download className="h-4 w-4" /> Export CSV</button>} />
      {sample && <SampleNote>History is sample data until real accounts sync. Ranges, comparisons and exports work the same way.</SampleNote>}

      <Panel title="Compare date ranges" className="mb-4">
        <div className="space-y-2">
          <Range label="Period A" v={a} set={setA} />
          <Range label="Period B" v={b} set={setB} />
        </div>
        {isLoading ? <div className="skeleton mt-4 h-20" /> : (
          <div className="mt-4 grid gap-3 sm:grid-cols-5">
            {(["followers", "engagement", "reach", "mentions", "negative"] as const).map((k) => {
              const ch = sb[k] ? Math.round(((sa[k] - sb[k]) / sb[k]) * 100) : 0;
              const good = k === "negative" ? ch <= 0 : ch >= 0;
              return (
                <div key={k} className="rounded-xl bg-secondary/40 p-3">
                  <p className="text-xs capitalize text-muted-foreground">{k === "negative" ? "Negative mentions" : k}</p>
                  <p className="mt-1 text-xl font-semibold">{sa[k].toLocaleString("en-IN")}{k === "negative" ? "%" : ""}</p>
                  <p className={`text-xs ${good ? "text-success" : "text-destructive"}`}>{ch >= 0 ? "+" : ""}{ch}% vs B ({sb[k].toLocaleString("en-IN")})</p>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="AI trend summary" subtitle="Period A compared with Period B" className="mb-4" action={<button onClick={getReport} disabled={trendBusy || !days.length} className={btnPrimary}><Sparkles className="h-4 w-4" />{trendBusy ? "Analyzing…" : report ? "Refresh" : "Summarize & recommend"}</button>}>
        {trendBusy ? <div className="space-y-2"><div className="skeleton h-6 w-2/3" /><div className="skeleton h-16" /><div className="skeleton h-16" /></div> : !report ? (
          <p className="text-sm text-muted-foreground">Pick your two periods above, then let AI explain what changed and what to do next.</p>
        ) : (
          <div className="space-y-4 text-sm">
            <p className="text-base font-semibold">{report.headline}</p>
            <div className="grid gap-2 md:grid-cols-2">
              {report.changes.map((c) => {
                const Icon = c.direction === "up" ? ArrowUpRight : c.direction === "down" ? ArrowDownRight : ArrowRight;
                return (
                  <div key={c.title} className="flex gap-2 rounded-xl bg-secondary/40 p-3">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0"><p className="font-medium">{c.title}</p><p className="text-muted-foreground">{c.detail}</p></div>
                  </div>
                );
              })}
            </div>
            <div>
              <p className="mb-2 font-medium">Recommended actions</p>
              <ol className="space-y-2">
                {report.actions.map((x) => (
                  <li key={x.action} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /><span><span className="font-medium">{x.action}</span> <span className="text-muted-foreground">— {x.why}</span></span></li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Engagement & mentions — Period A" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={chart}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={axisTick} axisLine={false} tickLine={false} minTickGap={20} />
                <YAxis yAxisId="l" tick={axisTick} axisLine={false} tickLine={false} width={40} />
                <YAxis yAxisId="r" orientation="right" tick={axisTick} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line yAxisId="l" dataKey="engagement" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
                <Line yAxisId="r" dataKey="mentions" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="AI best posting times">
          <div className="flex gap-2">
            <select className={inputCls} value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {PLATFORMS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <button onClick={getAdvice} disabled={busy} className={btnPrimary}><Sparkles className="h-4 w-4" />{busy ? "Thinking…" : "Recommend"}</button>
          </div>
          {busy && <div className="mt-3 space-y-2"><div className="skeleton h-10" /><div className="skeleton h-10" /><div className="skeleton h-16" /></div>}
          {advice && !busy && (
            <div className="mt-3 space-y-2 text-sm">
              {advice.slots.map((s) => (
                <div key={s.day + s.time} className="rounded-xl bg-secondary/40 p-3">
                  <p className="flex items-center gap-1.5 font-medium"><Clock className="h-4 w-4 text-primary" /> {s.day}, {s.time}</p>
                  <p className="text-xs text-muted-foreground">{s.why}</p>
                </div>
              ))}
              <p className="text-muted-foreground">{advice.explanation}</p>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
