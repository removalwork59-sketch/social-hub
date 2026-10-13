import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, CreditCard, Download, Smartphone, Wallet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace";
import { PageHeader, btnPrimary, cardCls } from "@/components/AppShell";
import { Panel, Pill, SampleNote, Table, btnOutline, inr } from "@/components/portal-ui";
import { paymentHistory } from "@/lib/client-sample";

const plans = [
  { id: "free", name: "Free", price: 0, posts: 5, features: ["1 social account", "5 posts / month", "5 AI calls / day"] },
  { id: "pro", name: "Pro", price: 499, posts: Infinity, features: ["5 social accounts", "Unlimited posts", "500 AI calls / day", "Unified inbox"] },
  { id: "business", name: "Business", price: 1499, posts: Infinity, features: ["All platforms", "5000 AI calls / day", "White-label", "Team approvals"] },
];

export function BillingView({ upsell = false }: { upsell?: boolean }) {
  const { current } = useWorkspace();
  const [method, setMethod] = useState("upi");
  const plan = plans.find((p) => p.id === current?.plan) ?? plans[0]!;

  const { data: used = 0 } = useQuery({
    queryKey: ["posts-month", current?.id],
    enabled: !!current,
    queryFn: async () => {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const { count } = await supabase.from("posts").select("id", { count: "exact", head: true }).eq("workspace_id", current!.id).gte("created_at", start.toISOString());
      return count ?? 0;
    },
  });
  const pct = plan.posts === Infinity ? 8 : Math.min(100, (used / plan.posts) * 100);

  return (
    <>
      <PageHeader subtitle={current?.name} title="Billing" />
      <SampleNote>Online payments (UPI AutoPay, card, PayPal) aren't switched on yet — plan changes will work once payments are connected.</SampleNote>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Current plan">
          <p className="text-3xl font-semibold">{plan.name}</p>
          <p className="text-sm text-muted-foreground">{inr(plan.price)} / month</p>
          <div className="mt-5">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Posts this month</span><span>{used} / {plan.posts === Infinity ? "∞" : plan.posts}</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full ${pct >= 100 ? "bg-destructive" : "bg-gradient-primary"}`} style={{ width: `${pct}%` }} /></div>
          </div>
          {pct >= 80 && plan.id === "free" && <p className="mt-3 text-xs text-warning">You're close to your monthly limit — upgrade for unlimited posts.</p>}
        </Panel>
        <Panel title="Payment method" className="lg:col-span-2">
          <div className="grid gap-2 sm:grid-cols-3">
            {[["upi", "UPI AutoPay", Smartphone], ["card", "Credit / debit card", CreditCard], ["paypal", "PayPal", Wallet]].map(([id, label, I]) => {
              const Icon = I as typeof Wallet;
              return (
                <button key={id as string} onClick={() => setMethod(id as string)} className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm transition-colors ${method === id ? "border-primary bg-accent" : "border-input hover:border-primary/50"}`}>
                  <Icon className="h-5 w-5 text-primary" /> {label as string}
                </button>
              );
            })}
          </div>
        </Panel>
      </div>

      <section className="mt-4 grid gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = p.id === plan.id;
          return (
            <div key={p.id} className={`${cardCls} flex flex-col ${p.id === "pro" ? "border-primary/50 shadow-glow" : ""}`}>
              <div className="flex items-center justify-between"><h3 className="font-semibold">{p.name}</h3>{p.id === "pro" && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">Popular</span>}</div>
              <p className="mt-2 text-3xl font-semibold">{inr(p.price)}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              <ul className="mt-4 flex-1 space-y-1.5 text-sm">{p.features.map((f) => <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{f}</li>)}</ul>
              <button disabled={isCurrent} onClick={() => toast.info("Payments are being set up — plan changes will be available soon")} className={`mt-5 ${isCurrent ? "rounded-xl border border-input py-2.5 text-sm text-muted-foreground" : btnPrimary}`}>
                {isCurrent ? "Current plan" : p.price > plan.price ? "Upgrade" : "Downgrade"}
              </button>
            </div>
          );
        })}
      </section>

      <Panel title="Payment history" subtitle="Sample" className="mt-4">
        <Table head={["Invoice", "Date", "Amount", "Method", "Status", ""]} rows={paymentHistory.map((p) => [<span key="i" className="font-mono text-xs">{p.id}</span>, p.date, inr(p.amount), p.method, <Pill key="s" value={p.status} />, <button key="d" className={`${btnOutline} py-1 text-xs`} onClick={() => toast.info("Invoices download once payments are live")}><Download className="h-3.5 w-3.5" /> Invoice</button>])} />
      </Panel>
    </>
  );
}
