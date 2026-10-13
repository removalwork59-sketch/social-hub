import { createFileRoute } from "@tanstack/react-router";
import { BillingView } from "@/components/BillingView";

export const Route = createFileRoute("/_authenticated/_app/billing")({
  head: () => ({ meta: [{ title: "Billing — SocialOS" }, { name: "description", content: "Plan and payments." }] }),
  component: () => <BillingView />,
});
