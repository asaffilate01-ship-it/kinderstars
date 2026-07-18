import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Shield, Loader2 } from "lucide-react";

interface MFAVerifyProps {
  onVerified: () => void;
}

const MFAVerify = ({ onVerified }: MFAVerifyProps) => {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    setError("");
    setVerifying(true);

    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totpFactor = factors?.totp?.find((f) => f.status === "verified");

    if (!totpFactor) {
      onVerified(); // No MFA set up, skip
      return;
    }

    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
    if (challengeErr) {
      setError(challengeErr.message);
      setVerifying(false);
      return;
    }

    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId: totpFactor.id,
      challengeId: challenge.id,
      code,
    });

    setVerifying(false);
    if (verifyErr) {
      setError("Invalid code. Please try again.");
    } else {
      onVerified();
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <h2 className="font-bold text-lg">Two-Factor Verification</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Enter the 6-digit code from your authenticator app.
        </p>
      </div>

      <div className="ks-field max-w-[200px] mx-auto">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="text-center text-lg tracking-widest"
          autoFocus
        />
      </div>

      {error && <p className="text-destructive text-xs text-center">{error}</p>}

      <Button
        variant="hero"
        className="w-full"
        onClick={handleVerify}
        disabled={code.length !== 6 || verifying}
      >
        {verifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Verify
      </Button>
    </div>
  );
};

export default MFAVerify;
