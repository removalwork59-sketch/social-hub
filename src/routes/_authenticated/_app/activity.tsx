import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lock, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace";
import { PageHeader, cardCls, inputCls } from "@/components/AppShell";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/_authenticated/_app/activity")({
  head: () => ({ meta: [{ title: "Activity log — SocialOS" }, { name: "description", content: "Searchable history of workspace and account changes." }] }),
  component: Activity,
});

const ENTITY: Record<string, string> = { workspaces: "Workspace", social_accounts: "Social account", workspace_members: "Team member" };

function describe(entity: string, action: string, d: Record<string, unknown>) {
  if (entity === "social_accounts") return `${action === "insert" ? "Connected" : action === "delete" ? "Disconnected" : "Updated"} ${d.platform} account @${d.handle}`;
  if (entity === "workspace_members") return `${action === "insert" ? "Added member" : action === "delete" ? "Removed member" : "Changed member role"} (${d.previous_role ? `${d.previous_role} → ` : ""}${d.role})`;
  if (action === "insert") return `Created workspace “${d.name}”`;
  if (d.previous_plan) return `Plan changed ${d.previous_plan} → ${d.plan}`;
  if (d.previous_name) return `Renamed “${d.previous_name}” → “${d.name}”`;
  return "Updated workspace settings";
}

function Activity() {
  const { current, role } = useWorkspace();
  const isAdmin = role === "owner" || role === "admin";
  const [q, setQ] = useState("");
  const [entity, setEntity] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["activity", current?.id, entity, q],
    enabled: !!current && isAdmin,
    queryFn: async () => {
      let query = supabase.from("activity_logs").select("id, created_at, action, entity, details, actor_id").eq("workspace_id", current!.id).order("created_at", { ascending: false }).limit(500);
      if (entity !== "all") query = query.eq("entity", entity);
      const { data: logs } = await query;
      const ids = [...new Set((logs ?? []).map((l) => l.actor_id).filter(Boolean))] as string[];
      const { data: people } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };
      const names = new Map((people ?? []).map((p) => [p.id, p.full_name ?? "Teammate"]));
      const rows = (logs ?? []).map((l) => ({
        when: l.created_at,
        who: l.actor_id ? names.get(l.actor_id) ?? "Teammate" : "System",
        type: ENTITY[l.entity] ?? l.entity,
        what: describe(l.entity, l.action, (l.details ?? {}) as Record<string, unknown>),
      }));
      const t = q.trim().toLowerCase();
      return t ? rows.filter((r) => `${r.who} ${r.type} ${r.what}`.toLowerCase().includes(t)) : rows;
    },
  });

  if (!isAdmin) {
    return <div className={cardCls}><EmptyState title="Admins only" text="Ask a workspace owner or admin to view the activity log." action={<Lock className="h-5 w-5 text-muted-foreground" />} /></div>;
  }

  return (
    <>
      <PageHeader subtitle="Security & audit" title="Activity log" />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="flex min-w-60 flex-1 items-center gap-2 rounded-xl border border-input bg-card px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input aria-label="Search activity" className="w-full bg-transparent py-2 text-sm outline-none" placeholder="Search by person, change or account…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={`${inputCls} w-auto`} value={entity} onChange={(e) => setEntity(e.target.value)}>
          <option value="all">All changes</option>
          <option value="workspaces">Workspace</option>
          <option value="social_accounts">Social accounts</option>
          <option value="workspace_members">Team</option>
        </select>
      </div>
      <div className={cardCls}>
        {isLoading ? <div className="space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-10" />)}</div> : !data?.length ? (
          <EmptyState title="No activity yet" text="Changes to your workspace, accounts and team will appear here." />
        ) : (
          <DataTable
            rows={data}
            pageSize={15}
            searchPlaceholder="Filter these results…"
            columns={[
              { key: "when", header: "When", value: (r) => r.when, render: (r) => new Date(r.when).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) },
              { key: "who", header: "Who", value: (r) => r.who },
              { key: "type", header: "Area", value: (r) => r.type },
              { key: "what", header: "Change", value: (r) => r.what, sortable: false },
            ]}
          />
        )}
      </div>
    </>
  );
}
