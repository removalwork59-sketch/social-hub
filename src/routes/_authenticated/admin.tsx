import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Activity, Bot, Building2, CreditCard, History, IndianRupee, LayoutDashboard, LifeBuoy, Settings, Shield, ToggleRight, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data } = await supabase.rpc("has_role", { _user_id: u.user!.id, _role: "super_admin" });
    if (!data) throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Super Admin — SocialOS" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <PortalShell
      badge="Super Admin"
      nav={[
        { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
        { to: "/admin/partners", label: "Partners", icon: Building2 },
        { to: "/admin/clients", label: "Clients", icon: Users },
        { to: "/admin/revenue", label: "Revenue", icon: IndianRupee },
        { to: "/admin/ai-usage", label: "AI Usage", icon: Bot },
        { to: "/admin/health", label: "System Health", icon: Activity },
        { to: "/admin/support", label: "Support", icon: LifeBuoy },
        { to: "/admin/flags", label: "Feature Flags", icon: ToggleRight },
        { to: "/admin/audit", label: "Audit Logs", icon: History },
        { to: "/admin/security", label: "Security", icon: Shield },
        { to: "/admin/payouts", label: "Billing & Payouts", icon: CreditCard },
        { to: "/admin/settings", label: "Settings", icon: Settings },
      ]}
    >
      <Outlet />
    </PortalShell>
  ),
});
