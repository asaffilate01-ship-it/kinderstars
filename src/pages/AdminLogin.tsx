import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/kinderstars-logo.png";
import MFAVerify from "@/components/MFAVerify";
import MFASetup from "@/pages/portal/MFASetup";

const AdminLogin = () => {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showMFA, setShowMFA] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setError(error);
    } else {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const hasTotp = factors?.totp?.some((f) => f.status === "verified");
      if (hasTotp) {
        setShowMFA(true);
      } else {
        setShowMFASetup(true);
      }
    }
  };

  const authWrapper = (children: React.ReactNode) => (
    <div className="min-h-screen flex items-center justify-center px-6" style={{
      background: "radial-gradient(900px 520px at 10% 0%, hsla(44,93%,57%,0.18), transparent 60%), radial-gradient(900px 520px at 90% 20%, hsla(200,93%,23%,0.10), transparent 60%), linear-gradient(180deg, hsl(36,100%,97%), hsl(0,0%,100%))"
    }}>
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-6">
          <a href="/"><img src={logo} alt="KinderStars" className="w-[160px] mx-auto mb-4" /></a>
        </div>
        <div className="ks-card p-6">{children}</div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          <a href="/" className="underline">← Back to website</a>
        </p>
      </div>
    </div>
  );

  if (showMFASetup) {
    return authWrapper(
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="font-bold text-lg">Set Up Two-Factor Authentication</h2>
          <p className="text-muted-foreground text-sm mt-1">MFA is required. Set up your authenticator app to continue.</p>
        </div>
        <MFASetup onComplete={() => navigate("/admin/dashboard")} inline />
      </div>
    );
  }

  if (showMFA) {
    return authWrapper(
      <MFAVerify onVerified={() => navigate("/admin/dashboard")} />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{
      background: "radial-gradient(900px 520px at 10% 0%, hsla(44,93%,57%,0.18), transparent 60%), radial-gradient(900px 520px at 90% 20%, hsla(200,93%,23%,0.10), transparent 60%), linear-gradient(180deg, hsl(36,100%,97%), hsl(0,0%,100%))"
    }}>
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-6">
          <a href="/"><img src={logo} alt="KinderStars" className="w-[160px] mx-auto mb-4" /></a>
          <h1 className="text-xl font-bold tracking-tight">Admin login</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to manage the childminder directory.</p>
        </div>

        <div className="ks-card p-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="ks-field">
              <label htmlFor="admin-email">Email</label>
              <input id="admin-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="ks-field">
              <label htmlFor="admin-password">Password</label>
              <input id="admin-password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
            <Button variant="hero" className="w-full" type="submit" disabled={submitting || loading}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          <a href="/" className="underline">← Back to website</a>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
