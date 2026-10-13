import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { PageHeader, btnPrimary, inputCls } from "@/components/AppShell";
import { Panel, SampleNote, Table, btnOutline } from "@/components/portal-ui";
import { emailTemplates, featureFlags, pricingPlans } from "@/lib/sample-data";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: Settings,
});

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`relative h-5 w-9 rounded-full transition-colors ${on ? "bg-primary" : "bg-muted"}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-foreground transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}

function Settings() {
  const [flags, setFlags] = useState(featureFlags);
  const [plans, setPlans] = useState(pricingPlans);
  const flip = (key: string, tier: "free" | "pro" | "business") =>
    setFlags((f) => f.map((x) => (x.key === key ? { ...x, [tier]: !x[tier] } : x)));

  return (
    <>
      <PageHeader subtitle="Platform configuration" title="Settings" />
      <SampleNote>These settings are a preview and are not saved yet — they'll be stored once billing is connected.</SampleNote>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Platform config">
          <div className="space-y-3 text-sm">
            <label className="block">Platform name<input className={`${inputCls} mt-1`} defaultValue="SocialOS" /></label>
            <label className="block">Support email<input className={`${inputCls} mt-1`} defaultValue="support@socialos.in" /></label>
            <label className="block">Partner commission (%)<input type="number" className={`${inputCls} mt-1`} defaultValue={20} /></label>
            <button className={btnPrimary} onClick={() => toast.success("Saved (preview)")}>Save</button>
          </div>
        </Panel>
        <Panel title="Pricing plans" subtitle="Monthly, in ₹">
          <Table
            head={["Plan", "Price", "Posts", "AI calls", "Platforms"]}
            rows={plans.map((p, i) => [
              <span key="n" className="font-medium">{p.name}</span>,
              <input
                key="p"
                type="number"
                aria-label={`${p.name} price`}
                className={`${inputCls} w-24 py-1`}
                value={p.price}
                onChange={(e) => setPlans((x) => x.map((y, j) => (j === i ? { ...y, price: Number(e.target.value) } : y)))}
              />,
              p.posts,
              p.ai,
              p.platforms,
            ])}
          />
        </Panel>
        <Panel title="Feature flags" subtitle="Turn features on or off per plan">
          <Table
            head={["Feature", "Free", "Pro", "Business"]}
            rows={flags.map((f) => [
              f.label,
              <Toggle key="f" label={`${f.label} free`} on={f.free} onChange={() => flip(f.key, "free")} />,
              <Toggle key="p" label={`${f.label} pro`} on={f.pro} onChange={() => flip(f.key, "pro")} />,
              <Toggle key="b" label={`${f.label} business`} on={f.business} onChange={() => flip(f.key, "business")} />,
            ])}
          />
        </Panel>
        <Panel title="Email templates">
          <ul className="space-y-2">
            {emailTemplates.map((t) => (
              <li key={t} className="flex items-center gap-3 rounded-xl p-2 text-sm hover:bg-secondary/40">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {t}
                <button className={`${btnOutline} ml-auto py-1 text-xs`} onClick={() => toast.info("Email editor comes with email setup")}>Edit</button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
