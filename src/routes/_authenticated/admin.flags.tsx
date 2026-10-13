import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Panel, SampleNote } from "@/components/portal-ui";

export const Route = createFileRoute("/_authenticated/admin/flags")({
  head: () => ({ meta: [{ title: "Feature flags — SocialOS Admin" }, { name: "description", content: "Turn features on or off per plan." }] }),
  component: Flags,
});

const plans = ["Free", "Pro", "Business"] as const;
const seed: Record<string, boolean[]> = {
  "AI post generator": [true, true, true],
  "AI reply drafts": [false, true, true],
  "Brand monitoring": [false, true, true],
  "Auto-moderation": [false, true, true],
  "White-label branding": [false, false, true],
  "Team members": [false, true, true],
  "API access": [false, false, true],
};

function Flags() {
  const [flags, setFlags] = useState(seed);
  return (
    <>
      <PageHeader subtitle="Platform" title="Feature flags" />
      <SampleNote>Preview — toggles are saved for this session only.</SampleNote>
      <Panel title="Features by plan" className="mt-4">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="py-2">Feature</th>{plans.map((p) => <th key={p} className="py-2 text-center">{p}</th>)}</tr></thead>
          <tbody>
            {Object.entries(flags).map(([f, v]) => (
              <tr key={f} className="border-b border-border/60">
                <td className="py-3">{f}</td>
                {v.map((on, i) => (
                  <td key={i} className="text-center">
                    <button role="switch" aria-checked={on} aria-label={`${f} on ${plans[i]}`} onClick={() => { setFlags({ ...flags, [f]: v.map((x, j) => (j === i ? !x : x)) }); toast.success(`${f} ${on ? "off" : "on"} for ${plans[i]}`); }} className={`relative h-5 w-9 rounded-full transition-colors ${on ? "bg-primary" : "bg-muted"}`}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all ${on ? "left-4" : "left-0.5"}`} />
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
