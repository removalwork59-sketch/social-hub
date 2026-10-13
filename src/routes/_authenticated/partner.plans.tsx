import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, btnPrimary, cardCls, inputCls } from "@/components/AppShell";
import { Panel, SampleNote, Table, inr, selectCls } from "@/components/portal-ui";
import { sampleClients } from "@/lib/sample-data";

export const Route = createFileRoute("/_authenticated/partner/plans")({
  component: Plans,
});

type Plan = { name: string; price: number; base: string; features: string[] };

function Plans() {
  const [plans, setPlans] = useState<Plan[]>([
    { name: "Starter", price: 799, base: "Pro", features: ["3 social accounts", "Unlimited posts", "AI captions"] },
    { name: "Growth", price: 2499, base: "Business", features: ["All platforms", "AI replies", "Monthly report"] },
  ]);
  const [assign, setAssign] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: "", price: 999, base: "Pro" });

  function create(e: React.FormEvent) {
    e.preventDefault();
    setPlans([...plans, { ...form, features: [`Based on ${form.base}`] }]);
    toast.success(`Plan "${form.name}" created`);
    setForm({ name: "", price: 999, base: "Pro" });
  }

  return (
    <>
      <PageHeader subtitle="Resell with your own pricing" title="Plans" />
      <SampleNote>Plans you create are kept for this session only until partner billing goes live. Your cost: Pro ₹499, Business ₹1499.</SampleNote>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((p) => {
          const cost = p.base === "Business" ? 1499 : 499;
          return (
            <div key={p.name} className={`${cardCls} animate-rise`}>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Built on {p.base}</p>
              <h2 className="mt-1 text-lg font-semibold">{p.name}</h2>
              <p className="mt-2 text-3xl font-semibold">{inr(p.price)}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              <p className="mt-1 text-xs text-success">Your margin {inr(p.price - cost)} per client</p>
              <ul className="mt-4 space-y-1.5 text-sm">
                {p.features.map((f) => <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{f}</li>)}
              </ul>
            </div>
          );
        })}
        <form onSubmit={create} className={`${cardCls} space-y-3 border-dashed`}>
          <h2 className="font-semibold">Create plan</h2>
          <input required className={inputCls} placeholder="Plan name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required type="number" min={0} className={inputCls} placeholder="Price (₹)" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          <select className={`${selectCls} w-full`} value={form.base} onChange={(e) => setForm({ ...form, base: e.target.value })}>
            <option>Pro</option>
            <option>Business</option>
          </select>
          <button className={`${btnPrimary} w-full`}><Plus className="h-4 w-4" /> Create</button>
        </form>
      </section>
      <Panel title="Assign plans to clients" className="mt-4">
        <Table
          head={["Client", "Plan"]}
          rows={sampleClients.slice(0, 6).map((c) => [
            c.name,
            <select
              key="p"
              aria-label={`Plan for ${c.name}`}
              className={`${selectCls} py-1`}
              value={assign[c.name] ?? plans[0]?.name}
              onChange={(e) => {
                setAssign({ ...assign, [c.name]: e.target.value });
                toast.success(`${c.name} moved to ${e.target.value}`);
              }}
            >
              {plans.map((p) => <option key={p.name}>{p.name}</option>)}
            </select>,
          ])}
        />
      </Panel>
    </>
  );
}
