import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight, List, Plus, Rows3 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { PLATFORMS, type Platform, platformLabel, useWorkspace } from "@/lib/workspace";
import { PageHeader, btnPrimary, cardCls, inputCls } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/_app/scheduler")({
  head: () => ({ meta: [{ title: "Calendar — SocialOS" }, { name: "description", content: "Plan and schedule posts." }] }),
  component: Calendar,
});

type Post = Database["public"]["Tables"]["posts"]["Row"];
type Status = Database["public"]["Enums"]["post_status"];

export const platformColor: Record<Platform, string> = {
  facebook: "var(--chart-2)",
  instagram: "var(--chart-4)",
  linkedin: "var(--chart-3)",
  twitter: "var(--chart-1)",
  google_business: "var(--chart-5)",
};
const statusLabel: Record<Status, string> = { draft: "Draft", scheduled: "Scheduled", published: "Published", failed: "Failed", pending_approval: "Needs approval" };

const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const startOfWeek = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
const sel = "rounded-xl border border-input bg-card px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring";

function Calendar() {
  const { current, role } = useWorkspace();
  const readOnly = role === "member";
  const qc = useQueryClient();
  const [view, setView] = useState<"month" | "week" | "list">("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [platform, setPlatform] = useState<"all" | Platform>("all");
  const [status, setStatus] = useState<"all" | Status>("all");
  const [editing, setEditing] = useState<{ post: Post; content: string; when: string } | null>(null);
  const [creating, setCreating] = useState<string | null>(null);
  const [draft, setDraft] = useState({ content: "", platforms: [] as Platform[] });
  const [dragId, setDragId] = useState<string | null>(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts", current?.id],
    enabled: !!current,
    queryFn: async () => (await supabase.from("posts").select("*").eq("workspace_id", current!.id).order("scheduled_at")).data ?? [],
  });

  const filtered = useMemo(
    () => posts.filter((p) => p.scheduled_at && (platform === "all" || p.platforms.includes(platform)) && (status === "all" || p.status === status)),
    [posts, platform, status],
  );
  const byDay = useMemo(() => {
    const m = new Map<string, Post[]>();
    filtered.forEach((p) => {
      const k = dayKey(new Date(p.scheduled_at!));
      m.set(k, [...(m.get(k) ?? []), p]);
    });
    return m;
  }, [filtered]);

  const cells = useMemo(() => {
    if (view === "week") {
      const s = startOfWeek(anchor);
      return Array.from({ length: 7 }, (_, i) => new Date(s.getFullYear(), s.getMonth(), s.getDate() + i));
    }
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const s = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => new Date(s.getFullYear(), s.getMonth(), s.getDate() + i));
  }, [anchor, view]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["posts"] });
    qc.invalidateQueries({ queryKey: ["overview"] });
  };

  function shift(dir: number) {
    setAnchor(view === "week" ? new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + dir * 7) : new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1));
  }

  async function moveTo(postId: string, day: Date) {
    const p = posts.find((x) => x.id === postId);
    if (!p?.scheduled_at) return;
    const old = new Date(p.scheduled_at);
    const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), old.getHours(), old.getMinutes());
    if (at.getTime() < Date.now()) {
      toast.error("Can't move a post into the past");
      return;
    }
    const { error } = await supabase.from("posts").update({ scheduled_at: at.toISOString() }).eq("id", postId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Moved to ${at.toLocaleDateString()}`);
    refresh();
  }

  async function saveEdit(patch?: Partial<Post>) {
    if (!editing) return;
    const at = new Date(editing.when);
    if (isNaN(at.getTime())) {
      toast.error("Pick a valid time");
      return;
    }
    const { error } = await supabase.from("posts").update({ scheduled_at: at.toISOString(), content: editing.content, ...patch }).eq("id", editing.post.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(patch?.status === "scheduled" ? "Approved and scheduled" : "Post updated");
    setEditing(null);
    refresh();
  }

  async function remove(id: string) {
    await supabase.from("posts").delete().eq("id", id);
    setEditing(null);
    refresh();
  }

  async function createOn() {
    if (!current || !creating) return;
    if (!draft.content.trim() || !draft.platforms.length) {
      toast.error("Add text and at least one platform");
      return;
    }
    const at = new Date(creating);
    if (at.getTime() < Date.now()) {
      toast.error("Pick a future time");
      return;
    }
    const { error } = await supabase.from("posts").insert({ workspace_id: current.id, content: draft.content, platforms: draft.platforms, scheduled_at: at.toISOString() });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Post scheduled");
    setCreating(null);
    setDraft({ content: "", platforms: [] });
    refresh();
  }

  function openDay(d: Date) {
    if (readOnly) return;
    const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10, 0);
    if (at.getTime() < Date.now()) at.setTime(Date.now() + 3600_000);
    setCreating(toLocalInput(at));
  }

  const today = dayKey(new Date());
  const title =
    view === "week"
      ? `Week of ${startOfWeek(anchor).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`
      : anchor.toLocaleString(undefined, { month: "long", year: "numeric" });

  const Chip = ({ p }: { p: Post }) => (
    <div
      draggable={!readOnly}
      onDragStart={() => setDragId(p.id)}
      onClick={(e) => {
        e.stopPropagation();
        setEditing({ post: p, content: p.content, when: toLocalInput(new Date(p.scheduled_at!)) });
      }}
      title={p.content}
      className="flex cursor-pointer items-center gap-1 rounded-md border-l-2 bg-secondary px-1.5 py-1 text-[11px] transition-colors hover:bg-muted"
      style={{ borderColor: platformColor[p.platforms[0] ?? "twitter"] }}
    >
      <span className="shrink-0 font-semibold">{new Date(p.scheduled_at!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      <span className="truncate">{p.content}</span>
      {p.status === "pending_approval" && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />}
    </div>
  );

  return (
    <>
      <PageHeader
        subtitle={readOnly ? "View only — click a post to request a change" : current?.name}
        title="Content calendar"
        action={!readOnly && <Link to="/composer" className={btnPrimary}><Plus className="h-4 w-4" /> New post</Link>}
      />

      <div className={cardCls}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {view !== "list" && (
            <div className="flex items-center gap-1">
              <button aria-label="Previous" onClick={() => shift(-1)} className="rounded-lg p-2 hover:bg-secondary"><ChevronLeft className="h-4 w-4" /></button>
              <h2 className="min-w-40 text-center font-semibold">{title}</h2>
              <button aria-label="Next" onClick={() => shift(1)} className="rounded-lg p-2 hover:bg-secondary"><ChevronRight className="h-4 w-4" /></button>
              <button onClick={() => setAnchor(new Date())} className="ml-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-foreground">Today</button>
            </div>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select aria-label="Platform" className={sel} value={platform} onChange={(e) => setPlatform(e.target.value as Platform | "all")}>
              <option value="all">All platforms</option>
              {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <select aria-label="Status" className={sel} value={status} onChange={(e) => setStatus(e.target.value as Status | "all")}>
              <option value="all">All statuses</option>
              {(Object.keys(statusLabel) as Status[]).map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
            </select>
            <div className="flex rounded-xl border border-input p-0.5">
              {([["month", CalendarDays], ["week", Rows3], ["list", List]] as const).map(([v, I]) => (
                <button key={v} aria-label={`${v} view`} onClick={() => setView(v)} className={`rounded-lg p-1.5 ${view === v ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}><I className="h-4 w-4" /></button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {PLATFORMS.map((p) => (
            <span key={p.id} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: platformColor[p.id] }} />{p.label}</span>
          ))}
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" />Needs approval</span>
        </div>

        {isLoading ? (
          <div className="skeleton h-96" />
        ) : view === "list" ? (
          <ul className="divide-y divide-border">
            {filtered.length === 0 && <li className="py-10 text-center text-sm text-muted-foreground">No posts match these filters.</li>}
            {filtered.map((p) => (
              <li key={p.id} onClick={() => setEditing({ post: p, content: p.content, when: toLocalInput(new Date(p.scheduled_at!)) })} className="flex cursor-pointer items-center gap-4 px-2 py-3 hover:bg-secondary/40">
                <div className="w-28 shrink-0 text-xs text-muted-foreground">{new Date(p.scheduled_at!).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                <p className="min-w-0 flex-1 truncate text-sm">{p.content}</p>
                <div className="flex gap-1">{p.platforms.map((x) => <span key={x} className="h-2.5 w-2.5 rounded-full" style={{ background: platformColor[x] }} title={platformLabel(x)} />)}</div>
                <span className="w-28 text-right text-xs text-muted-foreground">{statusLabel[p.status]}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border bg-border text-xs">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="bg-card p-2 text-center font-medium text-muted-foreground">{d}</div>)}
            {cells.map((d) => {
              const items = byDay.get(dayKey(d)) ?? [];
              const dim = view === "month" && d.getMonth() !== anchor.getMonth();
              return (
                <div
                  key={d.toISOString()}
                  onClick={() => openDay(d)}
                  onDragOver={(e) => !readOnly && e.preventDefault()}
                  onDrop={() => { if (dragId) moveTo(dragId, d); setDragId(null); }}
                  className={`${view === "week" ? "min-h-72" : "min-h-24"} bg-card p-1.5 transition-colors ${readOnly ? "" : "cursor-pointer hover:bg-secondary/40"} ${dim ? "opacity-40" : ""}`}
                >
                  <div className={`mb-1 inline-grid h-6 w-6 place-items-center rounded-full ${dayKey(d) === today ? "bg-primary text-primary-foreground" : ""}`}>{d.getDate()}</div>
                  <div className="space-y-1">{items.map((p) => <Chip key={p.id} p={p} />)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{readOnly ? "Post details" : "Edit post"}</h2>
            <span className="text-xs text-muted-foreground">{statusLabel[editing.post.status]} · {editing.post.platforms.map(platformLabel).join(", ")}</span>
          </div>
          <textarea disabled={readOnly} className={`${inputCls} min-h-28`} value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} />
          <label className="block text-sm text-muted-foreground">
            Publishing time
            <input disabled={readOnly} type="datetime-local" className={`${inputCls} mt-1`} value={editing.when} onChange={(e) => setEditing({ ...editing, when: e.target.value })} />
          </label>
          <div className="flex flex-wrap justify-end gap-2">
            {readOnly ? (
              <button className={btnPrimary} onClick={() => { toast.success("Change request sent to your manager"); setEditing(null); }}>Request change</button>
            ) : (
              <>
                <button onClick={() => remove(editing.post.id)} className="mr-auto rounded-xl px-3 py-2 text-sm text-destructive hover:bg-destructive/10">Delete</button>
                <button onClick={() => setEditing(null)} className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                {editing.post.status === "pending_approval" && (
                  <button onClick={() => saveEdit({ status: "scheduled" })} className="rounded-xl border border-primary px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent">Approve</button>
                )}
                <button onClick={() => saveEdit()} className={btnPrimary}>Save</button>
              </>
            )}
          </div>
        </Modal>
      )}

      {creating && (
        <Modal onClose={() => setCreating(null)}>
          <h2 className="text-lg font-semibold">New post</h2>
          <textarea className={`${inputCls} min-h-28`} placeholder="What do you want to share?" value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} />
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const on = draft.platforms.includes(p.id);
              return (
                <button key={p.id} type="button" onClick={() => setDraft({ ...draft, platforms: on ? draft.platforms.filter((x) => x !== p.id) : [...draft.platforms, p.id] })} className={`rounded-full border px-3 py-1 text-xs ${on ? "border-primary bg-accent text-accent-foreground" : "border-input text-muted-foreground"}`}>
                  {p.label}
                </button>
              );
            })}
          </div>
          <input type="datetime-local" className={inputCls} value={creating} onChange={(e) => setCreating(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button onClick={() => setCreating(null)} className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={createOn} className={btnPrimary}>Schedule</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 px-4 backdrop-blur-sm" onClick={onClose}>
      <div className={`${cardCls} w-full max-w-md animate-rise space-y-4`} onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}
