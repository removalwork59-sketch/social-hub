import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { createPartnerLogin } from "@/lib/partner.functions";
import { toast } from "sonner";
import { Building2, CheckCircle2, IndianRupee, Plus, Search, Users, X } from "lucide-react";
import { PageHeader, btnPrimary, inputCls } from "@/components/AppShell";
import { Panel, Pill, Stat, inr } from "@/components/portal-ui";

const PRICE: Record<string, number> = { free: 0, pro: 499, business: 1499 };
const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
type P = { id: string; name: string; email: string; clients: number; share: number; revenue: number; status: "active" | "pending" | "inactive"; color: string; hasLogin: boolean; clientList: { name: string; plan: string }[] };

export const Route = createFileRoute("/_authenticated/admin/partners")({
  head: () => ({ meta: [{ title: "Partners — SocialOS Admin" }, { name: "description", content: "Manage white-label partners." }] }),
  component: Partners,
});

const tabs = ["Overview", "Clients", "Revenue", "Branding", "Permissions", "Settings"] as const;
const initials = (n: string) => n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

function Avatar({ p, size = "h-9 w-9" }: { p: P; size?: string }) {
  return <div className={`grid ${size} shrink-0 place-items-center rounded-full text-xs font-semibold text-primary-foreground`} style={{ background: p.color }}>{initials(p.name)}</div>;
}

