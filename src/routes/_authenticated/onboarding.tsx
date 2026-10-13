import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Camera, Check, Inbox, Music2, Phone, Play, Plus, Sparkles, Wand2, X as XIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { type Platform, useWorkspace } from "@/lib/workspace";

type OnbPlatform = { id: string; label: string; desc: string; db?: Platform };
const ONB_PLATFORMS: OnbPlatform[] = [
  { id: "facebook", label: "Facebook", desc: "Pages & Groups", db: "facebook" },
  { id: "instagram", label: "Instagram", desc: "Posts, Reels & Stories", db: "instagram" },
  { id: "linkedin", label: "LinkedIn", desc: "Company pages", db: "linkedin" },
  { id: "twitter", label: "X (Twitter)", desc: "Tweets & threads", db: "twitter" },
  { id: "youtube", label: "YouTube", desc: "Videos & Shorts" },
  { id: "tiktok", label: "TikTok", desc: "Short videos" },
  { id: "pinterest", label: "Pinterest", desc: "Pins & boards" },
  { id: "threads", label: "Threads", desc: "Text posts" },
  { id: "whatsapp", label: "WhatsApp Business", desc: "Messages & catalog" },
  { id: "google_business", label: "Google Business", desc: "Reviews & posts", db: "google_business" },
];

// Brand colors are fixed by each platform, so they're inline rather than theme tokens.
function PlatformIcon({ id }: { id: string }) {
  const base = "grid h-12 w-12 place-items-center text-lg font-bold";
  const w = { color: "#fff" };
  switch (id) {
    case "facebook": return <div className={`${base} rounded-full`} style={{ ...w, background: "#1877F2" }}>f</div>;
    case "instagram": return <div className={`${base} rounded-xl`} style={{ ...w, background: "linear-gradient(45deg,#F58529,#DD2A7B,#8134AF)" }}><Camera className="h-6 w-6" /></div>;
    case "linkedin": return <div className={`${base} rounded-full text-base`} style={{ ...w, background: "#0A66C2" }}>in</div>;
    case "twitter": return <div className={`${base} rounded-full border border-white/20`} style={{ ...w, background: "#000" }}>X</div>;
    case "youtube": return <div className="grid h-10 w-14 place-items-center rounded-xl" style={{ ...w, background: "#FF0000" }}><Play className="h-5 w-5 fill-current" /></div>;
    case "tiktok": return <div className={`${base} rounded-full border border-white/20`} style={{ ...w, background: "#000" }}><Music2 className="h-6 w-6" /></div>;
    case "pinterest": return <div className={`${base} rounded-full`} style={{ ...w, background: "#E60023" }}>P</div>;
    case "threads": return <div className={`${base} rounded-full border border-white/20`} style={{ ...w, background: "#000" }}>@</div>;
    case "whatsapp": return <div className={`${base} rounded-full`} style={{ ...w, background: "#25D366" }}><Phone className="h-6 w-6" /></div>;
    default: return (
      <div className={`${base} rounded-full`} style={{ background: "#fff" }}>
        <span style={{ background: "conic-gradient(#EA4335 0 25%,#FBBC05 0 50%,#34A853 0 75%,#4285F4 0)", WebkitBackgroundClip: "text", color: "transparent", fontSize: 26 }}>G</span>
      </div>
    );
  }
}
import { btnPrimary, cardCls, inputCls } from "@/components/AppShell";
import { TrainStep, type BrandProfile } from "@/components/onboarding/TrainStep";
import { DoneStep } from "@/components/onboarding/DoneStep";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Get started — SocialOS" }, { name: "robots", content: "noindex" }] }),
  component: Onboarding,
});

