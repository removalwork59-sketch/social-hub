import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const PLAN_PRICE: Record<string, number> = { free: 0, pro: 499, business: 1499 };

/** Data for the signed-in partner: their record, their clients and their payouts (all RLS/definer-scoped). */
export function usePartnerData() {
  return useQuery({
    queryKey: ["partner-me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const [{ data: partner }, { data: clients }, { data: payouts }] = await Promise.all([
        supabase.from("partners").select("*").eq("user_id", u.user?.id ?? "").maybeSingle(),
        supabase.rpc("partner_my_clients"),
        supabase.from("partner_payouts").select("*").order("period", { ascending: false }),
      ]);
      const list = clients ?? [];
      const revenue = list.reduce((a, c) => a + (PLAN_PRICE[c.plan] ?? 0), 0);
      const pct = Number(partner?.commission_pct ?? 0);
      return {
        partner,
        clients: list,
        payouts: partner ? (payouts ?? []).filter((p) => p.partner_id === partner.id) : [],
        revenue,
        commission: Math.round((revenue * pct) / 100),
        pct,
      };
    },
  });
}
