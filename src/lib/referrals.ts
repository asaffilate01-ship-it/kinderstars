// Referral bounty configuration (EUR cents)
export const REFERRAL_BOUNTIES = {
  minder_verification_purchase: 2500, // €25 when referred minder buys KinderStars Verified (€79)
  parent_first_booking: 1000,          // €10 when referred parent completes their first paid booking
  signup: 0,                            // signup alone doesn't pay
} as const;

export type ReferralTrigger = keyof typeof REFERRAL_BOUNTIES;

export function bountyLabel(trigger: string): string {
  switch (trigger) {
    case "minder_verification_purchase":
      return "Verifizierung (€25)";
    case "parent_first_booking":
      return "Erste Buchung (€10)";
    case "signup":
      return "Registrierung";
    default:
      return trigger;
  }
}

/** Generate a short, human-readable referral code from a user id. */
export function makeReferralCode(userId: string): string {
  const slug = userId.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `KS-${slug}`;
}

export function referralLink(code: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://kinderstars.de";
  return `${origin}/auth?ref=${encodeURIComponent(code)}`;
}

/** Persist a referral code seen in the URL so we can attribute after sign-up. */
export function captureReferralFromUrl() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref) {
    try { localStorage.setItem("ks_ref", ref); } catch {}
  }
}

export function popReferral(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem("ks_ref");
    if (v) localStorage.removeItem("ks_ref");
    return v;
  } catch { return null; }
}

export type InsuranceStatus = "valid" | "grace" | "expired" | "missing";

export function describeInsuranceStatus(status: InsuranceStatus, graceUntil?: string | null): {
  label: string; tone: "success" | "warning" | "destructive" | "muted"; blurb: string;
} {
  switch (status) {
    case "valid":
      return { label: "Berufshaftpflicht gültig", tone: "success", blurb: "Ihre Haftpflichtversicherung ist geprüft und gültig." };
    case "grace":
      return {
        label: "Ablaufkulanz aktiv",
        tone: "warning",
        blurb: `Ihre Berufshaftpflicht ist abgelaufen. Bitte bis ${graceUntil ?? "in Kürze"} verlängern, sonst werden Sie aus der Suche entfernt.`,
      };
    case "expired":
      return { label: "Berufshaftpflicht abgelaufen", tone: "destructive", blurb: "Ihre Buchungen sind pausiert, bis eine gültige Police hochgeladen wurde." };
    case "missing":
      return { label: "Berufshaftpflicht fehlt", tone: "destructive", blurb: "Nach § 43 SGB VIII empfohlen. Bitte Police und Ablaufdatum hinterlegen." };
  }
}