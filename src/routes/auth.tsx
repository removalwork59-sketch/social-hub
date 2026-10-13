import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
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
      { property: "og:description", content: "Sign in or create your SocialOS account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: "/dashboard" });
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
        options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name } },
      });
      if (error) toast.error(error.message);
      else setSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
    }
    setBusy(false);
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(r.error.message ?? "Google sign-in failed");
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 font-sans text-foreground">
      <div className="w-full max-w-sm animate-rise">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold">SocialOS</span>
        </Link>
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          {sent ? (
            <div className="text-center">
              <h1 className="text-lg font-semibold">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a confirmation link to {email}. Click it to finish creating your account.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold">{mode === "in" ? "Welcome back" : "Create your account"}</h1>
              <p className="mb-5 text-sm text-muted-foreground">
                {mode === "in" ? "Sign in to manage your clients." : "Start free — 5 posts a month."}
              </p>
              <button
                onClick={google}
                className="mb-4 w-full rounded-xl border border-input py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
              >
                Continue with Google
              </button>
              <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
              </div>
              <form onSubmit={submit} className="space-y-3">
                {mode === "up" && (
                  <input className={inputCls} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
                )}
                <input className={inputCls} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input
                  className={inputCls}
                  type="password"
                  placeholder="Password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button disabled={busy} className={`${btnPrimary} w-full`}>
                  {mode === "in" ? "Sign in" : "Create account"}
                </button>
              </form>
              <p className="mt-4 text-center text-sm text-muted-foreground">
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
