import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Inbox as InboxIcon, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PLATFORMS, platformLabel, useWorkspace } from "@/lib/workspace";
import { PageHeader, cardCls } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/inbox")({
  head: () => ({ meta: [{ title: "Inbox — SocialOS" }, { name: "description", content: "Comments and messages across clients." }] }),
  component: InboxPage,
});

const kinds = { comment: "Comment", dm: "DM", mention: "Mention", review: "Review" } as const;
const sentimentDot: Record<string, string> = { positive: "bg-success", negative: "bg-destructive", neutral: "bg-warning" };

function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.round(m / 60)}h`;
  return `${Math.round(m / 1440)}d`;
}

const sel = "rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function InboxPage() {
  const { workspaces } = useWorkspace();
  const qc = useQueryClient();
  const [ws, setWs] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [status, setStatus] = useState<"open" | "resolved" | "all">("open");
  const [selected, setSelected] = useState<string | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["inbox"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inbox_messages").select("*").order("received_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const list = useMemo(
    () =>
      data.filter(
        (m) =>
          (ws === "all" || m.workspace_id === ws) &&
          (platform === "all" || m.platform === platform) &&
          (status === "all" || m.status === status),
      ),
    [data, ws, platform, status],
  );
  const active = list.find((m) => m.id === selected) ?? list[0];
  const wsName = (id: string) => workspaces.find((w) => w.id === id)?.name ?? "";
  const openCount = data.filter((m) => m.status === "open").length;

  async function setResolved(id: string, resolved: boolean) {
    const { error } = await supabase
      .from("inbox_messages")
      .update({ status: resolved ? "resolved" : "open", resolved_at: resolved ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(resolved ? "Marked as resolved" : "Reopened");
    qc.invalidateQueries({ queryKey: ["inbox"] });
  }

  return (
    <>
      <PageHeader subtitle={`${openCount} open across ${workspaces.length} workspace${workspaces.length === 1 ? "" : "s"}`} title="Inbox" />

      <div className="mb-4 flex flex-wrap gap-2">
        <select aria-label="Workspace" className={sel} value={ws} onChange={(e) => setWs(e.target.value)}>
          <option value="all">All workspaces</option>
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <select aria-label="Platform" className={sel} value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="all">All platforms</option>
          {PLATFORMS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        <div className="flex rounded-xl border border-input bg-card p-1">
          {(["open", "resolved", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-lg px-3 py-1 text-sm capitalize transition-colors ${status === s ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className={`${cardCls} p-2`}>
          {isLoading ? (
            <div className="space-y-2 p-2">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-16" />)}</div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-accent">
                <InboxIcon className="h-5 w-5 text-accent-foreground" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Nothing here. Inbox zero!</p>
            </div>
          ) : (
            <ul>
              {list.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => setSelected(m.id)}
                    className={`flex w-full gap-3 rounded-xl p-3 text-left transition-colors ${active?.id === m.id ? "bg-accent" : "hover:bg-secondary/60"}`}
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold uppercase">
                      {m.author.slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${sentimentDot[m.sentiment] ?? "bg-muted"}`} />
                        <span className="truncate font-medium">{m.author}</span>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">{ago(m.received_at)}</span>
                      </div>
                      <p className={`truncate text-sm ${m.status === "resolved" ? "text-muted-foreground line-through" : "text-muted-foreground"}`}>
                        {m.content}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {platformLabel(m.platform)} · {kinds[m.kind]} · {wsName(m.workspace_id)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={`${cardCls} h-fit`}>
          {!active ? (
            <p className="py-14 text-center text-sm text-muted-foreground">Select a conversation</p>
          ) : (
            <div className="animate-rise" key={active.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{active.author}</h2>
                  <p className="text-xs text-muted-foreground">
                    {kinds[active.kind]} on {platformLabel(active.platform)} · {wsName(active.workspace_id)} ·{" "}
                    {new Date(active.received_at).toLocaleString()}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${active.status === "resolved" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                  {active.status}
                </span>
              </div>
              <div className="mt-5 rounded-xl bg-secondary p-4 text-sm">{active.content}</div>
              <p className="mt-2 flex items-center gap-1.5 text-xs capitalize text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${sentimentDot[active.sentiment] ?? "bg-muted"}`} /> {active.sentiment} sentiment
                {active.is_sample && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 normal-case">Sample message</span>}
              </p>
              <div className="mt-6 flex gap-2">
                {active.status === "open" ? (
                  <button onClick={() => setResolved(active.id, true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                    <CheckCircle2 className="h-4 w-4" /> Mark resolved
                  </button>
                ) : (
                  <button onClick={() => setResolved(active.id, false)} className="inline-flex items-center gap-2 rounded-xl border border-input px-4 py-2 text-sm font-medium hover:bg-secondary">
                    <RotateCcw className="h-4 w-4" /> Reopen
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
