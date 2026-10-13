import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, CalendarDays, MessageCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { btnPrimary, inputCls } from "@/components/AppShell";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — SocialOS" },
      { name: "description", content: "Sign in or create your SocialOS account." },
      { property: "og:title", content: "Sign in — SocialOS" },
      { property: "og:description", content: "Manage all your social media with AI." },
    ],
  }),
  component: AuthPage,
});

type Mode = "in" | "up" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("in");
  const [name, setName] = useState("");
  const [workspace, setWorkspace] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => {
      if (s && e === "SIGNED_IN") navigate({ to: "/dashboard" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "up") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name, workspace_name: workspace } },
      });
      if (error) toast.error(error.message);
      else setSent(`We sent a confirmation link to ${email}. Click it to finish creating your account.`);
    } else if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      if (error) toast.error(error.message);
      else setSent(`If an account exists for ${email}, a reset link is on its way.`);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
    }
    setBusy(false);
  }

  async function social(provider: "google" | "apple") {
    const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(r.error.message ?? "Sign-in failed");
  }

  const title = mode === "in" ? "Welcome back" : mode === "up" ? "Create your account" : "Reset your password";

  return (
    <div className="grid min-h-screen bg-background font-sans text-foreground lg:grid-cols-2">
      <div className="relative hidden overflow-hidden border-r border-border bg-sidebar p-12 lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-primary-glow/10 blur-3xl" />
        <Link to="/" className="relative flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow"><Sparkles className="h-5 w-5 text-primary-foreground" /></div>
          <span className="text-xl font-semibold">SocialOS</span>
        </Link>
        <div className="relative my-auto">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Manage all your social media <span className="bg-gradient-primary bg-clip-text text-transparent">with AI</span>
          </h2>
          <ul className="mt-8 space-y-4 text-muted-foreground">
            {[[CalendarDays, "Plan and schedule across 5 platforms"], [MessageCircle, "One inbox with AI reply drafts"], [BarChart3, "Know what works and when to post"]].map(([I, t]) => {
              const Icon = I as typeof Sparkles;
              return <li key={t as string} className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-accent"><Icon className="h-4 w-4 text-accent-foreground" /></span>{t as string}</li>;
            })}
          </ul>
        </div>
      </div>

      <div className="grid place-items-center px-4 py-10">
        <div className="w-full max-w-sm animate-rise">
          <Link to="/" className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow"><Sparkles className="h-5 w-5 text-primary-foreground" /></div>
            <span className="text-xl font-semibold">SocialOS</span>
          </Link>
          {sent ? (
            <div className="text-center">
              <h1 className="text-xl font-semibold">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">{sent}</p>
              <button onClick={() => { setSent(null); setMode("in"); }} className="mt-6 text-sm font-medium text-accent-foreground">Back to sign in</button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold">{title}</h1>
              <p className="mb-6 mt-1 text-sm text-muted-foreground">
                {mode === "in" ? "Sign in to manage your clients." : mode === "up" ? "Start free — 5 posts a month." : "We'll email you a reset link."}
              </p>
              {mode !== "forgot" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => social("google")} className="rounded-xl border border-input py-2.5 text-sm font-medium transition-colors hover:bg-secondary">Google</button>
                    <button onClick={() => social("apple")} className="rounded-xl border border-input py-2.5 text-sm font-medium transition-colors hover:bg-secondary">Apple</button>
                  </div>
                  <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" /></div>
                </>
              )}
              <form onSubmit={submit} className="space-y-3">
                {mode === "up" && (
                  <>
                    <input className={inputCls} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
                    <input className={inputCls} placeholder="Workspace name (e.g. your business)" value={workspace} onChange={(e) => setWorkspace(e.target.value)} required maxLength={80} />
                  </>
                )}
                <input className={inputCls} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                {mode !== "forgot" && (
                  <input className={inputCls} type="password" placeholder="Password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
                )}
                {mode === "in" && (
                  <button type="button" onClick={() => setMode("forgot")} className="block text-xs text-muted-foreground hover:text-foreground">Forgot password?</button>
                )}
                <button disabled={busy} className={`${btnPrimary} w-full`}>
                  {mode === "in" ? "Sign in" : mode === "up" ? "Create account" : "Send reset link"}
                </button>
              </form>
              <p className="mt-5 text-center text-sm text-muted-foreground">
                {mode === "in" ? "New here?" : "Have an account?"}{" "}
                <button className="font-medium text-accent-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
                  {mode === "in" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
