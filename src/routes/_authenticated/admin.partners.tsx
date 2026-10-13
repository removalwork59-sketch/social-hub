import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Ban, CheckCircle2, Plus } from "lucide-react";
import { PageHeader, btnPrimary } from "@/components/AppShell";
import { Panel, Pill, SampleNote, Table, inr } from "@/components/portal-ui";
import { partners as seed } from "@/lib/sample-data";

export const Route = createFileRoute("/_authenticated/admin/partners")({
  component: Partners,
});

function Partners() {
  const [rows, setRows] = useState(seed);
  const toggle = (id: string) =>
    setRows((r) => r.map((p) => (p.id === id ? { ...p, status: p.status === "suspended" ? "active" : "suspended" } : p)));
  return (
    <>
      <PageHeader
        subtitle="White-label resellers"
        title="Partners"
        action={
          <button className={btnPrimary} onClick={() => toast.info("Partner invites arrive with the partner sign-up flow")}>
            <Plus className="h-4 w-4" /> Invite partner
          </button>
        }
      />
      <SampleNote>Sample partners — real partner accounts appear here once partner sign-up is enabled.</SampleNote>
      <Panel title={`${rows.length} partners`}>
        <Table
          head={["Partner", "Clients", "Revenue share", "Monthly revenue", "Status", ""]}
          rows={rows.map((p) => [
            <span key="n" className="font-medium">{p.name}</span>,
            p.clients,
            `${p.share}%`,
            inr(p.revenue),
            <Pill key="s" value={p.status} />,
            <button key="a" onClick={() => toggle(p.id)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              {p.status === "suspended" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
              {p.status === "suspended" ? "Reactivate" : "Suspend"}
            </button>,
          ])}
        />
      </Panel>
    </>
  );
}
