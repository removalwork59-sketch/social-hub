import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Minus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace";
import { PageHeader, btnPrimary, cardCls, inputCls } from "@/components/AppShell";
import { Panel, Table } from "@/components/portal-ui";

export const Route = createFileRoute("/_authenticated/_app/team")({
  head: () => ({ meta: [{ title: "Team — SocialOS" }, { name: "description", content: "Manage team members." }] }),
  component: Team,
});

type Role = "owner" | "admin" | "member";
const roleCls: Record<Role, string> = { owner: "bg-primary/20 text-accent-foreground", admin: "bg-chart-2/20 text-foreground", member: "bg-secondary text-muted-foreground" };
const perms: [string, boolean, boolean, boolean][] = [
  ["Create posts", true, true, true],
  ["Publish without approval", true, true, false],
  ["Reply in inbox", true, true, true],
  ["Connect social accounts", true, true, false],
  ["Manage team", true, true, false],
  ["Billing & settings", true, false, false],
];

function Team() {
  const { current, role, userId } = useWorkspace();
  const canManage = role === "owner" || role === "admin";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "member">("member");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members", current?.id],
    enabled: !!current,
    queryFn: async () => {
      const { data: m } = await supabase.from("workspace_members").select("*").eq("workspace_id", current!.id);
      const ids = (m ?? []).map((x) => x.user_id);
      const { data: p } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      return (m ?? []).map((x) => ({ ...x, name: p?.find((y) => y.id === x.user_id)?.full_name ?? "Team member" }));
    },
  });

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!current) return;
    const { data, error } = await supabase.rpc("add_workspace_member", { _ws: current.id, _email: email.trim(), _role: newRole });
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data === "not_found") {
      toast.error("No SocialOS account with that email yet — ask them to sign up first, then add them.");
      return;
    }
    toast.success("Member added");
    setOpen(false);
    setEmail("");
    qc.invalidateQueries({ queryKey: ["members"] });
  }

  async function changeRole(uid: string, r: Role) {
    const { error } = await supabase.from("workspace_members").update({ role: r }).eq("workspace_id", current!.id).eq("user_id", uid);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["members"] });
  }

  async function remove(uid: string) {
    const { error } = await supabase.from("workspace_members").delete().eq("workspace_id", current!.id).eq("user_id", uid);
    if (error) toast.error(error.message);
    else {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["members"] });
    }
  }

  return (
    <>
      <PageHeader subtitle={current?.name} title="Team" action={canManage && <button className={btnPrimary} onClick={() => setOpen(true)}><UserPlus className="h-4 w-4" /> Add member</button>} />
      <div className="grid gap-4 lg:grid-cols-5">
        <Panel title={`${members.length} members`} className="lg:col-span-3">
          {isLoading ? <div className="skeleton h-32" /> : (
            <ul className="divide-y divide-border">
              {members.map((m) => (
                <li key={m.user_id} className="flex items-center gap-3 py-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground">{m.name[0]?.toUpperCase()}</div>
                  <p className="flex-1 text-sm font-medium">{m.name} {m.user_id === userId && <span className="text-xs text-muted-foreground">(you)</span>}</p>
                  {canManage && m.role !== "owner" && m.user_id !== userId ? (
                    <>
                      <select aria-label="Role" className="rounded-lg border border-input bg-card px-2 py-1 text-xs" value={m.role} onChange={(e) => changeRole(m.user_id, e.target.value as Role)}>
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                      <button onClick={() => remove(m.user_id)} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                    </>
                  ) : (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${roleCls[m.role]}`}>{m.role}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Permissions" className="lg:col-span-2">
          <Table
            head={["", "Owner", "Admin", "Member"]}
            rows={perms.map(([label, ...v]) => [label, ...v.map((on, i) => (on ? <Check key={i} className="h-4 w-4 text-success" /> : <Minus key={i} className="h-4 w-4 text-muted-foreground" />))])}
          />
        </Panel>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 px-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <form onSubmit={invite} className={`${cardCls} w-full max-w-sm animate-rise space-y-3`} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Add team member</h2>
            <p className="text-sm text-muted-foreground">They need a SocialOS account with this email.</p>
            <input required type="email" className={inputCls} placeholder="colleague@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <select className={inputCls} value={newRole} onChange={(e) => setNewRole(e.target.value as "admin" | "member")}>
              <option value="member">Member — creates posts for approval</option>
              <option value="admin">Admin — full access except billing</option>
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button className={btnPrimary}>Add</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
