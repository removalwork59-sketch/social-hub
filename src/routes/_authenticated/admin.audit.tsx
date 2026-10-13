import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Panel } from "@/components/portal-ui";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => ({ meta: [{ title: "Audit logs — SocialOS Admin" }, { name: "description", content: "Every recorded platform action." }] }),
  component: Audit,
});

function Audit() {
  const [q, setQ] = useState("");
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin-audit"],
    queryFn: async () => {
      const { data, error } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data;
    },
  });
  const list = data.filter((r) => !q || `${r.action} ${r.entity} ${JSON.stringify(r.details)}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader subtitle="Platform" title="Audit logs" />
      <div className="mb-4 flex max-w-sm items-center gap-2 rounded-xl border border-input bg-card px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input placeholder="Search actions…" className="w-full bg-transparent py-2 text-sm outline-none" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Panel title={`${list.length} entries`}>
        {isLoading ? <div className="skeleton h-40" /> : error ? <p className="text-sm text-destructive">Couldn't load the audit log.</p> : list.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No actions recorded yet.</p> : (
          <ul className="divide-y divide-border text-sm">
            {list.map((r) => (
              <li key={r.id} className="flex gap-4 py-2.5">
                <span className="w-40 shrink-0 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                <span className="font-medium">{r.action}</span>
                <span className="text-muted-foreground">{r.entity}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
