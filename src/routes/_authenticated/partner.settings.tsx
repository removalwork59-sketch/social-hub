import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { AccountSettings } from "@/components/AccountSettings";

export const Route = createFileRoute("/_authenticated/partner/settings")({
  component: () => (
    <>
      <PageHeader subtitle="Your account" title="Settings" />
      <AccountSettings />
    </>
  ),
});
