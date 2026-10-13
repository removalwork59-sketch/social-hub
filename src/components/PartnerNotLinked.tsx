import { Panel } from "@/components/portal-ui";

export function NotLinked() {
  return (
    <Panel title="No partner account linked">
      <p className="text-sm text-muted-foreground">
        This login isn't linked to a partner yet. A Super Admin can create a partner login from Admin → Partners → open a partner → Settings.
      </p>
    </Panel>
  );
}
