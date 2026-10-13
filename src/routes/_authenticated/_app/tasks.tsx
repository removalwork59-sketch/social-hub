import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, ClipboardList, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace";
import { PageHeader, btnPrimary, cardCls, inputCls } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/_app/tasks")({
  head: () => ({ meta: [{ title: "Tasks — SocialOS" }, { name: "description", content: "Assigned tasks." }] }),
  component: Tasks,
});

function Tasks() {
  const { current, role, userId } = useWorkspace();
  const canAssign = role === "owner" || role === "admin";
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"todo" | "done" | "all">("todo");
  const [form, setForm] = useState({ title: "", due: "", assignee: "" });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", current?.id],
    enabled: !!current,
    queryFn: async () => (await supabase.from("tasks").select("*").eq("workspace_id", current!.id).order("due_date", { nullsFirst: false })).data ?? [],
  });
  const { data: members = [] } = useQuery({
    queryKey: ["members", current?.id],
    enabled: !!current && canAssign,
    queryFn: async () => {
      const { data: m } = await supabase.from("workspace_members").select("*").eq("workspace_id", current!.id);
      const { data: p } = await supabase.from("profiles").select("id, full_name").in("id", (m ?? []).map((x) => x.user_id));
      return (m ?? []).map((x) => ({ ...x, name: p?.find((y) => y.id === x.user_id)?.full_name ?? "Team member" }));
    },
  });

  const mine = canAssign ? tasks : tasks.filter((t) => t.assigned_to === userId);
  const list = mine.filter((t) => filter === "all" || t.status === filter);
  const refresh = () => qc.invalidateQueries({ queryKey: ["tasks"] });

  async function toggle(id: string, done: boolean) {
    const { error } = await supabase.from("tasks").update({ status: done ? "todo" : "done" }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      if (!done) toast.success("Task completed");
      refresh();
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!current) return;
    const { error } = await supabase.from("tasks").insert({ workspace_id: current.id, title: form.title, due_date: form.due || null, assigned_to: form.assignee || null });
    if (error) {
      toast.error(error.message);
      return;
    }
    setForm({ title: "", due: "", assignee: "" });
    toast.success("Task created");
    refresh();
  }

  const overdue = (d: string | null) => d && new Date(d) < new Date(new Date().toDateString());

  return (
    <>
      <PageHeader subtitle={canAssign ? "Assign work to your team" : "Work assigned to you"} title="Tasks" />
      {canAssign && (
        <form onSubmit={create} className={`${cardCls} mb-4 flex flex-col gap-2 md:flex-row`}>
          <input required className={inputCls} placeholder="New task, e.g. Reply to all reviews" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input type="date" aria-label="Deadline" className={`${inputCls} md:w-44`} value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} />
          <select aria-label="Assignee" className={`${inputCls} md:w-48`} value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })}>
            <option value="">Unassigned</option>
            {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.name}</option>)}
          </select>
          <button className={btnPrimary}><Plus className="h-4 w-4" /> Add</button>
        </form>
      )}
      <div className="mb-3 flex w-fit rounded-xl border border-input bg-card p-1">
        {(["todo", "done", "all"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-lg px-3 py-1 text-sm ${filter === s ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>{s === "todo" ? "To do" : s === "done" ? "Done" : "All"}</button>
        ))}
      </div>
      <div className={`${cardCls} p-2`}>
        {isLoading ? <div className="skeleton m-2 h-24" /> : list.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-accent"><ClipboardList className="h-5 w-5 text-accent-foreground" /></div>
            <p className="mt-3 text-sm text-muted-foreground">No tasks here.</p>
          </div>
        ) : (
          <ul>
            {list.map((t) => {
              const done = t.status === "done";
              return (
                <li key={t.id} className="flex items-center gap-3 rounded-xl p-3 hover:bg-secondary/40">
                  <button onClick={() => toggle(t.id, done)} aria-label={done ? "Mark not done" : "Mark complete"}>
                    {done ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />}
                  </button>
                  <span className={`flex-1 text-sm ${done ? "text-muted-foreground line-through" : ""}`}>{t.title}</span>
                  {t.due_date && <span className={`text-xs ${!done && overdue(t.due_date) ? "text-destructive" : "text-muted-foreground"}`}>Due {new Date(t.due_date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>}
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${done ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>{done ? "Done" : "To do"}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
