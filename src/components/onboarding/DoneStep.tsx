import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Home, PenSquare, Users } from "lucide-react";
import { btnPrimary, cardCls } from "@/components/AppShell";

const COLORS = ["var(--primary)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function DoneStep({ name, summary }: { name: string; summary: string[] }) {
  return (
    <div className="relative py-6 text-center">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        {Array.from({ length: 40 }, (_, i) => (
          <span
            key={i}
            className="confetti absolute top-0 h-2.5 w-1.5 rounded-sm"
            style={{ left: `${(i * 37) % 100}%`, background: COLORS[i % COLORS.length], animationDelay: `${(i % 10) * 0.12}s`, animationDuration: `${2.4 + (i % 5) * 0.3}s` }}
          />
        ))}
      </div>
      <div className="check-pop mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-primary shadow-glow">
        <Check className="h-10 w-10 text-primary-foreground" strokeWidth={3} />
      </div>
      <h1 className="mt-6 text-4xl font-semibold">You're all set, {name}!</h1>
      <p className="mt-2 text-muted-foreground">Your AI assistant is ready to create, schedule, and reply.</p>

      <div className={`${cardCls} mx-auto mt-8 max-w-md text-left`}>
        <p className="mb-3 font-medium">Here's what we set up for you:</p>
        <ul className="space-y-2 text-sm">{summary.map((s) => <li key={s} className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />{s}</li>)}</ul>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { to: "/composer", icon: PenSquare, t: "Create Your First Post", s: "Let AI write it for you" },
          { to: "/dashboard", icon: Home, t: "Explore Dashboard", s: "See your analytics" },
          { to: "/accounts", icon: Users, t: "Connect More Accounts", s: "Add YouTube, TikTok, more" },
        ].map((a) => (
          <Link key={a.t} to={a.to} className={`${cardCls} flex flex-col items-center gap-2 py-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary`}>
            <a.icon className="h-6 w-6 text-primary" />
            <span className="font-semibold">{a.t}</span>
            <span className="text-xs text-muted-foreground">{a.s}</span>
          </Link>
        ))}
      </div>

      <Link to="/dashboard" className={`${btnPrimary} mt-8 px-8 py-3 text-base`}>Go to Dashboard <ArrowRight className="h-4 w-4" /></Link>
    </div>
  );
}
