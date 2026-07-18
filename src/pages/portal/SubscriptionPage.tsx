import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { CreditCard, Check, Loader2, RefreshCw, ExternalLink, ShieldCheck, Star, Info } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { SUBSCRIPTION_PLANS, VERIFICATION_FEE, formatEUR, type SubscriptionPlan } from "@/lib/pricing";

interface SubStatus {
  subscribed: boolean;
  plan: string | null;
  subscription_end: string | null;
  has_training: boolean;
}

const SubscriptionPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<SubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOutKey, setCheckingOutKey] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [annual, setAnnual] = useState(false);

  const checkSubscription = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setStatus(data as SubStatus);
    } catch (err) {
      console.error("check-subscription error:", err);
      setStatus({ subscribed: false, plan: null, subscription_end: null, has_training: false });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { checkSubscription(); }, [checkSubscription]);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({ title: "Zahlung erfolgreich", description: "Dein Abo wird gleich aktiviert." });
      setTimeout(() => checkSubscription(), 2000);
    }
    if (searchParams.get("canceled") === "true") {
      toast({ title: "Zahlung abgebrochen", description: "Es wurde nichts belastet.", variant: "destructive" });
    }
  }, [searchParams, checkSubscription]);

  const startCheckout = async (price_key: string) => {
    if (!user) return;
    setCheckingOutKey(price_key);
    try {
      const body: Record<string, string> = { price_key };
      if (price_key === VERIFICATION_FEE.priceKey) body.mode = "payment";
      const { data, error } = await supabase.functions.invoke("create-checkout", { body });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      toast({ title: "Fehler", description: msg, variant: "destructive" });
    } finally {
      setCheckingOutKey(null);
    }
  };

  const handleManage = async () => {
    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      toast({ title: "Fehler", description: msg, variant: "destructive" });
    } finally {
      setOpeningPortal(false);
    }
  };

  const activePlanId = status?.subscribed ? status?.plan : null;

  if (loading) return (
    <div className="flex items-center gap-2 text-muted-foreground p-4">
      <Loader2 className="w-4 h-4 animate-spin" /> Abo wird geprüft…
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Abo-Pakete</h1>
          <p className="text-muted-foreground text-sm">
            Wähle dein KinderStars Compliance-Paket. Alle Preise in EUR, inkl. gesetzlicher USt.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={checkSubscription} className="gap-1 text-muted-foreground">
          <RefreshCw className="w-3.5 h-3.5" /> Aktualisieren
        </Button>
      </div>

      {/* Verification one-off */}
      <div className="ks-card p-6 border-2 border-primary/30 bg-primary/5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-lg">KinderStars Verified — {formatEUR(VERIFICATION_FEE.amountCents)}</h2>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary text-primary-foreground">Einmalig</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Erforderlich, bevor du unbeaufsichtigte Kinderbetreuung buchen kannst. Verifizierungs-Abzeichen für 12 Monate.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-3">
              {VERIFICATION_FEE.scope.map((s) => (
                <li key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="w-3 h-3 text-success shrink-0" /> {s}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{VERIFICATION_FEE.disclaimer}</span>
            </div>
            <Button
              variant="hero"
              onClick={() => startCheckout(VERIFICATION_FEE.priceKey)}
              disabled={checkingOutKey === VERIFICATION_FEE.priceKey}
              className="gap-2 mt-4"
            >
              {checkingOutKey === VERIFICATION_FEE.priceKey
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <CreditCard className="w-4 h-4" />}
              Verifizierung bestellen — {formatEUR(VERIFICATION_FEE.amountCents)}
            </Button>
          </div>
        </div>
      </div>

      {/* Billing period toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm font-medium ${!annual ? "text-foreground" : "text-muted-foreground"}`}>Monatlich</span>
        <Switch checked={annual} onCheckedChange={setAnnual} />
        <span className={`text-sm font-medium ${annual ? "text-foreground" : "text-muted-foreground"}`}>
          Jährlich <span className="text-xs text-success font-bold ml-1">(2 Monate gratis)</span>
        </span>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            annual={annual}
            isActive={activePlanId === plan.priceKeyMonthly || activePlanId === plan.priceKeyAnnual}
            onSubscribe={startCheckout}
            loadingKey={checkingOutKey}
          />
        ))}
      </div>

      {status?.subscribed && (
        <Button variant="outline" onClick={handleManage} disabled={openingPortal} className="gap-2 w-full">
          {openingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
          Rechnungen & Abo verwalten
        </Button>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Preise inkl. gesetzlicher Umsatzsteuer. Kündigung jederzeit zum Ende der Laufzeit. KinderStars ist ein lizenzierter Marktplatz und keine
        Arbeitsvermittlung im Sinne von § 296 SGB III.
      </p>
    </div>
  );
};

interface PlanCardProps {
  plan: SubscriptionPlan;
  annual: boolean;
  isActive: boolean;
  onSubscribe: (key: string) => void;
  loadingKey: string | null;
}

const PlanCard = ({ plan, annual, isActive, onSubscribe, loadingKey }: PlanCardProps) => {
  const isFree = plan.id === "free";
  const priceKey = annual ? plan.priceKeyAnnual : plan.priceKeyMonthly;
  const amountCents = annual ? plan.annualCents : plan.monthlyCents;
  const period = annual ? "year" : "month";
  const monthlyEquivalent = annual && plan.annualCents > 0
    ? Math.round(plan.annualCents / 12)
    : null;

  return (
    <div
      className={`p-5 rounded-xl relative flex flex-col ${
        isActive
          ? "border-2 border-success bg-success/5"
          : plan.recommended
            ? "border-2 border-primary bg-primary/5"
            : "border border-border bg-background"
      }`}
    >
      {isActive ? (
        <span className="absolute -top-2 right-3 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-success text-white">Aktiv</span>
      ) : plan.recommended ? (
        <span className="absolute -top-2 right-3 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary text-primary-foreground flex items-center gap-1">
          <Star className="w-3 h-3" /> Empfohlen
        </span>
      ) : null}

      <p className="text-xs text-muted-foreground uppercase tracking-wider">{plan.tagline}</p>
      <h3 className="font-bold text-lg mt-1">{plan.name}</h3>

      <p className="text-3xl font-bold mt-3">
        {isFree ? "€0" : formatEUR(amountCents)}
        {!isFree && (
          <span className="text-sm font-normal text-muted-foreground"> / {period === "year" ? "Jahr" : "Monat"}</span>
        )}
      </p>
      {monthlyEquivalent && (
        <p className="text-xs text-muted-foreground mt-1">
          Entspricht {formatEUR(monthlyEquivalent)}/Monat
        </p>
      )}
      {isFree && <p className="text-xs text-muted-foreground mt-1">Immer kostenlos</p>}

      <ul className="text-sm text-muted-foreground mt-4 space-y-1.5 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-1.5">
            <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" /> <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        {isFree ? (
          <Button variant="outline" disabled className="w-full">
            Standardmäßig aktiv
          </Button>
        ) : isActive ? (
          <Button variant="outline" disabled className="w-full gap-2">
            <Check className="w-4 h-4" /> Aktuelles Abo
          </Button>
        ) : (
          <Button
            variant={plan.recommended ? "hero" : "default"}
            className="w-full gap-2"
            disabled={!priceKey || loadingKey === priceKey}
            onClick={() => priceKey && onSubscribe(priceKey)}
          >
            {loadingKey === priceKey
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <CreditCard className="w-4 h-4" />}
            {plan.name} abonnieren
          </Button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage;
