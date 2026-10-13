import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Plus, ShieldCheck, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, btnPrimary, inputCls } from "@/components/AppShell";
import { Panel, SampleNote } from "@/components/portal-ui";
import { feed, leaderboard } from "@/lib/client-sample";

export const Route = createFileRoute("/_authenticated/_app/community")({
  head: () => ({ meta: [{ title: "Community — SocialOS" }, { name: "description", content: "Engagement and moderation." }] }),
  component: Community,
});

function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={onChange} className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-primary" : "bg-muted"}`}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-foreground transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}

function Community() {
  const [auto, setAuto] = useState({ like: true, thank: false, follow: false });
  const [rules, setRules] = useState([
    { id: 1, text: "Hide comments with spam links", on: true },
    { id: 2, text: "Delete abusive or hateful language", on: true },
    { id: 3, text: "Hide comments mentioning competitors", on: false },
  ]);
  const [rule, setRule] = useState("");
  const [liked, setLiked] = useState<number[]>([]);

  return (
    <>
      <PageHeader subtitle="Your fans and moderation" title="Community" />
      <SampleNote>Sample activity — auto-engagement and moderation run once accounts are properly connected.</SampleNote>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Community feed" subtitle="People talking about you" className="lg:col-span-2">
          <ul className="space-y-3">
            {feed.map((f, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold uppercase">{f.author.replace("@", "").slice(0, 2)}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm"><span className="font-medium">{f.author}</span> <span className="text-muted-foreground">· {f.platform}</span></p>
                  <p className="truncate text-sm text-muted-foreground">{f.text}</p>
                </div>
                <button onClick={() => setLiked(liked.includes(i) ? liked.filter((x) => x !== i) : [...liked, i])} className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors ${liked.includes(i) ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`}>
                  <Heart className={`h-4 w-4 ${liked.includes(i) ? "fill-current" : ""}`} /> {f.likes + (liked.includes(i) ? 1 : 0)}
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-4">
          <Panel title="Auto-engagement">
            <ul className="space-y-3 text-sm">
              {([["like", "Auto-like comments on my posts"], ["thank", "Auto-thank new followers"], ["follow", "Follow back engaged fans"]] as const).map(([k, l]) => (
                <li key={k} className="flex items-center justify-between gap-3">{l}<Switch label={l} on={auto[k]} onChange={() => setAuto({ ...auto, [k]: !auto[k] })} /></li>
              ))}
            </ul>
          </Panel>
          <Panel title="Top fans" action={<Trophy className="h-4 w-4 text-warning" />}>
            <ol className="space-y-2">
              {leaderboard.map((l, i) => (
                <li key={l.name} className="flex items-center gap-3 text-sm">
                  <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${i === 0 ? "bg-warning text-background" : "bg-secondary"}`}>{i + 1}</span>
                  <div className="min-w-0 flex-1"><p className="truncate font-medium">{l.name}</p><p className="truncate text-xs text-muted-foreground">{l.actions}</p></div>
                  <span className="text-xs font-semibold text-accent-foreground">{l.points}</span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>

      <Panel title="Auto-moderation rules" subtitle="AI hides or deletes comments that match" className="mt-4" action={<ShieldCheck className="h-4 w-4 text-primary" />}>
        <ul className="space-y-2">
          {rules.map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-xl p-2 text-sm hover:bg-secondary/40">
              <Switch label={r.text} on={r.on} onChange={() => setRules(rules.map((x) => (x.id === r.id ? { ...x, on: !x.on } : x)))} />
              {r.text}
              <button className="ml-auto text-muted-foreground hover:text-destructive" aria-label="Remove rule" onClick={() => setRules(rules.filter((x) => x.id !== r.id))}><X className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!rule.trim()) return;
            setRules([...rules, { id: Date.now(), text: rule.trim(), on: true }]);
            setRule("");
            toast.success("Rule added");
          }}
          className="mt-3 flex gap-2"
        >
          <input className={inputCls} placeholder="e.g. Hide comments asking for discounts" value={rule} onChange={(e) => setRule(e.target.value)} />
          <button className={btnPrimary}><Plus className="h-4 w-4" /> Add</button>
        </form>
      </Panel>
    </>
  );
}
