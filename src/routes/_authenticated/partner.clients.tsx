import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, btnPrimary, cardCls, inputCls } from "@/components/AppShell";
import { Panel, Pill, Stat, Table, inr, selectCls } from "@/components/portal-ui";
import { PLAN_PRICE, usePartnerData } from "@/lib/partner";
import { createPartnerClient } from "@/lib/partner.functions";
import { NotLinked } from "@/components/PartnerNotLinked";

export const Route = createFileRoute("/_authenticated/partner/clients")({
  component: MyClients,
});

type Client = { id: string; name: string; plan: string; created_at: string; posts: number; accounts: number };

function MyClients() {
  const { data, isLoading } = usePartnerData();
  const qc = useQueryClient();
  const create = useServerFn(createPartnerClient);
  const [plan, setPlan] = useState("all");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<Client | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", workspace: "", plan: "pro" as "free" | "pro" | "business" });

  if (isLoading) return <div className="skeleton h-64" />;
  if (!data?.partner) return <><PageHeader subtitle="Partner" title="My Clients" /><NotLinked /></>;
  const rows = data.clients as Client[];
  const list = rows.filter((c) => (plan === "all" || c.plan === plan) && c.name.toLowerCase().includes(q.toLowerCase()));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await create({ data: form });
      toast.success(`${form.workspace} created — share the login with ${form.email}`);
      setAdding(false);
      setForm({ name: "", email: "", password: "", workspace: "", plan: "pro" });
      qc.invalidateQueries({ queryKey: ["partner-me"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create client");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader subtitle="Clients you manage" title="My Clients" action={<button className={btnPrimary} onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add Client</button>} />
      <section className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="Total" value={rows.length} icon={Users} />
        <Stat label="Paying" value={rows.filter((c) => c.plan !== "free").length} icon={Users} i={1} />
        <Stat label="Free" value={rows.filter((c) => c.plan === "free").length} icon={Users} i={2} />
        <Stat label="MRR" value={inr(data.revenue)} icon={Users} i={3} />
      </section>
      <div className="mb-4 flex flex-wrap gap-2">
        <input className={`${inputCls} max-w-xs py-2`} placeholder="Search clients…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Plan" className={selectCls} value={plan} onChange={(e) => setPlan(e.target.value)}>
          <option value="all">All plans</option><option value="free">Free</option><option value="pro">Pro</option><option value="business">Business</option>
        </select>
      </div>
      <Panel title={`${list.length} clients`}>
        {list.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">No clients yet. Add your first client.</p>
            <button className={`${btnPrimary} mt-3`} onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add Client</button>
          </div>
        ) : (
          <Table
            head={["Client", "Plan", "MRR", "Accounts", "Posts", ""]}
            rows={list.map((c) => [
              <span key="n" className="font-medium">{c.name}</span>, <Pill key="p" value={c.plan} />, inr(PLAN_PRICE[c.plan] ?? 0), c.accounts, c.posts,
              <button key="v" onClick={() => setOpen(c)} className="rounded-lg border border-input px-2.5 py-1 text-xs hover:bg-secondary">View</button>,
            ])}
          />
        )}
      </Panel>

      {open && (
        <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <aside className="scroll-thin fixed inset-y-0 right-0 w-full max-w-md overflow-y-auto border-l border-border bg-card p-5 shadow-soft" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{open.name}</h2><button onClick={() => setOpen(null)} aria-label="Close"><X className="h-5 w-5" /></button></div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {[["Plan", open.plan], ["Revenue / mo", inr(PLAN_PRICE[open.plan] ?? 0)], ["Your commission", inr(Math.round(((PLAN_PRICE[open.plan] ?? 0) * data.pct) / 100))], ["Social accounts", open.accounts], ["Posts", open.posts], ["Client since", new Date(open.created_at).toLocaleDateString("en-IN")]].map(([l, v]) => (
                <div key={String(l)} className="rounded-xl bg-secondary/60 p-3"><p className="text-xs text-muted-foreground">{l}</p><p className="mt-1 font-semibold capitalize">{v}</p></div>
              ))}
            </div>
          </aside>
        </div>
      )}

      {adding && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 px-4 backdrop-blur-sm" onClick={() => setAdding(false)}>
          <form onSubmit={add} className={`${cardCls} w-full max-w-sm animate-rise space-y-3`} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Add client</h2>
            <input required className={inputCls} placeholder="Business name" value={form.workspace} onChange={(e) => setForm({ ...form, workspace: e.target.value })} />
            <input required className={inputCls} placeholder="Owner name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input required type="email" className={inputCls} placeholder="Owner email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input required minLength={6} className={inputCls} placeholder="Temporary password (min 6)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <select className={`${selectCls} w-full`} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value as typeof form.plan })}>
              <option value="free">Free</option><option value="pro">Pro — ₹499/mo</option><option value="business">Business — ₹1499/mo</option>
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setAdding(false)} className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button disabled={busy} className={btnPrimary}>{busy ? "Creating…" : "Create client"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
