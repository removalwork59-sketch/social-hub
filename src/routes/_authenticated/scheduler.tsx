import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PLATFORMS, type Platform, platformLabel, useWorkspace } from "@/lib/workspace";
import { PageHeader, btnPrimary, cardCls, inputCls } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/scheduler")({
  head: () => ({ meta: [{ title: "Scheduler — SocialOS" }, { name: "description", content: "Plan and schedule posts." }] }),
  component: Scheduler,
});

const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function Scheduler() {
  const { current } = useWorkspace();
  const qc = useQueryClient();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [content, setContent] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [when, setWhen] = useState(() => toLocalInput(new Date(Date.now() + 3600_000)));
  const [busy, setBusy] = useState(false);

  const { data: posts = [] } = useQuery({
    queryKey: ["posts", current?.id],
    enabled: !!current,
    queryFn: async () =>
      (await supabase.from("posts").select("*").eq("workspace_id", current!.id).order("scheduled_at")).data ?? [],
  });

  const byDay = useMemo(() => {
    const m = new Map<string, typeof posts>();
    posts.forEach((p) => {
      if (!p.scheduled_at) return;
      const k = dayKey(new Date(p.scheduled_at));
      m.set(k, [...(m.get(k) ?? []), p]);
    });
    return m;
  }, [posts]);

  const cells = useMemo(() => {
    const start = new Date(month);
    start.setDate(1 - ((month.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [month]);

  async function schedule(e: React.FormEvent) {
    e.preventDefault();
    if (!current) return;
    if (platforms.length === 0) return toast.error("Pick at least one platform");
    const at = new Date(when);
    if (at.getTime() < Date.now()) return toast.error("Pick a time in the future");
    setBusy(true);
    const { error } = await supabase
      .from("posts")
      .insert({ workspace_id: current.id, content, platforms, scheduled_at: at.toISOString(), status: "scheduled" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Post scheduled");
    setContent("");
    setPlatforms([]);
    qc.invalidateQueries({ queryKey: ["posts"] });
    qc.invalidateQueries({ queryKey: ["overview"] });
  }

  async function remove(id: string) {
    await supabase.from("posts").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["posts"] });
    qc.invalidateQueries({ queryKey: ["overview"] });
  }

  const today = dayKey(new Date());

  return (
    <>
      <PageHeader subtitle={current?.name} title="Scheduler" />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <form onSubmit={schedule} className={`${cardCls} h-fit space-y-4`}>
          <h2 className="font-semibold">New post</h2>
          <textarea
            className={`${inputCls} min-h-32 resize-y`}
            placeholder="What do you want to share?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            maxLength={2200}
          />
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const on = platforms.includes(p.id);
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPlatforms(on ? platforms.filter((x) => x !== p.id) : [...platforms, p.id])}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    on ? "border-primary bg-accent text-accent-foreground" : "border-input text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <input type="datetime-local" className={inputCls} value={when} onChange={(e) => setWhen(e.target.value)} required />
          <button disabled={busy} className={`${btnPrimary} w-full`}>
            Schedule post
          </button>
        </form>

        <div className={cardCls}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">{month.toLocaleString(undefined, { month: "long", year: "numeric" })}</h2>
            <div className="flex gap-1">
              <button aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-lg p-2 hover:bg-secondary">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-lg p-2 hover:bg-secondary">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border bg-border text-xs">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="bg-card p-2 text-center font-medium text-muted-foreground">
                {d}
              </div>
            ))}
            {cells.map((d) => {
              const items = byDay.get(dayKey(d)) ?? [];
              const inMonth = d.getMonth() === month.getMonth();
              return (
                <div key={d.toISOString()} className={`min-h-24 bg-card p-1.5 ${inMonth ? "" : "opacity-40"}`}>
                  <div className={`mb-1 inline-grid h-6 w-6 place-items-center rounded-full ${dayKey(d) === today ? "bg-primary text-primary-foreground" : ""}`}>
                    {d.getDate()}
                  </div>
                  <div className="space-y-1">
                    {items.map((p) => (
                      <div
                        key={p.id}
                        title={`${p.content}\n${p.platforms.map(platformLabel).join(", ")}`}
                        className="group flex items-center gap-1 rounded-md bg-accent px-1.5 py-1 text-accent-foreground"
                      >
                        <span className="shrink-0 font-semibold">
                          {new Date(p.scheduled_at!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="truncate">{p.content}</span>
                        <button onClick={() => remove(p.id)} aria-label="Delete post" className="ml-auto hidden shrink-0 group-hover:block">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
