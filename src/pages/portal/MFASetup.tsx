import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Shield, Loader2, QrCode, Check, Trash2, Lock } from "lucide-react";

interface MFASetupProps {
  onComplete?: () => void;
  inline?: boolean;
}

const MFASetup = ({ onComplete, inline }: MFASetupProps) => {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const [factors, setFactors] = useState<any[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadFactors(); }, []);

  const loadFactors = async () => {
    setLoading(true);
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors(data?.totp || []);
    setLoading(false);
  };

  const startEnroll = async () => {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Authenticator App" });
    if (error) {
      toast({ title: t("portal.common.error"), description: error.message, variant: "destructive" });
      setEnrolling(false);
      return;
    }
    setQrUri(data.totp.qr_code);
    setFactorId(data.id);
    setEnrolling(false);
  };

  const verifyEnrollment = async () => {
    if (!factorId || verifyCode.length !== 6) return;
    setVerifying(true);
    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeErr) {
      toast({ title: t("portal.common.error"), description: challengeErr.message, variant: "destructive" });
      setVerifying(false);
      return;
    }
    const { error: verifyErr } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: verifyCode });
    if (verifyErr) {
      toast({ title: t("portal.mfa.invalidCode"), description: t("portal.mfa.tryAgain"), variant: "destructive" });
      setVerifying(false);
      return;
    }
    toast({ title: t("portal.mfa.enabled"), description: t("portal.mfa.linkedDesc") });
    setQrUri(null); setFactorId(null); setVerifyCode(""); setVerifying(false);
    loadFactors();
    if (onComplete) onComplete();
  };

  const unenroll = async (id: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) {
      toast({ title: t("portal.common.error"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("portal.mfa.removed") });
    loadFactors();
  };

  if (loading) return <div className="text-muted-foreground">{t("portal.common.loading")}</div>;

  const verifiedFactors = factors.filter((f) => f.factor_type === "totp" && f.status === "verified");

  // Non-admin users: show read-only status
  if (!isAdmin && !inline) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("portal.mfa.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("portal.mfa.subtitle")}</p>
        </div>
        <div className="ks-card p-5">
          {verifiedFactors.length > 0 ? (
            <div>
              <h2 className="font-bold mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-success" /> {t("portal.mfa.mfaEnabled")}
              </h2>
              <div className="space-y-2">
                {verifiedFactors.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 p-3 bg-muted rounded-xl">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium">{f.friendly_name || t("portal.mfa.authenticatorApp")}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="font-bold text-sm">{t("portal.mfa.notConfigured")}</h2>
                <p className="text-muted-foreground text-xs mt-1">{t("portal.mfa.managedByAdmin")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin or inline enrollment flow
  return (
    <div className="space-y-6">
      {!inline && (
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("portal.mfa.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("portal.mfa.requiredDesc")}</p>
        </div>
      )}

      {verifiedFactors.length > 0 && (
        <div className={inline ? "" : "ks-card p-5"}>
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-success" /> {t("portal.mfa.mfaEnabled")}
          </h2>
          <div className="space-y-2">
            {verifiedFactors.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium">{f.friendly_name || t("portal.mfa.authenticatorApp")}</span>
                </div>
                {!inline && isAdmin && (
                  <Button variant="ghost" size="sm" onClick={() => unenroll(f.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {inline && onComplete && (
            <Button variant="hero" className="w-full mt-4" onClick={onComplete}>
              {t("portal.mfa.continuePortal")}
            </Button>
          )}
        </div>
      )}

      {!qrUri && verifiedFactors.length === 0 && (
        <div className={inline ? "" : "ks-card p-5"}>
          {!inline && <h2 className="font-bold mb-2">{t("portal.mfa.twoFactor")}</h2>}
          <p className="text-muted-foreground text-xs mb-4">{t("portal.mfa.addLayer")}</p>
          <Button variant="hero" onClick={startEnroll} disabled={enrolling} className="gap-2">
            {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
            {t("portal.mfa.setupMfa")}
          </Button>
        </div>
      )}

      {qrUri && (
        <div className={`${inline ? "" : "ks-card p-5"} space-y-4`}>
          <h2 className="font-bold">{t("portal.mfa.scanQr")}</h2>
          <p className="text-muted-foreground text-xs">{t("portal.mfa.scanInstructions")}</p>
          <div className="flex justify-center">
            <img src={qrUri} alt="MFA QR Code" className="w-48 h-48 rounded-xl border border-border" />
          </div>
          <div className="ks-field max-w-[200px] mx-auto">
            <label>{t("portal.mfa.verificationCode")}</label>
            <input
              type="text" inputMode="numeric" maxLength={6} placeholder="000000"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="text-center text-lg tracking-widest"
            />
          </div>
          <div className="flex justify-center gap-2">
            {!inline && (
              <Button variant="outline" onClick={() => { setQrUri(null); setFactorId(null); setVerifyCode(""); }}>
                {t("portal.common.cancel")}
              </Button>
            )}
            <Button variant="hero" onClick={verifyEnrollment} disabled={verifyCode.length !== 6 || verifying} className="gap-2">
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {t("portal.mfa.verifyEnable")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MFASetup;
