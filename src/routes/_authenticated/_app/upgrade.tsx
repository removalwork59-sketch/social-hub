import { createFileRoute } from "@tanstack/react-router";
import { BillingView } from "@/components/BillingView";

export const Route = createFileRoute("/_authenticated/_app/upgrade")({
  head: () => ({ meta: [{ title: "Upgrade — SocialOS" }, { name: "description", content: "Compare plans and upgrade." }] }),
  component: () => <BillingView upsell />,
});
