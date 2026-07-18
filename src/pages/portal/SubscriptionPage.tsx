import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { CreditCard, Check, Clock, AlertTriangle, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const PRICES = {
  basic_monthly: "price_1T8rvyFFogsDQVs4CE1cn0Pz",
  basic_annual:  "price_1T8rw6FFogsDQVs4aIIMtR2n",
} as const;

interface SubStatus {
  subscribed: boolean;
  plan: string | null;
  subscription_end: string | null;
  has_training: boolean;
}

const TRIAL_END = new Date("2026-04-30T23:59:59Z");

const SubscriptionPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<SubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
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
      toast({ title: t("portal.subscription.paymentSuccess"), description: t("portal.subscription.subActive") });
      setTimeout(() => checkSubscription(), 2000);
    }
    if (searchParams.get("canceled") === "true") {
      toast({ title: t("portal.subscription.paymentCancelled"), description: t("portal.subscription.noCharge"), variant: "destructive" });
    }
  }, [searchParams, checkSubscription, t]);

  const handleCheckout = async () => {
    if (!user) return;
    setCheckingOut(true);
    try {
      const price_key = annual ? "basic_annual" : "basic_monthly";
      const { data, error } = await supabase.functions.invoke("create-checkout", { body: { price_key } });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: t("portal.common.error"), description: msg, variant: "destructive" });
    } finally {
      setCheckingOut(false);
    }
  };

  const handleManage = async () => {
    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: t("portal.common.error"), description: msg, variant: "destructive" });
    } finally {
      setOpeningPortal(false);
    }
  };

  const trialActive = new Date() < TRIAL_END;
  const isActivePaidPlan = status?.subscribed && status?.plan && !status.plan.startsWith("free");
  const showSubscribeButton = !isActivePaidPlan;

  const planLabel = isActivePaidPlan
    ? status!.plan === "basic_annual" ? t("portal.subscription.annualPlan") : t("portal.subscription.monthlyPlan")
    : trialActive ? t("portal.subscription.freeTrial") : t("portal.subscription.noActivePlan");

  if (loading) return (
    <div className="flex items-center gap-2 text-muted-foreground p-4">
      <Loader2 className="w-4 h-4 animate-spin" /> {t("portal.subscription.checkingSub")}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("portal.subscription.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("portal.subscription.subtitle")}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={checkSubscription} className="gap-1 text-muted-foreground">
          <RefreshCw className="w-3.5 h-3.5" /> {t("portal.common.refresh")}
        </Button>
      </div>

      <div className={`ks-card p-6 ${isActivePaidPlan ? "border-success/30 bg-success/5" : trialActive ? "border-primary/20 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isActivePaidPlan ? "bg-success/15" : trialActive ? "bg-primary/10" : "bg-destructive/15"}`}>
            {isActivePaidPlan ? <Check className="w-6 h-6 text-success" /> : trialActive ? <Clock className="w-6 h-6 text-primary" /> : <AlertTriangle className="w-6 h-6 text-destructive" />}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-lg">{planLabel}</h2>
            {isActivePaidPlan && status?.subscription_end && (
              <p className="text-sm text-muted-foreground">{t("portal.subscription.nextBilling")}: {new Date(status.subscription_end).toLocaleDateString("en-GB")}</p>
            )}
            {!isActivePaidPlan && trialActive && (
              <p className="text-sm text-muted-foreground">{t("portal.subscription.freeAccess")}</p>
            )}
            {!isActivePaidPlan && !trialActive && (
              <p className="text-sm text-destructive font-medium mt-1">{t("portal.subscription.trialEnded")}</p>
            )}
          </div>
          {isActivePaidPlan && (
            <Button variant="outline" size="sm" onClick={handleManage} disabled={openingPortal} className="gap-1.5 shrink-0">
              {openingPortal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
              {t("portal.common.manage")}
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm font-medium ${!annual ? "text-foreground" : "text-muted-foreground"}`}>{t("portal.subscription.monthly")}</span>
        <Switch checked={annual} onCheckedChange={setAnnual} />
        <span className={`text-sm font-medium ${annual ? "text-foreground" : "text-muted-foreground"}`}>
          {t("portal.subscription.annual")} <span className="text-xs text-success font-bold ml-1">{t("portal.subscription.monthsFree")}</span>
        </span>
      </div>

      <div className="ks-card p-5">
        <h2 className="font-bold mb-3">{t("portal.subscription.planDetails")}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border border-border rounded-xl">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("portal.subscription.freeTrial")}</p>
            <p className="text-2xl font-bold">£0</p>
            <p className="text-xs text-muted-foreground mt-1">Until 30 April 2026</p>
            <ul className="text-xs text-muted-foreground mt-3 space-y-1">
              <li className="flex items-center gap-1"><Check className="w-3 h-3 text-success" /> {t("portal.subscription.fullAccess")}</li>
              <li className="flex items-center gap-1"><Check className="w-3 h-3 text-success" /> {t("portal.subscription.acceptShifts")}</li>
              <li className="flex items-center gap-1"><Check className="w-3 h-3 text-success" /> {t("portal.subscription.timesheetsInvoices")}</li>
            </ul>
          </div>
          <div className={`p-4 rounded-xl relative ${isActivePaidPlan ? "border-2 border-success" : "border-2 border-primary"}`}>
            <span className={`absolute -top-2 right-3 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${isActivePaidPlan ? "bg-success text-white" : "bg-primary text-primary-foreground"}`}>
              {isActivePaidPlan ? t("portal.subscription.active") : annual ? t("portal.subscription.bestValue") : t("portal.subscription.afterTrial")}
            </span>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{annual ? t("portal.subscription.annual") : t("portal.subscription.monthly")}</p>
            <p className="text-2xl font-bold">
              {annual ? <>£49.90<span className="text-sm font-normal text-muted-foreground">{t("portal.subscription.perYear")}</span></> : <>£4.99<span className="text-sm font-normal text-muted-foreground">{t("portal.subscription.perMonth")}</span></>}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {annual ? `£4.16${t("portal.subscription.perMonth")} ${t("portal.subscription.effective")} — ${t("portal.subscription.save")} £9.98` : t("portal.subscription.cancelAnytime")}
            </p>
            <ul className="text-xs text-muted-foreground mt-3 space-y-1">
              <li className="flex items-center gap-1"><Check className="w-3 h-3 text-success" /> {t("portal.subscription.everythingFree")}</li>
              <li className="flex items-center gap-1"><Check className="w-3 h-3 text-success" /> {t("portal.subscription.priorityShifts")}</li>
              <li className="flex items-center gap-1"><Check className="w-3 h-3 text-success" /> {t("portal.subscription.performanceInsights")}</li>
            </ul>
          </div>
        </div>
      </div>

      {showSubscribeButton && (
        <Button variant="hero" onClick={handleCheckout} disabled={checkingOut} className="gap-2 w-full">
          {checkingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          {t("portal.subscription.subscribe")} — {annual ? "£49.90/year" : "£4.99/month"}
        </Button>
      )}

      {isActivePaidPlan && (
        <Button variant="outline" onClick={handleManage} disabled={openingPortal} className="gap-2 w-full">
          {openingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
          {t("portal.subscription.manageBilling")}
        </Button>
      )}
    </div>
  );
};

export default SubscriptionPage;
