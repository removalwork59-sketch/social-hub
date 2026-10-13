import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { CreditCard, Layers, LayoutDashboard, LifeBuoy, Palette, Settings, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";

export const Route = createFileRoute("/_authenticated/partner")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    const id = u.user!.id;
    const [p, a] = await Promise.all([
      supabase.rpc("has_role", { _user_id: id, _role: "partner" }),
      supabase.rpc("has_role", { _user_id: id, _role: "super_admin" }),
    ]);
    if (!p.data && !a.data) throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Partner — SocialOS" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <PortalShell
      badge="Partner"
      nav={[
        { to: "/partner", label: "Overview", icon: LayoutDashboard, exact: true },
        { to: "/partner/clients", label: "My Clients", icon: Users },
        { to: "/partner/branding", label: "Branding", icon: Palette },
        { to: "/partner/plans", label: "Plans", icon: Layers },
        { to: "/partner/billing", label: "Billing", icon: CreditCard },
        { to: "/partner/support", label: "Support", icon: LifeBuoy },
        { to: "/partner/settings", label: "Settings", icon: Settings },
      ]}
    >
      <Outlet />
    </PortalShell>
  ),
});
