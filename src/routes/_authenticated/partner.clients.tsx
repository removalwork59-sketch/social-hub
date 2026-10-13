import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, btnPrimary, cardCls, inputCls } from "@/components/AppShell";
import { Panel, Pill, SampleNote, Table, inr, selectCls } from "@/components/portal-ui";
import { sampleClients } from "@/lib/sample-data";

export const Route = createFileRoute("/_authenticated/partner/clients")({
  component: MyClients,
});

function MyClients() {
  const [rows, setRows] = useState(sampleClients.map((c) => ({ ...c, partner: "GrowthLab Agency" })));
  const [plan, setPlan] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", plan: "Pro" });

  const list = rows.filter(
    (c) => (plan === "all" || c.plan === plan) && (status === "all" || c.status === status) && c.name.toLowerCase().includes(q.toLowerCase()),
  );

  function add(e: React.FormEvent) {
    e.preventDefault();
    const mrr = form.plan === "Pro" ? 499 : form.plan === "Business" ? 1499 : 0;
    setRows([{ name: form.name, partner: "GrowthLab Agency", plan: form.plan, status: "trial", mrr }, ...rows]);
    toast.success(`${form.name} added`);
    setAdding(false);
    setForm({ name: "", email: "", plan: "Pro" });
  }

  return (
    <>
      <PageHeader
        subtitle="Clients you manage"
        title="My Clients"
        action={<button className={btnPrimary} onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add client</button>}
      />
      <SampleNote>Sample clients — new clients you add here are kept for this session only until partner accounts go live.</SampleNote>
      <div className="mb-4 flex flex-wrap gap-2">
        <input className={`${inputCls} max-w-xs py-2`} placeholder="Search clients…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Plan" className={selectCls} value={plan} onChange={(e) => setPlan(e.target.value)}>
          <option value="all">All plans</option>
          {["Free", "Pro", "Business"].map((p) => <option key={p}>{p}</option>)}
        </select>
        <select aria-label="Status" className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {["active", "trial", "suspended"].map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      <Panel title={`${list.length} clients`}>
        <Table head={["Client", "Plan", "Status", "Revenue / mo"]} rows={list.map((c) => [<span key="n" className="font-medium">{c.name}</span>, c.plan, <Pill key="s" value={c.status} />, inr(c.mrr)])} />
      </Panel>

      {adding && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 px-4 backdrop-blur-sm" onClick={() => setAdding(false)}>
          <form onSubmit={add} className={`${cardCls} w-full max-w-sm animate-rise space-y-3`} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Add client</h2>
            <input required className={inputCls} placeholder="Business name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input required type="email" className={inputCls} placeholder="Owner email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <select className={`${selectCls} w-full`} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
              {["Free", "Pro", "Business"].map((p) => <option key={p}>{p}</option>)}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setAdding(false)} className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button className={btnPrimary}>Add client</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
