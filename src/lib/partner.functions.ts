import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Plan = "free" | "pro" | "business";

/** Super Admin: create a sign-in for a partner and link it to the partner record. */
export const createPartnerLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { partnerId: string; email: string; name: string; password: string }) => d)
  .handler(async ({ context, data }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" });
    if (!isAdmin) throw new Error("Super Admin access required");
    if (!data.password || data.password.length < 6) throw new Error("Password must be at least 6 characters");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name },
    });
    if (error) throw new Error(error.message);
    const uid = created.user.id;
    await supabaseAdmin.from("profiles").upsert({ id: uid, full_name: data.name });
    const { error: lErr } = await context.supabase.rpc("admin_link_partner_user", { _partner: data.partnerId, _user: uid });
    if (lErr) throw new Error(lErr.message);
    return { ok: true };
  });

/** Partner: create a client account that belongs to the calling partner. */
export const createPartnerClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string; email: string; password: string; workspace: string; plan: Plan }) => d)
  .handler(async ({ context, data }) => {
    const { data: partnerId } = await context.supabase.rpc("my_partner_id");
    if (!partnerId) throw new Error("Only partner accounts can add clients here");
    const email = data.email?.trim().toLowerCase();
    const workspace = data.workspace?.trim();
    if (!data.name?.trim() || !email || !workspace) throw new Error("Name, email and business name are required");
    if (!data.password || data.password.length < 6) throw new Error("Password must be at least 6 characters");
    if (!["free", "pro", "business"].includes(data.plan)) throw new Error("Invalid plan");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({ email, password: data.password, email_confirm: true, user_metadata: { name: data.name } });
    if (error) throw new Error(error.message);
    const uid = created.user.id;
    await supabaseAdmin.from("profiles").upsert({ id: uid, full_name: data.name.trim() });
    const { data: ws, error: wErr } = await supabaseAdmin
      .from("workspaces")
      .insert({ name: workspace, owner_id: uid, plan: data.plan, onboarded: true, partner_id: partnerId })
      .select("id")
      .single();
    if (wErr) throw new Error(wErr.message);
    const { error: mErr } = await supabaseAdmin.from("workspace_members").upsert({ workspace_id: ws.id, user_id: uid, role: "owner" });
    if (mErr) throw new Error(mErr.message);
    return { ok: true };
  });
