import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, btnPrimary, inputCls } from "@/components/AppShell";
import { Panel, Pill, Table, inr, selectCls } from "@/components/portal-ui";
import { partners, sampleClients } from "@/lib/sample-data";
import { createClientAccount } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/clients")({
  component: Clients,
});

function Clients() {
  const [partner, setPartner] = useState("all");
  const [plan, setPlan] = useState("all");
  const [status, setStatus] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const qc = useQueryClient();
  const { data: live = [], isLoading } = useQuery({
    queryKey: ["admin-workspaces"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_workspaces");
      if (error) throw error;
      return data;
    },
  });

  const all = [
    ...live.map((w) => ({
      name: w.name,
      partner: "Direct",
      plan: w.plan.charAt(0).toUpperCase() + w.plan.slice(1),
      status: "active",
      mrr: w.plan === "pro" ? 499 : w.plan === "business" ? 1499 : 0,
      live: true,
      extra: `${w.posts} posts · ${w.accounts} accounts`,
    })),
    ...sampleClients.map((c) => ({ ...c, live: false, extra: "Sample" })),
  ];
  const rows = all.filter(
    (c) => (partner === "all" || c.partner === partner) && (plan === "all" || c.plan === plan) && (status === "all" || c.status === status),
  );

  return (
    <>
      <PageHeader
        subtitle="Across all partners"
        title="Clients"
        action={
          <button onClick={() => setAddOpen(true)} className={btnPrimary}>
            <UserPlus className="h-4 w-4" /> Add client
          </button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <select aria-label="Partner" className={selectCls} value={partner} onChange={(e) => setPartner(e.target.value)}>
          <option value="all">All partners</option>
          <option value="Direct">Direct</option>
          {partners.map((p) => <option key={p.id}>{p.name}</option>)}
        </select>
        <select aria-label="Plan" className={selectCls} value={plan} onChange={(e) => setPlan(e.target.value)}>
          <option value="all">All plans</option>
          {["Free", "Pro", "Business"].map((p) => <option key={p}>{p}</option>)}
        </select>
        <select aria-label="Status" className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {["active", "trial", "suspended"].map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      <Panel title={`${rows.length} clients`} subtitle="Real workspaces first, then sample clients">
        {isLoading ? (
          <div className="skeleton h-40" />
        ) : (
          <Table
            head={["Client", "Partner", "Plan", "MRR", "Status", "Details"]}
            rows={rows.map((c) => [
              <span key="n" className="font-medium">{c.name}</span>,
              c.partner,
              c.plan,
              inr(c.mrr),
              <Pill key="s" value={c.status} />,
              <span key="d" className={`text-xs ${c.live ? "text-accent-foreground" : "text-muted-foreground"}`}>{c.extra}</span>,
            ])}
          />
        )}
      </Panel>

      {addOpen && (
        <AddClientModal
          onClose={() => setAddOpen(false)}
          onCreated={() => {
            setAddOpen(false);
            qc.invalidateQueries({ queryKey: ["admin-workspaces"] });
          }}
        />
      )}
    </>
  );
}

function AddClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", workspace: "", plan: "free" as "free" | "pro" | "business" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await createClientAccount({ data: form });
      toast.success(`Client account created for ${form.email}`);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create client");
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-soft"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">New client account</h2>
          <button type="button" onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <input required placeholder="Owner name" className={inputCls} value={form.name} onChange={set("name")} />
          <input required type="email" placeholder="Email" className={inputCls} value={form.email} onChange={set("email")} />
          <input required type="text" minLength={6} placeholder="Temporary password (min 6 chars)" className={inputCls} value={form.password} onChange={set("password")} />
          <input required placeholder="Workspace name" className={inputCls} value={form.workspace} onChange={set("workspace")} />
          <select aria-label="Plan" className={inputCls} value={form.plan} onChange={set("plan")}>
            <option value="free">Free</option>
            <option value="pro">Pro — ₹499/mo</option>
            <option value="business">Business — ₹1499/mo</option>
          </select>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          The account is created already confirmed — share the email and password with the client so they can sign in right away.
        </p>
        <button disabled={busy} className={`${btnPrimary} mt-4 w-full`}>
          {busy ? "Creating…" : "Create client"}
        </button>
      </form>
    </div>
  );
}
