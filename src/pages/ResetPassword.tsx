import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/kinderstars-logo.png";
import { Loader2, CheckCircle2 } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Listen for the RECOVERY event from the URL token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });
    // Also check if we already have a session (user clicked link and was auto-logged in)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/auth"), 3000);
    }
  };

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
          <a href="/"><img src={logo} alt="KinderStars" className="w-[160px] mx-auto mb-4" /></a>
          <h1 className="text-xl font-bold tracking-tight">Set New Password</h1>
          <p className="text-muted-foreground text-sm mt-1">Enter your new password below.</p>
        </div>

        <div className="ks-card p-6">
          {success ? (
            <div className="text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
              <p className="font-bold">Password updated!</p>
              <p className="text-muted-foreground text-sm">Redirecting to sign in…</p>
            </div>
          ) : !sessionReady ? (
            <div className="text-center space-y-3 py-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground text-sm">Verifying your reset link…</p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-3">
              <div className="ks-field">
                <label htmlFor="new-pw">New Password</label>
                <input id="new-pw" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" />
              </div>
              <div className="ks-field">
                <label htmlFor="confirm-pw">Confirm Password</label>
                <input id="confirm-pw" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" />
              </div>
              {error && <p className="text-destructive text-xs">{error}</p>}
              <Button variant="hero" className="w-full" type="submit" disabled={submitting}>
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Updating…</> : "Update Password"}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          <a href="/auth" className="underline">← Back to sign in</a>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
