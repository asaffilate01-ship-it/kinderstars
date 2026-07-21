import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { describeInsuranceStatus, type InsuranceStatus } from "@/lib/referrals";

/**
 * Berufshaftpflicht status banner for childminders.
 * Shows a warning during the 30-day grace period, blocks bookings after expiry.
 * Compact = renders as a small pill; otherwise full banner.
 */
export default function InsuranceStatusBanner({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const [row, setRow] = useState<{ status: InsuranceStatus; grace_until: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("v_childminder_insurance_status")
        .select("status, grace_until")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setRow(data as any);
    })();
  }, [user]);

  if (!row) return null;
  const info = describeInsuranceStatus(row.status, row.grace_until);
  if (row.status === "valid") {
    if (compact) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-success">
          <ShieldCheck className="w-3 h-3" /> Haftpflicht gültig
        </span>
      );
    }
    return null;
  }

  const toneClass =
    info.tone === "destructive" ? "bg-destructive/10 border-destructive/30 text-destructive"
    : info.tone === "warning" ? "bg-warning/10 border-warning/40 text-warning-foreground"
    : "bg-muted border-muted";

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${toneClass}`}>
        <ShieldAlert className="w-3 h-3" /> {info.label}
      </span>
    );
  }

  return (
    <div className={`rounded-lg border p-3 flex items-start gap-3 ${toneClass}`}>
      <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm">
        <p className="font-semibold">{info.label}</p>
        <p className="text-xs opacity-90 mt-0.5">{info.blurb}</p>
      </div>
      <Link to="/childminder/profile" className="text-xs underline shrink-0 self-center">
        Aktualisieren
      </Link>
    </div>
  );
}