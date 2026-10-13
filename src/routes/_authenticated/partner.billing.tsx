import { createFileRoute } from "@tanstack/react-router";
import { Download, IndianRupee, Percent, Wallet } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Panel, Pill, Stat, Table, btnOutline, inr } from "@/components/portal-ui";
import { usePartnerData } from "@/lib/partner";
import { NotLinked } from "@/components/PartnerNotLinked";

export const Route = createFileRoute("/_authenticated/partner/billing")({
  component: Billing,
});

const monthLabel = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { month: "long", year: "numeric" });

function Billing() {
  const { data, isLoading } = usePartnerData();
  if (isLoading) return <div className="skeleton h-64" />;
  if (!data?.partner) return <><PageHeader subtitle="Partner" title="Billing & payouts" /><NotLinked /></>;
  const { partner, payouts, commission, pct } = data;
  const pending = payouts.filter((p) => p.status === "pending").reduce((a, p) => a + p.amount, 0);
  const paid = payouts.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);

  function invoice(p: (typeof payouts)[number]) {
    const text = `SocialOS — Commission statement\n\nPartner: ${partner!.name}\nMonth: ${monthLabel(p.period)}\nClient revenue: ${inr(p.revenue)}\nCommission rate: ${p.commission_pct}%\nPayout: ${inr(p.amount)}\nStatus: ${p.status}${p.paid_at ? `\nPaid on: ${new Date(p.paid_at).toLocaleDateString("en-IN")}` : ""}\n`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    a.download = `commission-${p.period}.txt`;
    a.click();
  }

  return (
    <>
      <PageHeader subtitle="Commission & payouts" title="Billing & payouts" />
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="Expected this month" value={inr(commission)} icon={IndianRupee} />
        <Stat label="Awaiting payout" value={inr(pending)} icon={Wallet} i={1} />
        <Stat label="Lifetime paid" value={inr(paid)} icon={IndianRupee} i={2} />
        <Stat label="Commission rate" value={`${pct}%`} icon={Percent} i={3} />
      </section>
      <Panel title="Payout history" className="mt-4">
        {payouts.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No payouts yet. They appear here once SocialOS issues your monthly commission.</p>
        ) : (
          <Table
            head={["Month", "Client revenue", "Rate", "Payout", "Status", ""]}
            rows={payouts.map((p) => [
              monthLabel(p.period), inr(p.revenue), `${p.commission_pct}%`, inr(p.amount), <Pill key="s" value={p.status} />,
              <button key="d" className={`${btnOutline} py-1 text-xs`} onClick={() => invoice(p)}><Download className="h-3.5 w-3.5" /> Statement</button>,
            ])}
          />
        )}
      </Panel>
    </>
  );
}
