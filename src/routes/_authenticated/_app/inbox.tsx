import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Archive, ArrowUpRight, CheckCircle2, Inbox as InboxIcon, MailOpen, RefreshCw, Lock, RotateCcw, Search, Send, Sparkles, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { analyzeMessage, draftReply } from "@/lib/ai.functions";
import { PLATFORMS, platformLabel, useWorkspace } from "@/lib/workspace";
import { PageHeader, btnPrimary, cardCls, inputCls } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/_app/inbox")({
  head: () => ({ meta: [{ title: "Inbox — SocialOS" }, { name: "description", content: "Comments and messages across clients." }] }),
  component: InboxPage,
});

const tabs = [
  { id: "all", label: "All" },
  { id: "comment", label: "Comments" },
  { id: "dm", label: "DMs" },
  { id: "mention", label: "Mentions" },
  { id: "review", label: "Reviews" },
] as const;
const kinds = { comment: "Comment", dm: "DM", mention: "Mention", review: "Review" } as const;
const dot: Record<string, string> = { positive: "bg-success", negative: "bg-destructive", neutral: "bg-warning" };
const sel = "rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function ago(iso: string) {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.round(m / 60)}h`;
  return `${Math.round(m / 1440)}d`;
}

/** Row that archives when swiped left on touch screens. */
function SwipeRow({ onArchive, children, className }: { onArchive: () => void; children: React.ReactNode; className: string }) {
  const [dx, setDx] = useState(0);
  const [start, setStart] = useState<number | null>(null);
  return (
    <li className="relative overflow-hidden rounded-xl">
      <div className="absolute inset-0 flex items-center justify-end rounded-xl bg-destructive/80 pr-5 text-destructive-foreground"><Archive className="h-5 w-5" /></div>
      <div
        onTouchStart={(e) => setStart(e.touches[0]!.clientX)}
        onTouchMove={(e) => start !== null && setDx(Math.min(0, e.touches[0]!.clientX - start))}
        onTouchEnd={() => { if (dx < -110) onArchive(); setDx(0); setStart(null); }}
        style={{ transform: `translateX(${dx}px)`, transition: start === null ? "transform .2s" : "none" }}
        className={`relative bg-card ${className}`}
      >
        {children}
      </div>
    </li>
  );
}