function Partners() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-partners"],
    queryFn: async (): Promise<P[]> => {
      const [{ data: ps, error }, { data: cs }] = await Promise.all([
        supabase.from("partners").select("*").order("created_at"),
        supabase.rpc("admin_partner_clients"),
      ]);
      if (error) throw error;
      return (ps ?? []).map((p) => {
        const mine = (cs ?? []).filter((c) => c.partner_id === p.id);
        return { id: p.id, name: p.name, email: p.email, share: Number(p.commission_pct), status: p.status as P["status"], color: p.color, hasLogin: !!p.user_id, clients: mine.length, revenue: mine.reduce((a, c) => a + (PRICE[c.plan] ?? 0), 0), clientList: mine.map((c) => ({ name: c.name, plan: c.plan })) };
      });
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-partners"] });
  async function update(id: string, patch: { status?: string; commission_pct?: number }) {
    const { error } = await supabase.from("partners").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Partner updated");
    refresh();
  }
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState<P | null>(null);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", share: 20 });

  const list = rows.filter((p) => (status === "all" || p.status === status) && (!q || `${p.name} ${p.email}`.toLowerCase().includes(q.toLowerCase())));
  const stats = [
    { label: "Total partners", value: rows.length, icon: Building2, trend: 8 },
    { label: "Active partners", value: rows.filter((p) => p.status === "active").length, icon: CheckCircle2, trend: 5 },
    { label: "Total clients", value: rows.reduce((a, p) => a + p.clients, 0), icon: Users, trend: 12 },
    { label: "Total revenue", value: inr(rows.reduce((a, p) => a + p.revenue, 0)), icon: IndianRupee, trend: 9 },
  ];

  async function add() {
    if (!form.name.trim() || !form.email.includes("@")) {
      toast.error("Enter a name and valid email");
      return;
    }
    const { error } = await supabase.from("partners").insert({ name: form.name.trim(), email: form.email.trim().toLowerCase(), commission_pct: form.share, status: "pending", color: COLORS[rows.length % COLORS.length] ?? "var(--chart-1)" });
    if (error) { toast.error(error.message); return; }
    setAdding(false);
    setForm({ name: "", email: "", share: 20 });
    toast.success("Partner saved");
    refresh();
  }

  return (
    <>
      <PageHeader subtitle="White-label resellers" title="Partners" action={<button className={btnPrimary} onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add Partner</button>} />
      <section className="mt-4 grid grid-cols-2 gap-4 xl:grid-cols-4">{stats.map((s, i) => <Stat key={s.label} {...s} i={i} />)}</section>

      <div className="mt-4 flex flex-wrap gap-2">
        <div className="flex min-w-56 flex-1 items-center gap-2 rounded-xl border border-input bg-card px-3 sm:max-w-xs">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input placeholder="Search partners..." className="w-full bg-transparent py-2 text-sm outline-none" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select aria-label="Status" className="rounded-xl border border-input bg-card px-3 py-1.5 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="pending">Pending</option>
        </select>
      </div>

      <Panel title={`${list.length} partners`} className="mt-4">
        {isLoading ? <div className="skeleton h-32" /> : list.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No partners yet. Add your first partner.</p>
            <button className={`${btnPrimary} mt-3`} onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add Partner</button>
          </div>
        ) : (
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">{["Partner", "Email", "Clients", "Revenue", "Commission", "Status", "Actions"].map((h) => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} onClick={() => { setOpen(p); setTab("Overview"); }} className="cursor-pointer border-b border-border/60 hover:bg-secondary/40">
                    <td className="px-2 py-3"><div className="flex items-center gap-2.5"><Avatar p={p} /><span className="font-medium">{p.name}</span></div></td>
                    <td className="px-2 text-muted-foreground">{p.email}</td>
                    <td className="px-2">{p.clients}</td>
                    <td className="px-2">{inr(p.revenue)}</td>
                    <td className="px-2">{p.share}%</td>
                    <td className="px-2"><Pill value={p.status} /></td>
                    <td className="px-2">
                      <div className="flex gap-1.5">
                        <button onClick={(e) => { e.stopPropagation(); setOpen(p); setTab("Overview"); }} className="rounded-lg border border-input px-2.5 py-1 text-xs hover:bg-secondary">View</button>
                        <button onClick={(e) => { e.stopPropagation(); setOpen(p); setTab("Settings"); }} className="rounded-lg border border-input px-2.5 py-1 text-xs hover:bg-secondary">Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {open && <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" onClick={() => setOpen(null)} />}
      <aside className={`scroll-thin fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto border-l border-border bg-card p-5 shadow-soft transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
        {open && (
          <>
            <div className="flex items-center gap-3">
              <Avatar p={open} size="h-12 w-12" />
              <div className="flex-1"><h2 className="font-semibold">{open.name}</h2><p className="text-xs text-muted-foreground">{open.email}</p></div>
              <button onClick={() => setOpen(null)} aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <div className="scroll-thin mt-4 flex gap-1 overflow-x-auto border-b border-border">
              {tabs.map((t) => <button key={t} onClick={() => setTab(t)} className={`shrink-0 border-b-2 px-3 py-2 text-sm ${tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}>{t}</button>)}
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {tab === "Overview" && (
                <div className="grid grid-cols-2 gap-3">
                  {[["Clients", open.clients], ["Monthly revenue", inr(open.revenue)], ["Commission", `${open.share}%`], ["Status", open.status]].map(([l, v]) => (
                    <div key={l} className="rounded-xl bg-secondary/60 p-3"><p className="text-xs text-muted-foreground">{l}</p><p className="mt-1 font-semibold capitalize">{v}</p></div>
                  ))}
                </div>
              )}
              {tab === "Clients" && (
                <ul className="divide-y divide-border">
                  {open.clientList.map((c) => <li key={c.name} className="flex justify-between py-2"><span>{c.name}</span><span className="capitalize text-muted-foreground">{c.plan}</span></li>)}
                  {open.clientList.length === 0 && <li className="py-4 text-muted-foreground">No clients yet. Assign one from the Clients page.</li>}
                </ul>
              )}
              {tab === "Revenue" && (
                <div className="space-y-2">
                  <p>Earnings this month: <b>{inr(open.revenue)}</b></p>
                  <p>Commission payout: <b>{inr(Math.round((open.revenue * open.share) / 100))}</b></p>
                  <p className="text-muted-foreground">Next payout: 1st of next month</p>
                </div>
              )}
              {tab === "Branding" && <p className="text-muted-foreground">Logo, brand colour and custom domain are managed by the partner in their portal.</p>}
              {tab === "Permissions" && ["Create clients", "Set custom pricing", "White-label domain", "Impersonate clients"].map((x) => (
                <label key={x} className="flex items-center justify-between rounded-xl border border-border px-3 py-2"><span>{x}</span><input type="checkbox" defaultChecked className="accent-[var(--primary)]" /></label>
              ))}
              {tab === "Settings" && (
                <div className="space-y-3">
                  <PartnerLogin partner={open} onDone={refresh} />
                  <label className="block">Commission %<input type="number" className={`${inputCls} mt-1`} defaultValue={open.share} onBlur={(e) => { const v = Number(e.target.value); if (v !== open.share) { update(open.id, { commission_pct: v }); setOpen({ ...open, share: v }); } }} /></label>
                  <div className="flex gap-2">
                    {(["active", "pending", "inactive"] as const).map((s) => (
                      <button key={s} onClick={() => { update(open.id, { status: s }); setOpen({ ...open, status: s }); }} className={`rounded-lg border px-3 py-1.5 text-xs capitalize ${open.status === s ? "border-primary bg-accent" : "border-input"}`}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </aside>

      {adding && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 p-4 backdrop-blur-sm" onClick={() => setAdding(false)}>
          <div className="w-full max-w-md space-y-3 rounded-xl border border-border bg-card p-5 shadow-soft" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Add partner</h2>
            <input className={inputCls} placeholder="Agency name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className={inputCls} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <label className="block text-sm text-muted-foreground">Commission %<input type="number" className={`${inputCls} mt-1`} value={form.share} onChange={(e) => setForm({ ...form, share: Number(e.target.value) })} /></label>
            <div className="flex justify-end gap-2"><button onClick={() => setAdding(false)} className="rounded-xl px-4 py-2 text-sm">Cancel</button><button onClick={add} className={btnPrimary}>Add partner</button></div>
          </div>
        </div>
      )}
    </>
  );
}

function PartnerLogin({ partner, onDone }: { partner: P; onDone: () => void }) {
  const create = useServerFn(createPartnerLogin);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  if (partner.hasLogin) return <p className="rounded-xl bg-success/10 px-3 py-2 text-success">Partner login active — {partner.email} can sign in to the Partner portal.</p>;
  async function go() {
    setBusy(true);
    try {
      await create({ data: { partnerId: partner.id, email: partner.email, name: partner.name, password: pw } });
      toast.success(`Login created — ${partner.email} can now sign in`);
      setPw("");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create login");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="mb-2 font-medium">Partner portal login</p>
      <p className="mb-2 text-xs text-muted-foreground">Creates a sign-in for {partner.email} with access to their own Partner portal.</p>
      <div className="flex gap-2">
        <input className={inputCls} placeholder="Temporary password (min 6)" value={pw} onChange={(e) => setPw(e.target.value)} />
        <button disabled={busy || pw.length < 6} onClick={go} className={`${btnPrimary} disabled:opacity-40`}>{busy ? "…" : "Create"}</button>
      </div>
    </div>
  );
}
