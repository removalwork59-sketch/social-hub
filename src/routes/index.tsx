import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Link2, Sparkles, Users } from "lucide-react";
import { btnPrimary } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SocialOS — AI social media management for agencies" },
      { name: "description", content: "Manage every client's social media in one place. Connect accounts, schedule posts and let AI do the heavy lifting." },
      { property: "og:title", content: "SocialOS — AI social media management" },
      { property: "og:description", content: "One place for every client's social media, powered by AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Users, title: "Client workspaces", text: "Each client's data stays separate." },
  { icon: Link2, title: "Connect accounts", text: "Facebook, Instagram, LinkedIn, X, Google Business." },
  { icon: CalendarDays, title: "Schedule posts", text: "Plan everything on one calendar." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">SocialOS</span>
        </div>
        <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Sign in
        </Link>
      </header>
      <section className="mx-auto max-w-3xl px-6 pb-16 pt-20 text-center animate-rise">
        <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
          Every client's social media.{" "}
          <span className="bg-gradient-primary bg-clip-text text-transparent">One calm dashboard.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
          Connect accounts, plan posts on a calendar and let AI handle the busywork. Free to start.
        </p>
        <Link to="/auth" className={`${btnPrimary} mt-8`}>
          Get started free
        </Link>
      </section>
      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-24 md:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <f.icon className="h-5 w-5 text-primary" />
            <h2 className="mt-3 font-semibold">{f.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
