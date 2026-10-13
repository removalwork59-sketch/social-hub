import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, btnPrimary } from "@/components/AppShell";
import { Panel, Pill, Table, inr } from "@/components/portal-ui";

export const Route = createFileRoute("/_authenticated/admin/payouts")({
  head: () => ({ meta: [{ title: "Billing & payouts — SocialOS Admin" }, { name: "description", content: "Partner commission payouts." }] }),
  component: Payouts,
});

const PRICE: Record<string, number> = { free: 0, pro: 499, business: 1499 };
const monthStart = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`; };
const monthLabel = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { month: "long", year: "numeric" });

function Payouts() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: async () => {
      const [{ data: ps }, { data: pay, error }] = await Promise.all([
        supabase.from("partners").select("id, name, commission_pct"),
        supabase.from("partner_payouts").select("*").order("period", { ascending: false }),
      ]);
      if (error) throw error;
      return { partners: ps ?? [], payouts: pay ?? [] };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-payouts"] });
  const name = (id: string) => data?.partners.find((p) => p.id === id)?.name ?? "—";

  async function generate() {
    const { data: cs } = await supabase.rpc("admin_partner_clients");
    const period = monthStart();
    const rows = (data?.partners ?? []).map((p) => {
      const revenue = (cs ?? []).filter((c) => c.partner_id === p.id).reduce((a, c) => a + (PRICE[c.plan] ?? 0), 0);
      const pct = Number(p.commission_pct);
      return { partner_id: p.id, period, revenue, commission_pct: pct, amount: Math.round((revenue * pct) / 100) };
    });
    if (!rows.length) { toast.error("Add a partner first"); return; }
    const { error } = await supabase.from("partner_payouts").upsert(rows, { onConflict: "partner_id,period", ignoreDuplicates: true });
    if (error) { toast.error(error.message); return; }
    toast.success(`Payouts for ${monthLabel(period)} created`);
    refresh();
  }

  async function markPaid(id: string) {
    const { error } = await supabase.from("partner_payouts").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Marked as paid");
    refresh();
  }

  function invoice(p: NonNullable<typeof data>["payouts"][number]) {
    const csv = `Partner,Period,Revenue,Commission %,Payout,Status\n"${name(p.partner_id)}",${p.period},${p.revenue},${p.commission_pct},${p.amount},${p.status}\n`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `payout-${name(p.partner_id).replace(/\s+/g, "-")}-${p.period}.csv`;
    a.click();
  }

  const pays = data?.payouts ?? [];
  const pending = pays.filter((p) => p.status === "pending").reduce((a, p) => a + p.amount, 0);
  const paid = pays.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);

  return (
    <>
      <PageHeader subtitle="Platform" title="Billing & payouts" action={<button className={btnPrimary} onClick={generate}>Create this month's payouts</button>} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel title="Pending payouts"><p className="text-2xl font-semibold">{inr(pending)}</p></Panel>
        <Panel title="Paid out"><p className="text-2xl font-semibold">{inr(paid)}</p></Panel>
      </div>
      <Panel title="Partner payouts" className="mt-4">
        {isLoading ? <div className="skeleton h-32" /> : pays.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No payouts yet. Click "Create this month's payouts" to work them out from each partner's clients.</p>
        ) : (
          <Table
            head={["Partner", "Month", "Revenue", "Commission", "Payout", "Status", ""]}
            rows={pays.map((p) => [
              name(p.partner_id), monthLabel(p.period), inr(p.revenue), `${p.commission_pct}%`, inr(p.amount),
              <Pill key="s" value={p.status} />,
              <div key="b" className="flex gap-3 text-xs">
                {p.status === "pending" && <button onClick={() => markPaid(p.id)} className="text-accent-foreground hover:underline">Mark paid</button>}
                <button onClick={() => invoice(p)} className="text-muted-foreground hover:underline">Invoice</button>
              </div>,
            ])}
          />
        )}
      </Panel>
    </>
  );
}
