import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, btnPrimary, inputCls } from "@/components/AppShell";
import { Panel, Pill, SampleNote, Table, selectCls } from "@/components/portal-ui";
import { tickets } from "@/lib/sample-data";

export const Route = createFileRoute("/_authenticated/partner/support")({
  component: Support,
});

function Support() {
  const [rows, setRows] = useState(tickets.filter((t) => t.from === "GrowthLab Agency"));
  const [form, setForm] = useState({ subject: "", priority: "medium", details: "" });

  function raise(e: React.FormEvent) {
    e.preventDefault();
    const id = `T-${1043 + rows.length}`;
    setRows([{ id, subject: form.subject, from: "GrowthLab Agency", priority: form.priority, assignee: "Unassigned", status: "open" }, ...rows]);
    toast.success(`Ticket ${id} raised`);
    setForm({ subject: "", priority: "medium", details: "" });
  }

  return (
    <>
      <PageHeader subtitle="Get help from the SocialOS team" title="Support" />
      <SampleNote>Tickets are kept for this session only until the ticket system goes live.</SampleNote>
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Panel title="Raise a ticket" className="h-fit">
          <form onSubmit={raise} className="space-y-3">
            <input required className={inputCls} placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <select className={`${selectCls} w-full`} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
            <textarea required className={`${inputCls} min-h-28`} placeholder="Describe the issue" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
            <button className={`${btnPrimary} w-full`}>Submit ticket</button>
          </form>
        </Panel>
        <Panel title="Ticket history">
          <Table head={["Ticket", "Subject", "Priority", "Status"]} rows={rows.map((t) => [<span key="i" className="font-mono text-xs">{t.id}</span>, t.subject, <Pill key="p" value={t.priority} />, <Pill key="s" value={t.status} />])} />
        </Panel>
      </div>
    </>
  );
}
