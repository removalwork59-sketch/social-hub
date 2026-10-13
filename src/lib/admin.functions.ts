import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Super Admin only: create a client owner account with its own workspace. */
export const createClientAccount = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; email: string; password: string; workspace: string; plan: "free" | "pro" | "business" }) => d)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (!isAdmin) throw new Error("Super Admin access required");

    const name = data.name?.trim();
    const email = data.email?.trim().toLowerCase();
    const workspace = data.workspace?.trim();
    if (!name || !email || !workspace) throw new Error("Name, email and workspace are required");
    if (!data.password || data.password.length < 6) throw new Error("Password must be at least 6 characters");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (error) throw new Error(error.message);
    const userId = created.user.id;

    const { error: pErr } = await supabaseAdmin.from("profiles").upsert({ id: userId, name });
    if (pErr) throw new Error(pErr.message);

    const { data: ws, error: wErr } = await supabaseAdmin
      .from("workspaces")
      .insert({ name: workspace, owner_id: userId, plan: data.plan ?? "free", onboarded: true })
      .select("id")
      .single();
    if (wErr) throw new Error(wErr.message);

    const { error: mErr } = await supabaseAdmin
      .from("workspace_members")
      .insert({ workspace_id: ws.id, user_id: userId, role: "owner" });
    if (mErr) throw new Error(mErr.message);

    return { ok: true, email, workspace: ws.id };
  });
