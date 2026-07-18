import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ShieldCheck, Check, Loader2, CreditCard, Info, AlertTriangle } from "lucide-react";
import { VERIFICATION_FEE, formatEUR } from "@/lib/pricing";
import VerificationBadge from "@/components/VerificationBadge";
import { format, differenceInDays } from "date-fns";
import { de } from "date-fns/locale";

type Tier = "registered" | "verified" | "jugendamt_approved";

const VerifizierungBestellen = () => {
  const { user } = useAuth();
  const [tier, setTier] = useState<Tier>("registered");
  const [verifiedUntil, setVerifiedUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("minder_verification")
        .select("tier, verified_until")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setTier(data.tier as Tier);
        setVerifiedUntil(data.verified_until);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const startCheckout = async () => {
    setCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { price_key: VERIFICATION_FEE.priceKey, mode: "payment" },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      toast({ title: "Fehler", description: msg, variant: "destructive" });
    } finally {
      setCheckingOut(false);
    }
  };

  const daysToExpiry = verifiedUntil ? differenceInDays(new Date(verifiedUntil), new Date()) : null;
  const isExpiringSoon = daysToExpiry !== null && daysToExpiry >= 0 && daysToExpiry <= 45;
  const isExpired = daysToExpiry !== null && daysToExpiry < 0;

  if (loading) return (
    <div className="flex items-center gap-2 text-muted-foreground p-4">
      <Loader2 className="w-4 h-4 animate-spin" /> Verifizierungsstatus wird geladen…
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">KinderStars Verified</h1>
        <p className="text-muted-foreground text-sm">
          Erforderlich, bevor du unbeaufsichtigte Betreuungsanfragen annehmen kannst.
        </p>
      </div>

      <div className="ks-card p-5 flex items-center gap-4 flex-wrap">
        <span className="text-sm text-muted-foreground">Dein aktueller Status:</span>
        <VerificationBadge tier={tier} />
        {verifiedUntil && (
          <span className={`text-xs font-medium ${isExpired ? "text-destructive" : isExpiringSoon ? "text-warning" : "text-muted-foreground"}`}>
            {isExpired ? "Abgelaufen am " : "Gültig bis "}
            {format(new Date(verifiedUntil), "d. MMMM yyyy", { locale: de })}
          </span>
        )}
      </div>

      {(tier === "registered" || isExpired || isExpiringSoon) && (
        <div className={`ks-card p-6 border-2 ${isExpired ? "border-destructive/40 bg-destructive/5" : "border-primary/30 bg-primary/5"}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isExpired ? "bg-destructive/15" : "bg-primary/15"}`}>
              {isExpired ? <AlertTriangle className="w-6 h-6 text-destructive" /> : <ShieldCheck className="w-6 h-6 text-primary" />}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg">
                {isExpired
                  ? "Verifizierung erneuern"
                  : isExpiringSoon
                    ? "Verifizierung läuft bald ab"
                    : "Verifizierung bestellen"}
                {" — "}{formatEUR(VERIFICATION_FEE.amountCents)}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Einmalige Gebühr. Verifiziert-Abzeichen 12 Monate ab Aktivierung.
              </p>

              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Enthaltene Prüfungen:</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {VERIFICATION_FEE.scope.map((s) => (
                    <li key={s} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" /> {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{VERIFICATION_FEE.disclaimer}</span>
              </div>

              <Button
                variant="hero"
                onClick={startCheckout}
                disabled={checkingOut}
                className="gap-2 mt-4"
              >
                {checkingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                {isExpired ? "Jetzt erneuern" : "Verifizierung bestellen"} — {formatEUR(VERIFICATION_FEE.amountCents)}
              </Button>
            </div>
          </div>
        </div>
      )}

      {tier !== "registered" && !isExpired && !isExpiringSoon && (
        <div className="ks-card p-5 border-success/30 bg-success/5">
          <div className="flex items-center gap-3">
            <Check className="w-6 h-6 text-success" />
            <div>
              <p className="font-medium">Deine Verifizierung ist aktiv.</p>
              <p className="text-sm text-muted-foreground">Du kannst Buchungen und Interviews annehmen.</p>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>Rechtlicher Hinweis:</strong> KinderStars Verified ist eine plattforminterne Prüfung. Sie ersetzt keine behördliche
          Erlaubnis nach § 43 SGB VIII (Kindertagespflege-Erlaubnis) und keine Jugendamt-Anerkennung.</p>
        <p>Bei Fragen zu abgelehnten Prüfungen wende dich an <a className="underline" href="mailto:compliance@kinderstars.de">compliance@kinderstars.de</a>.</p>
      </div>
    </div>
  );
};

export default VerifizierungBestellen;