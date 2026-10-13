import { createFileRoute } from "@tanstack/react-router";
import { Download, IndianRupee, Percent, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, btnPrimary } from "@/components/AppShell";
import { Panel, Pill, SampleNote, Stat, Table, btnOutline, inr } from "@/components/portal-ui";
import { partnerEarnings, payouts } from "@/lib/sample-data";

export const Route = createFileRoute("/_authenticated/partner/billing")({
  component: Billing,
});

function invoice(id: string, amount: number, date: string) {
  const text = `SocialOS — Commission invoice\n\nInvoice: ${id}\nDate: ${date}\nPartner: GrowthLab Agency\nAmount: ${inr(amount)}\nCommission rate: 20%\n`;
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function Billing() {
  const last = partnerEarnings[partnerEarnings.length - 1]!;
  const lifetime = payouts.reduce((s, p) => s + p.amount, 0);
  return (
    <>
      <PageHeader
        subtitle="Commission & payouts"
        title="Billing"
        action={<button className={btnPrimary} onClick={() => toast.success("Payout request sent")}><Wallet className="h-4 w-4" /> Request payout</button>}
      />
      <SampleNote />
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="This month's earnings" value={inr(last.commission)} icon={IndianRupee} trend={12} />
        <Stat label="Available for payout" value={inr(last.commission)} icon={Wallet} i={1} />
        <Stat label="Lifetime paid" value={inr(lifetime)} icon={IndianRupee} i={2} />
        <Stat label="Commission rate" value="20%" icon={Percent} i={3} />
      </section>
      <Panel title="Payout history" className="mt-4">
        <Table
          head={["Payout", "Date", "Amount", "Status", ""]}
          rows={payouts.map((p) => [
            <span key="i" className="font-mono text-xs">{p.id}</span>,
            p.date,
            inr(p.amount),
            <Pill key="s" value={p.status} />,
            <button key="d" className={`${btnOutline} py-1 text-xs`} onClick={() => invoice(p.id, p.amount, p.date)}>
              <Download className="h-3.5 w-3.5" /> Invoice
            </button>,
          ])}
        />
      </Panel>
    </>
  );
}
