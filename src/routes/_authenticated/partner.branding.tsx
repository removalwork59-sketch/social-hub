import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace";
import { PageHeader, btnPrimary, inputCls } from "@/components/AppShell";
import { Panel } from "@/components/portal-ui";

export const Route = createFileRoute("/_authenticated/partner/branding")({
  component: Branding,
});

const swatches = ["#00B5AD", "#3B82F6", "#F97316", "#E11D48", "#22C55E", "#EAB308"];

function Branding() {
  const { current, refresh } = useWorkspace();
  const [logo, setLogo] = useState<string | null>(null);
  const [color, setColor] = useState("#00B5AD");
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!current) return;
    setLogo(current.logo_url);
    setColor(current.brand_color ?? "#00B5AD");
    setDomain(current.custom_domain ?? "");
  }, [current]);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 300_000) {
      toast.error("Logo must be under 300 KB");
      return;
    }
    const r = new FileReader();
    r.onload = () => setLogo(String(r.result));
    r.readAsDataURL(f);
  }

  async function save() {
    if (!current) return;
    if (domain && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
      toast.error("Enter a domain like app.youragency.com");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("workspaces")
      .update({ logo_url: logo, brand_color: color, custom_domain: domain || null })
      .eq("id", current.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    refresh();
    toast.success("Branding saved");
  }

  const brandName = current?.name ?? "Your brand";

  return (
    <>
      <PageHeader subtitle={`Saved for workspace: ${brandName}`} title="Branding" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Your brand">
          <div className="space-y-5 text-sm">
            <div>
              <p className="mb-2 text-muted-foreground">Logo</p>
              <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-input p-4 transition-colors hover:border-primary">
                {logo ? <img src={logo} alt="Logo" className="h-12 w-12 rounded-lg object-contain" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
                <span className="text-muted-foreground">{logo ? "Change logo" : "Upload PNG or SVG (max 300 KB)"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={pick} />
              </label>
            </div>
            <div>
              <p className="mb-2 text-muted-foreground">Brand colour</p>
              <div className="flex flex-wrap items-center gap-2">
                {swatches.map((s) => (
                  <button
                    key={s}
                    aria-label={s}
                    onClick={() => setColor(s)}
                    className={`h-8 w-8 rounded-full ring-offset-2 ring-offset-card transition-transform hover:scale-110 ${color === s ? "ring-2 ring-ring" : ""}`}
                    style={{ background: s }}
                  />
                ))}
                <input type="color" aria-label="Custom colour" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-10 cursor-pointer rounded bg-transparent" />
              </div>
            </div>
            <label className="block">
              <span className="text-muted-foreground">Custom domain</span>
              <input className={`${inputCls} mt-1`} placeholder="app.youragency.com" value={domain} onChange={(e) => setDomain(e.target.value.trim())} />
              <span className="mt-1 block text-xs text-muted-foreground">Point a CNAME record to SocialOS once domain hosting is switched on.</span>
            </label>
            <button disabled={busy} onClick={save} className={btnPrimary}>Save branding</button>
          </div>
        </Panel>

        <Panel title="Email preview" subtitle="How your clients will see emails">
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <div className="flex items-center gap-2 p-4" style={{ background: color }}>
              {logo ? <img src={logo} alt="" className="h-8 w-8 rounded bg-background/30 object-contain p-0.5" /> : <Sparkles className="h-6 w-6 text-background" />}
              <span className="font-semibold text-background">{brandName}</span>
            </div>
            <div className="space-y-3 p-5 text-sm">
              <p className="font-semibold">Your weekly social report is ready 📈</p>
              <p className="text-muted-foreground">Hi there, your accounts reached 12,480 people this week — up 18% from last week. Tap below to see the full report.</p>
              <span className="inline-block rounded-lg px-4 py-2 text-xs font-semibold text-background" style={{ background: color }}>View report</span>
              <p className="pt-2 text-xs text-muted-foreground">Sent by {brandName}{domain ? ` · ${domain}` : ""}</p>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
