import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Panel, Pill, SampleNote, Table, selectCls } from "@/components/portal-ui";
import { tickets as seed } from "@/lib/sample-data";

export const Route = createFileRoute("/_authenticated/admin/support")({
  component: Support,
});

function Support() {
  const [rows, setRows] = useState(seed);
  const [status, setStatus] = useState("all");
  const list = rows.filter((t) => status === "all" || t.status === status);
  const update = (id: string, patch: Partial<(typeof seed)[number]>) => setRows((r) => r.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  return (
    <>
      <PageHeader subtitle="Partner and client requests" title="Support" />
      <SampleNote>Sample tickets — the ticket system goes live together with partner support requests.</SampleNote>
      <div className="mb-4">
        <select aria-label="Status" className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All tickets</option>
          {["open", "pending", "resolved"].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <Panel title={`${list.length} tickets`}>
        <Table
          head={["Ticket", "Subject", "From", "Priority", "Assigned to", "Status"]}
          rows={list.map((t) => [
            <span key="i" className="font-mono text-xs">{t.id}</span>,
            <span key="s" className="font-medium">{t.subject}</span>,
            t.from,
            <Pill key="p" value={t.priority} />,
            <select key="a" aria-label="Assignee" className={`${selectCls} py-1`} value={t.assignee} onChange={(e) => update(t.id, { assignee: e.target.value })}>
              {["Ravi", "Ananya", "Unassigned"].map((n) => <option key={n}>{n}</option>)}
            </select>,
            <select key="st" aria-label="Status" className={`${selectCls} py-1`} value={t.status} onChange={(e) => update(t.id, { status: e.target.value })}>
              {["open", "pending", "resolved"].map((n) => <option key={n}>{n}</option>)}
            </select>,
          ])}
        />
      </Panel>
    </>
  );
}
