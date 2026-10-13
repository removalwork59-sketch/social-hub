import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PLATFORMS, type Platform, useWorkspace } from "@/lib/workspace";
import { PageHeader, btnPrimary, cardCls, inputCls } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/accounts")({
  head: () => ({ meta: [{ title: "Social accounts — SocialOS" }, { name: "description", content: "Connect social accounts." }] }),
  component: Accounts,
});

function Accounts() {
  const { current } = useWorkspace();
  const qc = useQueryClient();
  const [connecting, setConnecting] = useState<Platform | null>(null);
  const [handle, setHandle] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["accounts", current?.id],
    enabled: !!current,
    queryFn: async () => (await supabase.from("social_accounts").select("*").eq("workspace_id", current!.id)).data ?? [],
  });

  async function connect() {
    if (!current || !connecting || !handle.trim()) return;
    const { error } = await supabase
      .from("social_accounts")
      .insert({ workspace_id: current.id, platform: connecting, handle: handle.trim().replace(/^@/, ""), status: "test" });
    if (error) return toast.error(error.message);
    toast.success("Account connected");
    setConnecting(null);
    setHandle("");
    qc.invalidateQueries({ queryKey: ["accounts"] });
    qc.invalidateQueries({ queryKey: ["overview"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("social_accounts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["accounts"] });
    qc.invalidateQueries({ queryKey: ["overview"] });
  }

  return (
    <>
      <PageHeader subtitle={current?.name} title="Social accounts" />
      <div className="mb-6 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Test mode:</span> connections are saved but not yet linked to the real
        platforms. Real one-click sign-in for each network will be switched on once the platform apps are approved.
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PLATFORMS.map((p) => {
          const linked = data.filter((a) => a.platform === p.id);
          return (
            <div key={p.id} className={`${cardCls} flex flex-col`}>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{p.label}</h2>
                {linked.length > 0 && <CheckCircle2 className="h-4 w-4 text-success" />}
              </div>
              <ul className="mt-3 flex-1 space-y-1">
                {isLoading ? (
                  <li className="skeleton h-8" />
                ) : linked.length === 0 ? (
                  <li className="text-sm text-muted-foreground">Not connected</li>
                ) : (
                  linked.map((a) => (
                    <li key={a.id} className="flex items-center justify-between rounded-lg px-2 py-1 text-sm hover:bg-secondary/60">
                      @{a.handle}
                      <button onClick={() => remove(a.id)} aria-label="Disconnect" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))
                )}
              </ul>
              <button
                onClick={() => setConnecting(p.id)}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-input py-2 text-sm font-medium transition-colors hover:border-primary hover:bg-accent"
              >
                <Link2 className="h-4 w-4" /> Connect
              </button>
            </div>
          );
        })}
      </div>

      {connecting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 px-4 backdrop-blur-sm" onClick={() => setConnecting(null)}>
          <div className={`${cardCls} w-full max-w-sm animate-rise`} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Connect {PLATFORMS.find((p) => p.id === connecting)?.label}</h2>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">No password needed — just the account handle for now.</p>
            <input autoFocus className={inputCls} placeholder="@brandname" value={handle} onChange={(e) => setHandle(e.target.value)} />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setConnecting(null)} className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
                Cancel
              </button>
              <button onClick={connect} className={btnPrimary}>
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