const steps = ["Account", "Connect", "Plan", "AI training", "Done"];
const tones = ["Professional", "Casual", "Funny", "Bold"];
type PlanCard = { id: string; name: string; price: string; year?: string; yearMonthly?: string; popular?: boolean; sub: string; f: [string, boolean][] };
const plans: PlanCard[] = [
  { id: "free", name: "Free", sub: "For getting started", price: "₹0", f: [["5 posts per month", true], ["1 social platform", true], ["Basic AI (50 calls/day)", true], ["Unified inbox", true], ["AI reply drafts", false], ["White-label", false], ["Priority support", false]] },
  { id: "pro", name: "Pro", sub: "For growing businesses", price: "₹499", year: "₹4,790", yearMonthly: "₹399", popular: true, f: [["Unlimited posts", true], ["5 social platforms", true], ["Full AI (500 calls/day)", true], ["AI reply drafts", true], ["Advanced analytics", true], ["Auto-moderation", true], ["Email support", true], ["White-label", false]] },
  { id: "business", name: "Business", sub: "For agencies & teams", price: "₹1,499", year: "₹14,390", yearMonthly: "₹1,199", f: [["Everything in Pro", true], ["Unlimited platforms", true], ["Unlimited AI (5000 calls/day)", true], ["White-label", true], ["Custom domain", true], ["Team members (10)", true], ["Priority support", true], ["Dedicated manager", true]] },
];

