import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { btnPrimary, cardCls, inputCls } from "@/components/AppShell";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — SocialOS" }, { name: "description", content: "Choose a new password." }, { name: "robots", content: "noindex" }] }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");

  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) setReady(true);
    const { data } = supabase.auth.onAuthStateChange((e) => {
      if (e === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 font-sans text-foreground">
      <form onSubmit={save} className={`${cardCls} w-full max-w-sm space-y-3`}>
        <h1 className="text-lg font-semibold">Choose a new password</h1>
        {!ready && <p className="text-sm text-muted-foreground">Open this page from the link in your reset email.</p>}
        <input required minLength={6} type="password" className={inputCls} placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <button disabled={!ready} className={`${btnPrimary} w-full`}>Update password</button>
      </form>
    </div>
  );
}
