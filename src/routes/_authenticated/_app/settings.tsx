import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/account.functions";
import { PageHeader, inputCls } from "@/components/AppShell";
import { AccountSettings } from "@/components/AccountSettings";
import { Panel, btnOutline } from "@/components/portal-ui";

export const Route = createFileRoute("/_authenticated/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — SocialOS" }, { name: "description", content: "Account settings." }] }),
  component: Settings,
});

function Settings() {
  const del = useServerFn(deleteMyAccount);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState("");

  async function destroy() {
    try {
      await del();
      qc.clear();
      await supabase.auth.signOut();
      toast.success("Your account was deleted");
      navigate({ to: "/", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete account");
    }
  }

  return (
    <>
      <PageHeader subtitle="Your account" title="Settings" />
      <AccountSettings />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Connected accounts">
          <p className="mb-3 text-sm text-muted-foreground">Manage the social profiles this workspace posts to.</p>
          <Link to="/accounts" className={btnOutline}><Link2 className="h-4 w-4" /> Manage social accounts</Link>
        </Panel>
        <Panel title="Delete account">
          <p className="mb-3 text-sm text-muted-foreground">This permanently deletes your login. Type <span className="font-semibold text-foreground">DELETE</span> to confirm.</p>
          <div className="flex gap-2">
            <input className={inputCls} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="DELETE" />
            <button disabled={confirm !== "DELETE"} onClick={destroy} className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 text-sm font-semibold text-destructive-foreground disabled:opacity-40">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </Panel>
      </div>
    </>
  );
}
