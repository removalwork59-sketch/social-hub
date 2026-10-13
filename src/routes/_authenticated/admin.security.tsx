import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, btnPrimary, inputCls } from "@/components/AppShell";
import { Panel, SampleNote } from "@/components/portal-ui";

export const Route = createFileRoute("/_authenticated/admin/security")({
  head: () => ({ meta: [{ title: "Security — SocialOS Admin" }, { name: "description", content: "2FA and IP access settings." }] }),
  component: Security,
});

function Security() {
  const [twofa, setTwofa] = useState(true);
  const [ips, setIps] = useState(["103.21.244.0/22"]);
  const [ip, setIp] = useState("");
  return (
    <>
      <PageHeader subtitle="Platform" title="Security settings" />
      <SampleNote>Preview — these settings aren't enforced yet.</SampleNote>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Two-factor authentication" subtitle="Require 2FA for all admins and partners">
          <label className="flex items-center justify-between text-sm">Enforce 2FA<input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={twofa} onChange={(e) => { setTwofa(e.target.checked); toast.success(e.target.checked ? "2FA required" : "2FA optional"); }} /></label>
        </Panel>
        <Panel title="IP allow-list" subtitle="Only these ranges can open the admin portal">
          <ul className="mb-3 space-y-1.5 text-sm">{ips.map((x) => <li key={x} className="flex justify-between rounded-lg bg-secondary/60 px-3 py-1.5">{x}<button onClick={() => setIps(ips.filter((y) => y !== x))} className="text-xs text-destructive">Remove</button></li>)}</ul>
          <div className="flex gap-2"><input className={inputCls} placeholder="e.g. 49.36.0.0/16" value={ip} onChange={(e) => setIp(e.target.value)} /><button className={btnPrimary} onClick={() => { if (ip.trim()) { setIps([...ips, ip.trim()]); setIp(""); } }}>Add</button></div>
        </Panel>
      </div>
    </>
  );
}
