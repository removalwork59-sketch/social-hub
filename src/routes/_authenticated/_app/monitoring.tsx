import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { crisisCheck } from "@/lib/ai.functions";
import { useWorkspace } from "@/lib/workspace";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, btnPrimary, inputCls } from "@/components/AppShell";
import { Panel, Pill, SampleNote, Table, axisTick, tooltipStyle } from "@/components/portal-ui";
import { mentionVolume, mentions } from "@/lib/client-sample";

export const Route = createFileRoute("/_authenticated/_app/monitoring")({
  head: () => ({ meta: [{ title: "Monitoring — SocialOS" }, { name: "description", content: "Brand mentions and sentiment." }] }),
  component: Monitoring,
});

function Monitoring() {
  const [keywords, setKeywords] = useState(["Brewly", "#BrewlyCoffee", "Brewly Indiranagar"]);
  const [kw, setKw] = useState("");
  const [filter, setFilter] = useState("all");
  const [dismissed, setDismissed] = useState(false);
  const { current } = useWorkspace();
  const checkFn = useServerFn(crisisCheck);
  const [live, setLive] = useState<{ total: number; negative: number; share: number; crisis: boolean } | null>(null);
  async function runCheck() {
    if (!current) return;
    try {
      const r = await checkFn({ data: { workspaceId: current.id } });
      setLive(r);
      if (r.crisis) toast.error(`Crisis alert: ${r.share}% negative in the last hour`);
      else toast.success(r.total ? `All clear — ${r.share}% negative of ${r.total} in the last hour` : "No new inbox activity in the last hour");
    } catch (e) { toast.error((e as Error).message); }
  }

  const totals = mentionVolume.reduce((a, h) => ({ p: a.p + h.positive, n: a.n + h.neutral, x: a.x + h.negative }), { p: 0, n: 0, x: 0 });
  const total = totals.p + totals.n + totals.x;
  const lastHour = mentionVolume[mentionVolume.length - 1]!;
  const negShare = Math.round((lastHour.negative / (lastHour.positive + lastHour.neutral + lastHour.negative)) * 100);
  const crisis = negShare > 30;

  function add(e: React.FormEvent) {
    e.preventDefault();
    const v = kw.trim();
    if (!v || keywords.includes(v)) return;
    setKeywords([...keywords, v]);
    setKw("");
    toast.success(`Tracking "${v}"`);
  }

  const rows = mentions.filter((m) => filter === "all" || m.sentiment === filter);
  const bar = [
    { label: "Positive", v: totals.p, cls: "bg-success" },
    { label: "Neutral", v: totals.n, cls: "bg-muted-foreground" },
    { label: "Negative", v: totals.x, cls: "bg-destructive" },
  ];

  return (
    <>
      <PageHeader subtitle="Brand reputation" title="Monitoring" action={<button onClick={runCheck} className={btnPrimary}><AlertTriangle className="h-4 w-4" /> Run crisis check</button>} />
      {live && <p className="mb-3 text-sm text-muted-foreground">Your inbox, last hour: {live.negative} of {live.total} negative ({live.share}%) — {live.crisis ? "above" : "below"} the 30% alert threshold.</p>}
      <SampleNote>Sample mentions — live tracking across web and social starts once accounts are properly connected.</SampleNote>

      {crisis && !dismissed && (
        <div className="mb-4 flex animate-rise items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="flex-1">
            <p className="font-semibold">Crisis alert: negative mentions at {negShare}% in the last hour</p>
            <p className="text-muted-foreground">Above the 30% threshold. Most complaints mention wait times at Indiranagar.</p>
          </div>
          <button onClick={() => setDismissed(true)} aria-label="Dismiss"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Mention volume" subtitle="Last 24 hours" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mentionVolume}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="hour" tick={axisTick} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" stackId="1" dataKey="positive" stroke="var(--success)" fill="var(--success)" fillOpacity={0.25} />
                <Area type="monotone" stackId="1" dataKey="neutral" stroke="var(--muted-foreground)" fill="var(--muted-foreground)" fillOpacity={0.2} />
                <Area type="monotone" stackId="1" dataKey="negative" stroke="var(--destructive)" fill="var(--destructive)" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Tracked keywords">
          <form onSubmit={add} className="mb-3 flex gap-2">
            <input className={inputCls} placeholder="Add keyword or #hashtag" value={kw} onChange={(e) => setKw(e.target.value)} />
            <button className={btnPrimary} aria-label="Add keyword"><Plus className="h-4 w-4" /></button>
          </form>
          <div className="flex flex-wrap gap-2">
            {keywords.map((k) => (
              <span key={k} className="flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">
                {k}
                <button onClick={() => setKeywords(keywords.filter((x) => x !== k))} aria-label={`Remove ${k}`}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Sentiment" subtitle={`${total} mentions today`} className="mt-4">
        <div className="flex h-4 overflow-hidden rounded-full">
          {bar.map((b) => <div key={b.label} className={`${b.cls} transition-all`} style={{ width: `${(b.v / total) * 100}%` }} />)}
        </div>
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          {bar.map((b) => <span key={b.label}>{b.label} {Math.round((b.v / total) * 100)}%</span>)}
        </div>
      </Panel>

      <Panel
        title="Mentions"
        className="mt-4"
        action={
          <select aria-label="Sentiment" className="rounded-xl border border-input bg-card px-3 py-1.5 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
        }
      >
        <Table head={["Source", "Author", "Mention", "Sentiment", "Reach"]} rows={rows.map((m) => [m.source, m.author, <span key="t" className="line-clamp-1">{m.text}</span>, <Pill key="s" value={m.sentiment === "positive" ? "active" : m.sentiment === "negative" ? "high" : "pending"} />, m.reach.toLocaleString()])} />
      </Panel>
    </>
  );
}
