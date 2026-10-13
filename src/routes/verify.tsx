import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { btnPrimary, cardCls, inputCls } from "@/components/AppShell";

export const Route = createFileRoute("/verify")({
  head: () => ({ meta: [{ title: "Verify — SocialOS" }, { name: "description", content: "Sign in with a 6-digit code." }, { name: "robots", content: "noindex" }] }),
  component: Verify,
});

function Verify() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    setCooldown(30);
    toast.success("Code sent — check your email");
    setTimeout(() => refs.current[0]?.focus(), 50);
  }

  async function verify(code: string) {
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      setDigits(["", "", "", "", "", ""]);
      refs.current[0]?.focus();
      return;
    }
    navigate({ to: "/dashboard" });
  }

  function onDigit(i: number, v: string) {
    const clean = v.replace(/\D/g, "");
    if (clean.length > 1) {
      const all = clean.slice(0, 6).split("");
      const next = [...digits];
      all.forEach((d, j) => (next[j] = d));
      setDigits(next);
      if (next.every(Boolean)) verify(next.join(""));
      return;
    }
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < 5) refs.current[i + 1]?.focus();
    if (next.every(Boolean)) verify(next.join(""));
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 font-sans text-foreground">
      <div className={`${cardCls} w-full max-w-sm animate-rise text-center`}>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent"><ShieldCheck className="h-6 w-6 text-accent-foreground" /></div>
        <h1 className="mt-4 text-xl font-semibold">Verify it's you</h1>
        {!sent ? (
          <form onSubmit={send} className="mt-5 space-y-3 text-left">
            <p className="text-center text-sm text-muted-foreground">We'll email you a 6-digit code.</p>
            <input required type="email" className={inputCls} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className={`${btnPrimary} w-full`}>Send code</button>
          </form>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">Enter the code sent to {email}</p>
            <div className="mt-6 flex justify-center gap-2">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { refs.current[i] = el; }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-label={`Digit ${i + 1}`}
                  maxLength={6}
                  value={d}
                  disabled={busy}
                  onChange={(e) => onDigit(i, e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus(); }}
                  className="h-12 w-10 rounded-xl border border-input bg-card text-center text-lg font-semibold outline-none focus:ring-2 focus:ring-ring"
                />
              ))}
            </div>
            <button disabled={cooldown > 0} onClick={() => send()} className="mt-6 text-sm text-accent-foreground disabled:text-muted-foreground">
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
          </>
        )}
        <Link to="/auth" className="mt-4 block text-xs text-muted-foreground hover:text-foreground">Back to sign in</Link>
      </div>
    </div>
  );
}