function InboxPage() {
  const { workspaces, role, userId, current } = useWorkspace();
  const isMember = role === "member";
  const isFree = current?.plan === "free";
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const ai = useServerFn(draftReply);
  const analyzeFn = useServerFn(analyzeMessage);
  const [check, setCheck] = useState<{ id: string; sentiment: string; confidence: number; action: string; reason: string } | null>(null);
  async function runCheck() {
    if (!active) return;
    try {
      const r = await analyzeFn({ data: { workspaceId: active.workspace_id, text: active.content, messageId: active.id } });
      setCheck({ id: active.id, ...r });
      qc.invalidateQueries({ queryKey: ["inbox"] });
      toast(r.action === "allow" ? "Looks fine" : `Flagged — ${r.action === "hide" ? "hidden" : "removed"} from inbox`, { description: r.reason });
    } catch (e) { toast.error((e as Error).message); }
  }
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("all");
  const [ws, setWs] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [status, setStatus] = useState<"open" | "resolved" | "all">("open");
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const [reply, setReply] = useState("");
  const [drafting, setDrafting] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ["inbox"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inbox_messages").select("*").eq("archived", false).order("received_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const wsName = (id: string) => workspaces.find((w) => w.id === id)?.name ?? "";
  const { data: people = [] } = useQuery({
    queryKey: ["inbox-people", workspaces.map((w) => w.id).join(",")],
    enabled: workspaces.length > 0,
    queryFn: async () => {
      const { data: m } = await supabase.from("workspace_members").select("workspace_id, user_id").in("workspace_id", workspaces.map((w) => w.id));
      const ids = [...new Set((m ?? []).map((x) => x.user_id))];
      const { data: p } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      return (m ?? []).map((x) => ({ ...x, name: p?.find((y) => y.id === x.user_id)?.full_name ?? "Teammate" }));
    },
  });
  const personName = (id: string | null) => (id ? (id === userId ? "You" : people.find((p) => p.user_id === id)?.name ?? "Teammate") : null);
  const freePlatform = isFree ? data.find((m) => m.workspace_id === current?.id)?.platform : undefined;
  const q = search.trim().toLowerCase();

  const list = useMemo(
    () =>
      data.filter(
        (m) =>
          (!isMember || m.assigned_to === userId) &&
          (!isFree || (m.workspace_id === current?.id && m.platform === freePlatform)) &&
          (!q || m.content.toLowerCase().includes(q) || m.author.toLowerCase().includes(q) || wsName(m.workspace_id).toLowerCase().includes(q)) &&
          (tab === "all" || m.kind === tab) &&
          (ws === "all" || m.workspace_id === ws) &&
          (platform === "all" || m.platform === platform) &&
          (status === "all" || m.status === status),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, tab, ws, platform, status, isMember, userId, isFree, freePlatform, q, workspaces],
  );
  const active = list.find((m) => m.id === selected) ?? list[0];
  const refresh = () => qc.invalidateQueries({ queryKey: ["inbox"] });

  async function patch(ids: string[], values: { status?: "open" | "resolved"; is_read?: boolean; archived?: boolean; assigned_to?: string | null; resolved_at?: string | null }, msg: string) {
    if (!ids.length) return;
    const { error } = await supabase.from("inbox_messages").update(values).in("id", ids);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(msg);
    setChecked([]);
    refresh();
  }

  async function genReply() {
    if (!active) return;
    setDrafting(true);
    try {
      const r = await ai({ data: { workspaceId: active.workspace_id, message: active.content, author: active.author, sentiment: active.sentiment, platform: platformLabel(active.platform) } });
      setReply(r.reply);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI failed");
    }
    setDrafting(false);
  }

  function select(id: string) {
    setSelected(id);
    setReply("");
    const m = data.find((x) => x.id === id);
    if (m && !m.is_read) supabase.from("inbox_messages").update({ is_read: true }).eq("id", id).then(refresh);
  }

  const counts = (k: string) => data.filter((m) => m.status === "open" && (k === "all" || m.kind === k) && (!isMember || m.assigned_to === userId)).length;

  return (
    <>
      <p className="-mt-1 mb-3 text-xs text-muted-foreground sm:hidden">Tip: swipe a message left to archive it.</p>
      <PageHeader subtitle={isMember ? "Conversations assigned to you" : `Across ${workspaces.length} workspace${workspaces.length === 1 ? "" : "s"}`} title="Inbox" />

      <div className="mb-3 flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${tab === t.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
            {t.label}
            <span className="rounded-full bg-secondary px-1.5 text-[11px]">{counts(t.id)}</span>
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="flex min-w-56 flex-1 items-center gap-2 rounded-xl border border-input bg-card px-3 sm:max-w-xs">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input aria-label="Search conversations" placeholder="Search text, sender or workspace…" className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {!isMember && !isFree && (
          <select aria-label="Workspace" className={sel} value={ws} onChange={(e) => setWs(e.target.value)}>
            <option value="all">All workspaces</option>
            {workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        )}
        <select aria-label="Platform" className={sel} value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="all">All platforms</option>
          {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <select aria-label="Status" className={sel} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="all">All</option>
        </select>
        {checked.length > 0 && (
          <div className="ml-auto flex animate-rise items-center gap-1 rounded-xl border border-primary/40 bg-accent/60 px-2 py-1 text-sm">
            <span className="px-1">{checked.length} selected</span>
            <button onClick={() => patch(checked, { is_read: true }, "Marked as read")} className="rounded-lg p-1.5 hover:bg-secondary" title="Mark read" aria-label="Mark read"><MailOpen className="h-4 w-4" /></button>
            {!isMember && <button onClick={() => patch(checked, { assigned_to: userId }, "Assigned to you")} className="rounded-lg p-1.5 hover:bg-secondary" title="Assign to me" aria-label="Assign to me"><UserPlus className="h-4 w-4" /></button>}
            <button onClick={() => patch(checked, { status: "resolved", resolved_at: new Date().toISOString() }, "Resolved")} className="rounded-lg p-1.5 hover:bg-secondary" title="Resolve" aria-label="Resolve"><CheckCircle2 className="h-4 w-4" /></button>
            <button onClick={() => patch(checked, { archived: true }, "Archived")} className="rounded-lg p-1.5 hover:bg-secondary" title="Archive" aria-label="Archive"><Archive className="h-4 w-4" /></button>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className={`${cardCls} p-2`}>
          {isLoading ? (
            <div className="space-y-2 p-2">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-16" />)}</div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-accent"><InboxIcon className="h-5 w-5 text-accent-foreground" /></div>
              <p className="mt-3 text-sm text-muted-foreground">{isMember ? "Nothing assigned to you right now." : "Nothing here. Inbox zero!"}</p>
            </div>
          ) : (
            <ul>
              {list.map((m) => (
                <SwipeRow key={m.id} onArchive={() => patch([m.id], { archived: true }, "Archived")} className={`flex items-start gap-2 rounded-xl p-2 transition-colors ${active?.id === m.id ? "!bg-accent" : "hover:bg-secondary/60"}`}>
                  <input type="checkbox" aria-label="Select" className="mt-3 accent-[var(--primary)]" checked={checked.includes(m.id)} onChange={() => setChecked(checked.includes(m.id) ? checked.filter((x) => x !== m.id) : [...checked, m.id])} />
                  <button onClick={() => select(m.id)} className="flex min-w-0 flex-1 gap-3 p-1 text-left">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold uppercase">{m.author.slice(0, 2)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${dot[m.sentiment] ?? "bg-muted"}`} />
                        <span className={`truncate ${m.is_read ? "" : "font-semibold"}`}>{m.author}</span>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">{ago(m.received_at)}</span>
                      </div>
                      <p className={`truncate text-sm text-muted-foreground ${m.status === "resolved" ? "line-through" : ""}`}>{m.content}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{platformLabel(m.platform)} · {kinds[m.kind]} · {wsName(m.workspace_id)}{personName(m.assigned_to) && <span className="text-accent-foreground"> · {personName(m.assigned_to)}</span>}</p>
                    </div>
                  </button>
                </SwipeRow>
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
                  <p className="text-xs text-muted-foreground">{kinds[active.kind]} on {platformLabel(active.platform)} · {wsName(active.workspace_id)} · {new Date(active.received_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                {!isMember ? (
                  <select
                    aria-label="Assign to"
                    className="rounded-lg border border-input bg-card px-2 py-1 text-xs"
                    value={active.assigned_to ?? ""}
                    onChange={(e) => patch([active.id], { assigned_to: e.target.value || null }, e.target.value ? `Assigned to ${personName(e.target.value)}` : "Unassigned")}
                  >
                    <option value="">Unassigned</option>
                    {people.filter((p) => p.workspace_id === active.workspace_id).map((p) => <option key={p.user_id} value={p.user_id}>{p.user_id === userId ? "You" : p.name}</option>)}
                  </select>
                ) : null}
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${active.status === "resolved" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>{active.status}</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Responsible: <span className="font-medium text-foreground">{personName(active.assigned_to) ?? "Nobody yet"}</span></p>
              <div className="mt-5 max-w-[85%] rounded-xl rounded-tl-sm bg-secondary p-4 text-sm">{active.content}</div>
              <p className="mt-2 flex items-center gap-1.5 text-xs capitalize text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${dot[active.sentiment] ?? "bg-muted"}`} /> {active.sentiment}
                {active.is_sample && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 normal-case">Sample message</span>}
              </p>

              {isFree ? (
                <div className="mt-6 space-y-2">
                  <textarea className={`${inputCls} min-h-20`} placeholder="Write your reply…" value={reply} onChange={(e) => setReply(e.target.value)} />
                  <p className="flex items-center gap-2 rounded-xl border border-dashed border-primary/40 p-3 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4 text-primary" /> AI reply drafts are a Pro feature.
                    <Link to="/upgrade" className="ml-auto font-semibold text-accent-foreground hover:underline">Upgrade</Link>
                  </p>
                </div>
              ) : (
              <div className="mt-6 rounded-xl border border-primary/30 bg-accent/40 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-sm font-medium"><Sparkles className="h-4 w-4 text-primary" /> AI reply draft</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <button onClick={runCheck} className="rounded-lg border border-input px-2.5 py-1 font-medium hover:border-primary">Check tone & spam</button>
                    {check?.id === active.id && <span className="text-muted-foreground">{check.sentiment} ({Math.round(check.confidence * 100)}%) · {check.action} — {check.reason}</span>}
                  </div>
                  <button onClick={genReply} disabled={drafting} className="flex items-center gap-1 text-xs font-semibold text-accent-foreground hover:underline disabled:opacity-50">
                    <RefreshCw className={`h-3 w-3 ${drafting ? "animate-spin" : ""}`} /> {reply ? "Regenerate" : "Draft with AI"}
                  </button>
                </div>
                {drafting && !reply ? <div className="skeleton h-20" /> : (
                  <textarea className={`${inputCls} min-h-20`} placeholder="Write a reply or let AI draft one…" value={reply} onChange={(e) => setReply(e.target.value)} />
                )}
              </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  disabled={!reply.trim()}
                  onClick={() => { patch([active.id], { status: "resolved", resolved_at: new Date().toISOString() }, "Reply saved and conversation resolved"); setReply(""); }}
                  className={btnPrimary}
                >
                  <Send className="h-4 w-4" /> Send reply
                </button>
                {active.status === "open" ? (
                  <button onClick={() => patch([active.id], { status: "resolved", resolved_at: new Date().toISOString() }, "Marked as resolved")} className="inline-flex items-center gap-2 rounded-xl border border-input px-4 py-2 text-sm font-medium hover:bg-secondary">
                    <CheckCircle2 className="h-4 w-4" /> Mark resolved
                  </button>
                ) : (
                  <button onClick={() => patch([active.id], { status: "open", resolved_at: null }, "Reopened")} className="inline-flex items-center gap-2 rounded-xl border border-input px-4 py-2 text-sm font-medium hover:bg-secondary">
                    <RotateCcw className="h-4 w-4" /> Reopen
                  </button>
                )}
                {isMember && (
                  <button onClick={() => patch([active.id], { assigned_to: null }, "Escalated to your admin")} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowUpRight className="h-4 w-4" /> Escalate to admin
                  </button>
                )}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Replies are saved here; they'll post to the platform once real account connections are switched on.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
