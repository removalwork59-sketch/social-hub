import { useEffect, useState } from "react";
import { Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { btnPrimary, inputCls } from "@/components/AppShell";
import { Panel, btnOutline } from "@/components/portal-ui";

/** Profile, password, notification and API-key settings shared by every role. */
export function AccountSettings() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [notify, setNotify] = useState({ crisis: true, weekly: true, payouts: true });
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setEmail(data.user.email ?? "");
      const { data: p } = await supabase.from("profiles").select("full_name").eq("id", data.user.id).maybeSingle();
      setName(p?.full_name ?? "");
    });
  }, []);

  async function saveProfile() {
    const { data } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").update({ full_name: name }).eq("id", data.user!.id);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: next, current_password: current } as never);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated");
      setCurrent("");
      setNext("");
    }
  }

  function genKey() {
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    setApiKey("sos_" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(""));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Profile">
        <div className="space-y-3 text-sm">
          <label className="block">Full name<input className={`${inputCls} mt-1`} value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="block">Email<input className={`${inputCls} mt-1 opacity-60`} value={email} disabled /></label>
          <button className={btnPrimary} onClick={saveProfile}>Save profile</button>
        </div>
      </Panel>
      <Panel title="Password">
        <form onSubmit={changePassword} className="space-y-3 text-sm">
          <input required type="password" className={inputCls} placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          <input required minLength={6} type="password" className={inputCls} placeholder="New password" value={next} onChange={(e) => setNext(e.target.value)} />
          <button className={btnPrimary}>Update password</button>
        </form>
      </Panel>
      <Panel title="Notifications">
        <ul className="space-y-3 text-sm">
          {([["crisis", "Crisis alerts"], ["weekly", "Weekly reports"], ["payouts", "Payout updates"]] as const).map(([k, label]) => (
            <li key={k} className="flex items-center justify-between">
              {label}
              <button
                role="switch"
                aria-checked={notify[k]}
                aria-label={label}
                onClick={() => setNotify({ ...notify, [k]: !notify[k] })}
                className={`relative h-5 w-9 rounded-full transition-colors ${notify[k] ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-foreground transition-all ${notify[k] ? "left-[18px]" : "left-0.5"}`} />
              </button>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="API keys" subtitle="Preview — keys are not active until the public API launches">
        {apiKey ? (
          <div className="flex items-center gap-2 rounded-xl bg-secondary p-3 font-mono text-xs">
            <span className="truncate">{apiKey}</span>
            <button aria-label="Copy" className="ml-auto" onClick={() => { navigator.clipboard.writeText(apiKey); toast.success("Copied"); }}>
              <Copy className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No keys yet.</p>
        )}
        <button className={`${btnOutline} mt-3`} onClick={genKey}><KeyRound className="h-4 w-4" /> Generate key</button>
      </Panel>
    </div>
  );
}
