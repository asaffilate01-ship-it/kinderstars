import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import logo from "@/assets/kinderstars-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import MFAVerify from "@/components/MFAVerify";
import MFASetup from "@/pages/portal/MFASetup";

type AuthMode = "login" | "signup" | "forgot";
type UserRole = "childminder" | "parent";

const signupSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const Auth = () => {
  const { signIn, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role") as UserRole | null;

  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState<UserRole>(roleParam === "parent" ? "parent" : "childminder");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showMFA, setShowMFA] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setForgotSubmitting(true);
    try {
      await supabase.functions.invoke("send-password-reset", {
        body: { email: forgotEmail, redirectTo: `${window.location.origin}/reset-password` },
      });
      setForgotSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setForgotSubmitting(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setError(error);
    } else {
      // Check if user has MFA enrolled
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const hasTotp = factors?.totp?.some((f) => f.status === "verified");
      if (hasTotp) {
        setShowMFA(true);
      } else {
        // MFA not yet set up — force setup
        setShowMFASetup(true);
      }
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const result = signupSchema.safeParse({ firstName, lastName, email, password });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          first_name: firstName,
          last_name: lastName,
          role,
        },
      },
    });
    setSubmitting(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Check your email to verify your account, then log in.");
      supabase.functions.invoke("send-welcome-email", {
        body: { email, firstName, role },
      }).catch(() => {});
    }
  };

  const authWrapper = (children: React.ReactNode) => (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background:
          "radial-gradient(900px 520px at 10% 0%, hsla(44,93%,57%,0.18), transparent 60%), radial-gradient(900px 520px at 90% 20%, hsla(200,93%,23%,0.10), transparent 60%), linear-gradient(180deg, hsl(36,100%,97%), hsl(0,0%,100%))",
      }}
    >
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-6">
          <a href="/"><img src={logo} alt="KinderStars" className="w-[160px] mx-auto mb-4" /></a>
        </div>
        <div className="ks-card p-6">
          {children}
        </div>
      </div>
    </div>
  );

  if (showMFASetup) {
    return authWrapper(
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="font-bold text-lg">Set Up Two-Factor Authentication</h2>
          <p className="text-muted-foreground text-sm mt-1">
            MFA is required for all KinderStars accounts. Please set up your authenticator app to continue.
          </p>
        </div>
        <MFASetup onComplete={() => navigate("/portal")} inline />
      </div>
    );
  }

  if (showMFA) {
    return authWrapper(
      <MFAVerify onVerified={() => navigate("/portal")} />
    );
  }

  if (mode === "forgot") {
    return authWrapper(
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="font-bold text-lg">Reset Your Password</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Enter your email and we'll send you a reset link.
          </p>
        </div>
        {forgotSent ? (
          <div className="text-center space-y-2 py-2">
            <p className="text-success font-medium text-sm">✅ If an account exists for that email, you'll receive a reset link shortly.</p>
            <p className="text-muted-foreground text-xs">Check your inbox and spam folder.</p>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-3">
            <div className="ks-field">
              <label htmlFor="forgot-email">Email address</label>
              <input id="forgot-email" type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
            <Button variant="hero" className="w-full" type="submit" disabled={forgotSubmitting}>
              {forgotSubmitting ? "Sending…" : "Send Reset Link"}
            </Button>
          </form>
        )}
        <p className="text-center">
          <button className="text-xs text-muted-foreground underline hover:text-foreground" onClick={() => { setMode("login"); setError(""); }}>
            ← Back to sign in
          </button>
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background:
          "radial-gradient(900px 520px at 10% 0%, hsla(44,93%,57%,0.18), transparent 60%), radial-gradient(900px 520px at 90% 20%, hsla(200,93%,23%,0.10), transparent 60%), linear-gradient(180deg, hsl(36,100%,97%), hsl(0,0%,100%))",
      }}
    >
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-6">
          <a href="/">
            <img src={logo} alt="KinderStars" className="w-[160px] mx-auto mb-4" />
          </a>
          <h1 className="text-xl font-bold tracking-tight">
            {mode === "login" ? "Sign in to your account" : "Create your account"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === "login"
              ? "Access your KinderStars portal."
              : "Join KinderStars as a childminder or parent."}
          </p>
        </div>

        <div className="ks-card p-6">
          {mode === "signup" && (
            <div className="space-y-4 mb-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRole("childminder")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    role === "childminder"
                      ? "bg-secondary text-secondary-foreground border-secondary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Childminder
                </button>
                <button
                  type="button"
                  onClick={() => setRole("parent")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    role === "parent"
                      ? "bg-secondary text-secondary-foreground border-secondary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Parent
                </button>
              </div>

              {role === "parent" && (
                <div className="rounded-xl p-3 text-[11px] space-y-1.5 border" style={{ borderColor: "hsl(var(--brand-accent) / 0.4)", background: "hsl(var(--brand-accent) / 0.06)" }}>
                  <p className="font-bold text-xs text-foreground">💳 So funktioniert die Bezahlung</p>
                  <p className="text-muted-foreground leading-relaxed">
                    KinderStars vermittelt Sie an eine selbstständige Kindertagespflegeperson. Die Abrechnung erfolgt transparent über die Plattform — ob privat, über
                    {" "}<strong className="text-foreground">Jugendamt‑Förderung nach § 23 SGB VIII</strong>,
                    {" "}<strong className="text-foreground">Arbeitgeberzuschuss nach § 3 Nr. 33 EStG</strong> oder
                    {" "}<strong className="text-foreground">steuerliche Absetzbarkeit nach § 10 Abs. 1 Nr. 5 EStG</strong>.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Ihre Betreuungsperson ist selbstständig tätig — KinderStars ist ausschließlich Vermittler nach § 296 SGB III und kein Arbeitgeber.
                  </p>
                </div>
              )}
            </div>
          )}

          <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-3">
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="ks-field">
                  <label htmlFor="auth-first">First name</label>
                  <input id="auth-first" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="ks-field">
                  <label htmlFor="auth-last">Last name</label>
                  <input id="auth-last" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
            )}
            <div className="ks-field">
              <label htmlFor="auth-email">Email</label>
              <input id="auth-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="ks-field">
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-destructive text-xs">{error}</p>}
            {success && <p className="text-success text-xs font-medium">{success}</p>}

            <Button variant="hero" className="w-full" type="submit" disabled={submitting || loading}>
              {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </Button>

            {mode === "login" && (
              <p className="text-center mt-2">
                <button className="text-xs text-muted-foreground underline hover:text-foreground" onClick={() => { setMode("forgot"); setError(""); setSuccess(""); setForgotSent(false); setForgotEmail(email); }}>
                  Forgot your password?
                </button>
              </p>
            )}
          </form>

          <p className="text-center text-xs text-muted-foreground mt-4">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button className="underline font-medium text-foreground" onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}>
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button className="underline font-medium text-foreground" onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          <a href="/" className="underline">← Back to website</a>
        </p>
      </div>
    </div>
  );
};

export default Auth;