function Onboarding() {
  const { current, refresh } = useWorkspace();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [handle, setHandle] = useState("");
  const [plan, setPlan] = useState("");
  const [trained, setTrained] = useState(false);
  const { data: firstName } = useQuery({ queryKey: ["my-name"], queryFn: async () => { const { data: u } = await supabase.auth.getUser(); return (await supabase.from("profiles").select("full_name").eq("id", u.user?.id ?? "").maybeSingle()).data?.full_name ?? ""; } });

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts", current?.id],
    enabled: !!current,
    queryFn: async () => (await supabase.from("social_accounts").select("*").eq("workspace_id", current!.id)).data ?? [],
  });

  const [localDone, setLocalDone] = useState<string[]>([]);
  const [moreOpen, setMoreOpen] = useState(false);
  const connectedCount = ONB_PLATFORMS.filter((p) => (p.db ? accounts.some((a) => a.platform === p.db) : localDone.includes(p.id))).length;

  async function connectAny(p: OnbPlatform) {
    if (!current || !handle.trim()) return;
    if (p.db) {
      const { error } = await supabase.from("social_accounts").insert({ workspace_id: current.id, platform: p.db, handle: handle.trim().replace(/^@/, ""), status: "test" });
      if (error) {
        toast.error(error.message);
        return;
      }
      qc.invalidateQueries({ queryKey: ["accounts"] });
    } else {
      setLocalDone((x) => [...x, p.id]);
      toast.info(`${p.label} is noted — full support is coming soon.`);
    }
    setConnecting(null);
    setHandle("");
  }

  async function finish(bp: BrandProfile | null) {
    if (!current) return;
    const { error } = await supabase
      .from("workspaces")
      .update({
        onboarded: true,
        ...(bp ? { name: bp.name.trim() || current.name, brand_description: bp.description || null, brand_tone: bp.tones.join(", ") || null, brand_profile: bp } : {}),
      })
      .eq("id", current.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTrained(!!bp);
    refresh();
    setStep(5);
  }

  function choosePlan() {
    if (plan !== "free") toast.info("Payments are being set up — you'll start on Free and can upgrade from Billing soon.");
    setStep(4);
  }

  const pct = (step / steps.length) * 100;

  return (
    <div className="min-h-screen bg-background px-4 py-8 font-sans text-foreground">
      <div className="mx-auto max-w-4xl">
        <div className="mb-2 flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary"><Sparkles className="h-4 w-4 text-primary-foreground" /></div>
          <span className="font-semibold">SocialOS</span>
          <span className="ml-auto text-xs text-muted-foreground">Step {step} of {steps.length}</span>
        </div>
        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-gradient-primary transition-all duration-500" style={{ width: `${pct}%` }} /></div>
        <div className="mb-10 hidden justify-between text-xs text-muted-foreground sm:flex">
          {steps.map((s, i) => <span key={s} className={i + 1 <= step ? "text-accent-foreground" : ""}>{s}</span>)}
        </div>

        <div key={step} className="animate-rise">
          {step === 1 && (
            <div className="text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary shadow-glow"><Sparkles className="h-8 w-8 text-primary-foreground" /></div>
              <h1 className="mt-6 text-4xl font-semibold">Welcome to SocialOS</h1>
              <p className="mt-2 text-muted-foreground">Manage all your social media with AI</p>
              <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
                {[{ i: Wand2, t: "AI posts", s: "Captions, hashtags and images in your voice" }, { i: Inbox, t: "Unified inbox", s: "Every comment and DM in one place" }, { i: BarChart3, t: "Analytics", s: "See what works and when to post" }].map((f) => (
                  <div key={f.t} className={`${cardCls} text-left`}><f.i className="h-6 w-6 text-primary" /><p className="mt-3 font-semibold">{f.t}</p><p className="mt-1 text-sm text-muted-foreground">{f.s}</p></div>
                ))}
              </div>
              <button onClick={() => setStep(2)} className={`${btnPrimary} mt-10 px-8 py-3 text-base`}>Get Started</button>
            </div>
          )}

          {step === 2 && (
            <>
              <h1 className="text-center text-3xl font-semibold">Connect your accounts</h1>
              <p className="mb-8 mt-2 text-center text-muted-foreground">No passwords needed. You can add more later.</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ONB_PLATFORMS.map((p) => {
                  const done = p.db ? accounts.some((a) => a.platform === p.db) : localDone.includes(p.id);
                  return (
                    <div key={p.id} className={`${cardCls} flex flex-col items-center gap-2 py-6 text-center transition-all duration-200 hover:-translate-y-1 hover:border-primary ${done ? "border-success/60 bg-success/5" : ""}`}>
                      <PlatformIcon id={p.id} />
                      <p className="mt-1 font-semibold">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.desc}</p>
                      {done ? (
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-success px-3 py-1 text-xs font-semibold text-background"><Check className="h-3.5 w-3.5" /> Connected</span>
                      ) : connecting === p.id ? (
                        <div className="mt-2 flex w-full gap-2">
                          <input autoFocus className={inputCls} placeholder="@handle" value={handle} onChange={(e) => setHandle(e.target.value)} />
                          <button onClick={() => connectAny(p)} className={btnPrimary}>Add</button>
                        </div>
                      ) : (
                        <button onClick={() => setConnecting(p.id)} className="mt-2 rounded-xl border border-input px-5 py-2 text-sm font-medium transition-colors hover:border-primary hover:bg-accent">Connect</button>
                      )}
                    </div>
                  );
                })}
                <button onClick={() => setMoreOpen(true)} className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input text-muted-foreground transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:text-foreground">
                  <Plus className="h-6 w-6" /> <span className="font-medium">Add More Platforms</span>
                </button>
              </div>
              <div className="mt-10 flex items-center justify-between">
                <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
                <button onClick={() => setStep(3)} className="text-sm text-muted-foreground hover:text-foreground">Skip for now</button>
                <button disabled={connectedCount === 0} onClick={() => setStep(3)} className={`${btnPrimary} disabled:cursor-not-allowed disabled:opacity-40`}>Continue</button>
              </div>
              {moreOpen && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 px-4 backdrop-blur-sm" onClick={() => setMoreOpen(false)}>
                  <div className={`${cardCls} w-full max-w-sm animate-rise`} onClick={(e) => e.stopPropagation()}>
                    <h2 className="text-lg font-semibold">More platforms</h2>
                    <p className="mb-4 mt-1 text-sm text-muted-foreground">These are coming soon. Tap one to tell us you want it.</p>
                    <div className="grid grid-cols-2 gap-2">
                      {["Snapchat", "Reddit", "Telegram", "Tumblr", "Discord", "Medium"].map((n) => (
                        <button key={n} onClick={() => { toast.success(`Thanks — we'll let you know when ${n} is ready`); }} className="rounded-xl border border-input py-2.5 text-sm hover:border-primary hover:bg-accent">{n}</button>
                      ))}
                    </div>
                    <div className="mt-4 text-right"><button onClick={() => setMoreOpen(false)} className="text-sm text-muted-foreground hover:text-foreground">Close</button></div>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-center text-3xl font-semibold">Choose your plan</h1>
              <p className="mt-2 text-center text-muted-foreground">Start free. Upgrade anytime. No credit card required.</p>
              <div className="mx-auto my-8 flex w-fit rounded-xl border border-border bg-card p-1 text-sm">
                {(["monthly", "yearly"] as const).map((b) => (
                  <button key={b} onClick={() => setBilling(b)} className={`rounded-lg px-4 py-1.5 font-medium transition-colors ${billing === b ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    {b === "monthly" ? "Monthly" : <>Yearly <span className={billing === b ? "" : "text-primary"}>(Save 20%)</span></>}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((p) => {
                  const yearly = billing === "yearly" && p.year;
                  const selected = plan === p.id;
                  return (
                    <div key={p.id} onClick={() => setPlan(p.id)} className={`${cardCls} relative flex cursor-pointer flex-col transition-all duration-200 hover:-translate-y-1 ${p.popular ? "border-2 border-primary shadow-glow" : ""} ${selected ? "ring-2 ring-primary" : ""}`}>
                      {p.popular && <span className="absolute right-4 top-4 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">Most Popular</span>}
                      {p.id === "free" && <span className="absolute right-4 top-4 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">{current?.plan === "free" ? "Current" : "Start Free"}</span>}
                      <p className={`font-semibold ${selected ? "pl-7" : ""}`}>{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.sub}</p>
                      {selected && <span className="absolute left-4 top-4 grid h-5 w-5 place-items-center rounded-full bg-primary"><Check className="h-3 w-3 text-primary-foreground" /></span>}
                      <p className="mt-2 text-3xl font-semibold">
                        {yearly ? p.year : p.price}
                        <span className="text-sm font-normal text-muted-foreground">{yearly ? "/year" : "/month"}</span>
                      </p>
                      <p className="h-5 text-xs text-muted-foreground">{yearly ? `${p.yearMonthly}/month billed yearly` : ""}</p>
                      <ul className="mt-4 flex-1 space-y-2 text-sm">
                        {p.f.map(([x, ok]) => (
                          <li key={x} className={`flex items-center gap-2 ${ok ? "" : "text-muted-foreground"}`}>
                            {ok ? <Check className="h-4 w-4 shrink-0 text-primary" /> : <XIcon className="h-4 w-4 shrink-0 text-muted-foreground" />}{x}
                          </li>
                        ))}
                      </ul>
                      <button
                        disabled={p.id === "free" && current?.plan === "free" && selected}
                        onClick={(e) => { e.stopPropagation(); setPlan(p.id); }}
                        className={`mt-6 rounded-xl py-2.5 text-sm font-semibold transition-all disabled:cursor-default disabled:opacity-50 ${p.id === "pro" ? btnPrimary : p.id === "business" ? "border border-primary text-primary hover:bg-accent" : "border border-input hover:bg-accent"}`}
                      >
                        {p.id === "free" ? (selected ? "Selected" : "Start Free") : selected ? "Selected ✓" : `Choose ${p.name}`}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-10 flex items-center justify-between">
                <button onClick={() => setStep(2)} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
                <button onClick={() => { setPlan("free"); setStep(4); }} className="text-sm text-muted-foreground hover:text-foreground">Skip for now</button>
                <button disabled={!plan} onClick={choosePlan} className={`${btnPrimary} disabled:opacity-40`}>Continue</button>
              </div>
            </>
          )}

          {step === 4 && (
            <TrainStep
              initial={{ name: current?.name ?? "", description: current?.brand_description ?? "", tones: current?.brand_tone ? current.brand_tone.split(", ") : [], audiences: [], pillars: [], frequency: "3 posts/week", platforms: ONB_PLATFORMS.filter((p) => (p.db ? accounts.some((a) => a.platform === p.db) : localDone.includes(p.id))).map((p) => (p.id === "twitter" ? "X" : p.label)), hashtags: [] }}
              onBack={() => setStep(3)}
              onSkip={() => finish(null)}
              onSave={(bp) => finish(bp)}
            />
          )}

          {step === 5 && (
            <DoneStep
              name={(firstName || current?.name || "there").split(" ")[0]!}
              summary={[
                connectedCount ? `Connected ${connectedCount} social account${connectedCount > 1 ? "s" : ""}` : "Social accounts — connect any time",
                trained ? "AI trained on your brand voice" : "AI ready (add brand details in Settings)",
                `${plan === "business" ? "Business" : plan === "pro" ? "Pro" : "Free"} plan selected${plan !== "free" ? " — you're on Free until payment is set up" : ""}`,
                "Composer ready for your first AI post",
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Nav({ onSkip, onNext, nextLabel = "Continue" }: { onSkip: () => void; onNext: () => void; nextLabel?: string }) {
  return (
    <div className="mt-10 flex items-center justify-between">
      <button onClick={onSkip} className="text-sm text-muted-foreground hover:text-foreground">Skip for now</button>
      <button onClick={onNext} className={btnPrimary}>{nextLabel}</button>
    </div>
  );
}
