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
      <PageHeader subtitle="Across all partners" title="Clients" />
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
    </>
  );
}
