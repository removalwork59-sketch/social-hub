import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Hash, ImagePlus, Lightbulb, Send, Smile, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generatePost } from "@/lib/ai.functions";
import { PLATFORMS, type Platform, platformLabel, useWorkspace } from "@/lib/workspace";
import { PageHeader, btnPrimary, cardCls, inputCls } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/_app/composer")({
  head: () => ({ meta: [{ title: "Composer — SocialOS" }, { name: "description", content: "Create posts with AI." }] }),
  component: Composer,
});

const LIMITS: Record<Platform, number> = { facebook: 63206, instagram: 2200, linkedin: 3000, twitter: 280, google_business: 1500 };
const EMOJIS = ["🔥", "✨", "🎉", "💡", "🚀", "❤️", "👏", "📈", "🪔", "☕"];
const TONES = ["Professional", "Casual", "Funny", "Bold"];
const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

function Composer() {
  const { current, role } = useWorkspace();
  const isMember = role === "member";
  const qc = useQueryClient();
  const navigate = useNavigate();
  const ai = useServerFn(generatePost);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [text, setText] = useState("");
  const [idea, setIdea] = useState("");
  const [tone, setTone] = useState("Casual");
  const [tags, setTags] = useState<string[]>([]);
  const [imageIdea, setImageIdea] = useState("");
  const [media, setMedia] = useState<string | null>(null);
  const [when, setWhen] = useState(() => toLocalInput(new Date(Date.now() + 3600_000)));
  const [preview, setPreview] = useState<Platform | null>(null);
  const [busy, setBusy] = useState<"ai" | "save" | null>(null);
  const [emoji, setEmoji] = useState(false);

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts", current?.id],
    enabled: !!current,
    queryFn: async () => (await supabase.from("social_accounts").select("*").eq("workspace_id", current!.id)).data ?? [],
  });
  const connected = new Set(accounts.map((a) => a.platform));
  const available = isMember ? PLATFORMS.filter((p) => connected.has(p.id)) : PLATFORMS;
  const active = preview ?? platforms[0] ?? null;
  const full = tags.length ? `${text}\n\n${tags.join(" ")}` : text;

  async function runAi() {
    if (!idea.trim()) {
      toast.error("Write a one-line idea first");
      return;
    }
    setBusy("ai");
    try {
      const r = await ai({ data: { idea, tone, platforms: platforms.map(platformLabel) } });
      setText(r.post);
      setTags(r.hashtags);
      setImageIdea(r.image);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI failed");
    }
    setBusy(null);
  }

  async function save(mode: "now" | "schedule") {
    if (!current) return;
    if (!platforms.length) {
      toast.error("Pick at least one platform");
      return;
    }
    if (!text.trim()) {
      toast.error("Write something first");
      return;
    }
    const over = platforms.find((p) => full.length > LIMITS[p]);
    if (over) {
      toast.error(`Too long for ${platformLabel(over)}`);
      return;
    }
    const at = mode === "now" ? new Date() : new Date(when);
    if (mode === "schedule" && at.getTime() < Date.now()) {
      toast.error("Pick a future time");
      return;
    }
    setBusy("save");
    const { error } = await supabase.from("posts").insert({
      workspace_id: current.id,
      content: full,
      platforms,
      scheduled_at: at.toISOString(),
      status: isMember ? "pending_approval" : "scheduled",
    });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["posts"] });
    qc.invalidateQueries({ queryKey: ["overview"] });
    toast.success(isMember ? "Sent for approval" : mode === "now" ? "Queued to publish now" : "Post scheduled");
    navigate({ to: "/scheduler" });
  }

  return (
    <>
      <PageHeader subtitle={current?.name} title="Composer" />
      <div className="grid gap-4 xl:grid-cols-2">
        <div className={`${cardCls} space-y-5`}>
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Post to {isMember && "(your allowed platforms)"}</p>
            <div className="flex flex-wrap gap-2">
              {available.length === 0 && <p className="text-sm text-muted-foreground">No connected accounts you can post to yet.</p>}
              {available.map((p) => {
                const on = platforms.includes(p.id);
                return (
                  <label key={p.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${on ? "border-primary bg-accent text-accent-foreground" : "border-input text-muted-foreground hover:text-foreground"}`}>
                    <input type="checkbox" className="accent-[var(--primary)]" checked={on} onChange={() => setPlatforms(on ? platforms.filter((x) => x !== p.id) : [...platforms, p.id])} />
                    {p.label}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-primary/30 bg-accent/50 p-3">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium"><Sparkles className="h-4 w-4 text-primary" /> Write one line, AI does the rest</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input className={inputCls} placeholder="e.g. Diwali sale, 30% off all coffee this week" value={idea} onChange={(e) => setIdea(e.target.value)} maxLength={500} />
              <select aria-label="Tone" className={`${inputCls} sm:w-36`} value={tone} onChange={(e) => setTone(e.target.value)}>
                {TONES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <button onClick={runAi} disabled={busy === "ai"} className={btnPrimary}>{busy === "ai" ? "Writing…" : "AI Generate"}</button>
            </div>
          </div>

          <div className="relative">
            <textarea className={`${inputCls} min-h-44 resize-y`} placeholder="What do you want to share?" value={text} onChange={(e) => setText(e.target.value)} />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button onClick={() => setEmoji(!emoji)} aria-label="Emoji" className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><Smile className="h-4 w-4" /></button>
              <label className="cursor-pointer rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Add media">
                <ImagePlus className="h-4 w-4" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setMedia(URL.createObjectURL(f)); }} />
              </label>
              <div className="ml-auto flex flex-wrap gap-2 text-xs">
                {platforms.map((p) => (
                  <span key={p} className={full.length > LIMITS[p] ? "text-destructive" : "text-muted-foreground"}>{platformLabel(p)} {full.length}/{LIMITS[p]}</span>
                ))}
              </div>
            </div>
            {emoji && (
              <div className="absolute z-10 mt-1 flex gap-1 rounded-xl border border-border bg-popover p-2 shadow-soft">
                {EMOJIS.map((e) => <button key={e} className="rounded p-1 text-lg hover:bg-secondary" onClick={() => { setText(text + e); setEmoji(false); }}>{e}</button>)}
              </div>
            )}
          </div>

          {media && (
            <div className="relative w-fit">
              <img src={media} alt="Upload preview" className="h-24 rounded-xl object-cover" />
              <button onClick={() => setMedia(null)} aria-label="Remove media" className="absolute -right-2 -top-2 rounded-full bg-secondary p-1"><X className="h-3 w-3" /></button>
            </div>
          )}

          {tags.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1 text-sm text-muted-foreground"><Hash className="h-4 w-4" /> Suggested hashtags (click to remove)</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => <button key={t} onClick={() => setTags(tags.filter((x) => x !== t))} className="rounded-full bg-accent px-2.5 py-1 text-xs text-accent-foreground hover:line-through">{t}</button>)}
              </div>
            </div>
          )}
          {imageIdea && <p className="flex gap-2 rounded-xl bg-secondary/60 p-3 text-sm"><Lightbulb className="h-4 w-4 shrink-0 text-warning" /> <span><span className="font-medium">Image idea:</span> {imageIdea}</span></p>}

          <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center">
            <input type="datetime-local" aria-label="Schedule time" className={`${inputCls} sm:w-56`} value={when} onChange={(e) => setWhen(e.target.value)} />
            <div className="flex gap-2 sm:ml-auto">
              {isMember ? (
                <button disabled={busy === "save"} onClick={() => save("schedule")} className={btnPrimary}><Send className="h-4 w-4" /> Submit for approval</button>
              ) : (
                <>
                  <button disabled={busy === "save"} onClick={() => save("now")} className="rounded-xl border border-input px-4 py-2.5 text-sm font-medium hover:bg-secondary">Post now</button>
                  <button disabled={busy === "save"} onClick={() => save("schedule")} className={btnPrimary}>Schedule</button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={`${cardCls} h-fit`}>
          <div className="mb-4 flex flex-wrap gap-1">
            {(platforms.length ? platforms : (["instagram"] as Platform[])).map((p) => (
              <button key={p} onClick={() => setPreview(p)} className={`rounded-lg px-3 py-1.5 text-sm ${active === p ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>{platformLabel(p)}</button>
            ))}
          </div>
          <div className="mx-auto max-w-md rounded-xl border border-border bg-background p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground">{(current?.name ?? "S")[0]}</div>
              <div>
                <p className="text-sm font-semibold">{current?.name}</p>
                <p className="text-xs text-muted-foreground">{active ? platformLabel(active) : "Preview"} · Just now</p>
              </div>
            </div>
            {media && <img src={media} alt="" className="mb-3 w-full rounded-lg object-cover" />}
            <p className="whitespace-pre-wrap text-sm">{full || <span className="text-muted-foreground">Your post preview appears here…</span>}</p>
            {active === "twitter" && full.length > 280 && <p className="mt-2 text-xs text-destructive">Will be cut off on X.</p>}
          </div>
        </div>
      </div>
    </>
  );
}
