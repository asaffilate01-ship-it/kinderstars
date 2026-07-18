import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface SubStatus {
  subscribed: boolean;
  plan: string | null;
  subscription_end: string | null;
  has_training: boolean;
  loading: boolean;
  trialActive: boolean;
  canWork: boolean; // trial still active OR paid subscription
}

const TRIAL_END = new Date("2026-04-30T23:59:59Z");

export function useSubscription() {
  const { user, userRole } = useAuth();
  const [status, setStatus] = useState<SubStatus>({
    subscribed: false,
    plan: null,
    subscription_end: null,
    has_training: false,
    loading: true,
    trialActive: new Date() < TRIAL_END,
    canWork: new Date() < TRIAL_END,
  });

  const check = useCallback(async () => {
    if (!user || userRole === "admin" || userRole === "owner") {
      setStatus(s => ({ ...s, loading: false, canWork: true }));
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      const d = data as Omit<SubStatus, "loading" | "trialActive" | "canWork">;
      const trialActive = new Date() < TRIAL_END;
      setStatus({
        ...d,
        loading: false,
        trialActive,
        canWork: trialActive || !!d.subscribed,
      });
    } catch {
      const trialActive = new Date() < TRIAL_END;
      setStatus({ subscribed: false, plan: null, subscription_end: null, has_training: false, loading: false, trialActive, canWork: trialActive });
    }
  }, [user, userRole]);

  useEffect(() => {
    check();
    // Refresh every 5 minutes
    const interval = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [check]);

  return { ...status, refresh: check };
}
