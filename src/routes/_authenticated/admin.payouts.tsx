import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Panel, Pill, SampleNote, Table, inr } from "@/components/portal-ui";
import { partners } from "@/lib/sample-data";

export const Route = createFileRoute("/_authenticated/admin/payouts")({
  head: () => ({ meta: [{ title: "Billing & payouts — SocialOS Admin" }, { name: "description", content: "Partner commission payouts." }] }),
  component: Payouts,
});

function Payouts() {
  return (
    <>
      <PageHeader subtitle="Platform" title="Billing & payouts" />
      <SampleNote>Sample payouts — real figures appear once payments are connected.</SampleNote>
      <Panel title="Partner payouts · October" className="mt-4">
        <Table
          head={["Partner", "Revenue", "Commission", "Payout", "Status", ""]}
          rows={partners.map((p) => [
            p.name, inr(p.revenue), `${p.share}%`, inr(Math.round((p.revenue * p.share) / 100)),
            <Pill key="s" value={p.status === "active" ? "pending" : "paid"} />,
            <button key="b" onClick={() => toast.success(`Invoice for ${p.name} downloaded (demo)`)} className="text-xs text-accent-foreground hover:underline">Invoice</button>,
          ])}
        />
      </Panel>
    </>
  );
}
