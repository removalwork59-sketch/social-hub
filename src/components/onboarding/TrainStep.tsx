import { useMemo, useState } from "react";
import { RefreshCw, Sparkles, X } from "lucide-react";
import { btnPrimary, cardCls, inputCls } from "@/components/AppShell";

export type BrandProfile = {
  name: string;
  description: string;
  tones: string[];
  audiences: string[];
  pillars: string[];
  frequency: string;
  platforms: string[];
  hashtags: string[];
};

const TONES = ["Professional", "Casual", "Funny", "Bold", "Inspirational", "Friendly", "Authoritative", "Witty"];
const AUDIENCES = ["Small business owners", "Creators", "Agencies", "Enterprise", "Students", "Other"];
const PILLARS = ["Product updates", "Tips & tricks", "Behind the scenes", "Customer stories", "Industry news", "Motivation", "Fun content"];
const FREQ = ["1 post/day", "3 posts/week", "5 posts/week", "Custom"];
const PLATS = ["Facebook", "Instagram", "LinkedIn", "X", "YouTube", "TikTok", "Pinterest"];

const chip = (on: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-200 ${on ? "border-primary bg-accent text-accent-foreground" : "border-input hover:border-primary/50"}`;

function toggle(list: string[], v: string, max = 99) {
  return list.includes(v) ? list.filter((x) => x !== v) : list.length >= max ? list : [...list, v];
}

const OPENERS: Record<string, string[]> = {
  Professional: ["Here's what we've been working on:", "A quick update for our community:"],
  Casual: ["Okay, real talk —", "Quick one for you today 👋"],
  Funny: ["Plot twist:", "Nobody asked, but here we go 😄"],
  Bold: ["Stop scrolling.", "This changes everything."],
  Inspirational: ["Every big thing starts small. ✨", "Here's your reminder to keep going."],
  Friendly: ["Hey friends! 💛", "Hope your week is going great!"],
  Authoritative: ["The data is clear:", "Here's what most people get wrong:"],
  Witty: ["Fun fact you didn't know you needed:", "Spoiler alert:"],
};
const BODIES: Record<string, string> = {
  "Product updates": "we just shipped something new that makes your day easier",
  "Tips & tricks": "here's a 30-second tip that saves hours every week",
  "Behind the scenes": "a peek at how our team makes the magic happen",
  "Customer stories": "one of our customers just hit a huge milestone with us",
  "Industry news": "the latest shift in our industry — and what it means for you",
  Motivation: "progress beats perfection, every single time",
  "Fun content": "we asked our team their favourite emoji. The results were chaotic",
};

export function TrainStep({ initial, onBack, onSkip, onSave }: { initial: BrandProfile; onBack: () => void; onSkip: () => void; onSave: (p: BrandProfile) => void }) {
  const [p, setP] = useState(initial);
  const [tag, setTag] = useState("");
  const [seed, setSeed] = useState(0);
  const set = <K extends keyof BrandProfile>(k: K, v: BrandProfile[K]) => setP({ ...p, [k]: v });

  const preview = useMemo(() => {
    const tone = p.tones[seed % Math.max(p.tones.length, 1)] ?? "Casual";
    const openers = OPENERS[tone] ?? OPENERS.Casual!;
    const opener = openers[seed % openers.length];
    const pillar = p.pillars[seed % Math.max(p.pillars.length, 1)] ?? "Tips & tricks";
    const body = BODIES[pillar] ?? BODIES["Tips & tricks"];
    const who = p.audiences[0] ? ` for ${p.audiences[0].toLowerCase()}` : "";
    const tags = (p.hashtags.length ? p.hashtags : ["#" + (p.name || "YourBrand").replace(/\s+/g, "")]).slice(0, 4).join(" ");
    return `${opener} ${p.name ? `At ${p.name}, ` : ""}${body}${who}.\n\n${p.description ? p.description.split(/[.!?]/)[0] + "." : ""}\n\n👉 Tell us what you think below!\n\n${tags}`;
  }, [p, seed]);

  function addTag() {
    const t = tag.trim().replace(/^#?/, "#").replace(/\s+/g, "");
    if (t.length > 1 && !p.hashtags.includes(t) && p.hashtags.length < 10) set("hashtags", [...p.hashtags, t]);
    setTag("");
  }

  const label = "mb-2 mt-6 block text-sm font-medium";
  return (
    <>
      <h1 className="text-center text-3xl font-semibold">Train your AI assistant</h1>
      <p className="mb-8 mt-2 text-center text-muted-foreground">Tell us about your brand so AI can create posts in your voice.</p>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <label className="mb-2 block text-sm font-medium">Brand name</label>
          <input className={inputCls} placeholder="Enter your brand name" value={p.name} onChange={(e) => set("name", e.target.value)} />

          <label className={label}>Brand description</label>
          <textarea className={`${inputCls} min-h-24`} maxLength={500} placeholder="We help small businesses automate their social media..." value={p.description} onChange={(e) => set("description", e.target.value)} />
          <p className="mt-1 text-right text-xs text-muted-foreground">{p.description.length}/500</p>

          <label className={label}>Tone of voice <span className="font-normal text-muted-foreground">(up to 3)</span></label>
          <div className="flex flex-wrap gap-2">{TONES.map((t) => <button key={t} onClick={() => set("tones", toggle(p.tones, t, 3))} className={chip(p.tones.includes(t))}>{t}</button>)}</div>

          <label className={label}>Target audience</label>
          <div className="flex flex-wrap gap-2">{AUDIENCES.map((t) => <button key={t} onClick={() => set("audiences", toggle(p.audiences, t))} className={chip(p.audiences.includes(t))}>{t}</button>)}</div>

          <label className={label}>Content pillars</label>
          <div className="flex flex-wrap gap-2">{PILLARS.map((t) => <button key={t} onClick={() => set("pillars", toggle(p.pillars, t))} className={chip(p.pillars.includes(t))}>{t}</button>)}</div>

          <label className={label}>Posting frequency</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FREQ.map((f) => (
              <label key={f} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${p.frequency === f ? "border-primary bg-accent" : "border-input"}`}>
                <input type="radio" name="freq" className="accent-[var(--primary)]" checked={p.frequency === f} onChange={() => set("frequency", f)} />{f}
              </label>
            ))}
          </div>

          <label className={label}>Preferred platforms</label>
          <div className="flex flex-wrap gap-3">
            {PLATS.map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-[var(--primary)]" checked={p.platforms.includes(t)} onChange={() => set("platforms", toggle(p.platforms, t))} />{t}</label>
            ))}
          </div>

          <label className={label}>Hashtag preferences</label>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-input bg-card px-3 py-2">
            {p.hashtags.map((h) => (
              <span key={h} className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs text-accent-foreground">
                {h}<button onClick={() => set("hashtags", p.hashtags.filter((x) => x !== h))} aria-label={`Remove ${h}`}><X className="h-3 w-3" /></button>
              </span>
            ))}
            <input
              className="min-w-40 flex-1 bg-transparent py-1 text-sm outline-none"
              placeholder={p.hashtags.length < 10 ? "Add 5-10 hashtags you use often" : "Max 10 hashtags"}
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === "," || e.key === " ") { e.preventDefault(); addTag(); } }}
              onBlur={addTag}
            />
          </div>
        </div>

        <aside className={`${cardCls} hidden h-fit lg:sticky lg:top-6 lg:block`}>
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-medium"><Sparkles className="h-4 w-4 text-primary" /> Preview</span>
            <button onClick={() => setSeed((s) => s + 1)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"><RefreshCw className="h-3.5 w-3.5" /> Regenerate</button>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground">{(p.name || "Y")[0]}</div>
              <span className="text-sm font-semibold">{p.name || "Your brand"}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm">{preview}</p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">A sample built from your choices. Real AI posts in the Composer use these settings too.</p>
        </aside>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
        <button onClick={onSkip} className="text-sm text-muted-foreground hover:text-foreground">Skip for now</button>
        <button onClick={() => onSave(p)} className={btnPrimary}>Continue</button>
      </div>
    </>
  );
}
