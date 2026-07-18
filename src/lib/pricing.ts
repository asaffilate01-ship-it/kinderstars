/**
 * KinderStars DE — central pricing catalogue.
 * All amounts in EUR (cents). Format with `formatEUR()` for consistent
 * `de-DE` currency display across the app.
 */

export const eur = (cents: number) => cents / 100;

export const formatEUR = (cents: number, opts?: { withPeriod?: "month" | "year" }) => {
  const value = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(eur(cents));
  if (!opts?.withPeriod) return value;
  return `${value}/${opts.withPeriod === "month" ? "Monat" : "Jahr"}`;
};

export type SubscriptionPlanId =
  | "free"
  | "compliance_plus"
  | "professional_compliance";

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  tagline: string;
  monthlyCents: number;
  annualCents: number;
  priceKeyMonthly?: string; // matches supabase/functions/create-checkout PRICES
  priceKeyAnnual?: string;
  features: string[];
  recommended?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "KinderStars Frei",
    tagline: "Kostenlose Registrierung",
    monthlyCents: 0,
    annualCents: 0,
    features: [
      "Profil erstellen",
      "Basisregistrierung",
      "Sichtbar im Verzeichnis nach Verifizierung",
      "Keine unbeaufsichtigten Buchungen ohne KinderStars Verified",
    ],
  },
  {
    id: "compliance_plus",
    name: "Compliance Plus",
    tagline: "Für aktive Kindertagespflegepersonen",
    monthlyCents: 1499,
    annualCents: 14900,
    priceKeyMonthly: "compliance_plus_monthly",
    priceKeyAnnual: "compliance_plus_annual",
    features: [
      "Sichere Dokumentenablage",
      "Erinnerungen für Zertifikate & Führungszeugnis",
      "Jährliche Kinderschutz-Auffrischung",
      "Jährliche Profilprüfung",
      "Digitale Compliance-Akte",
      "Rechnungs- und Einnahmenberichte",
      "Fortbildungs-Logbuch",
    ],
  },
  {
    id: "professional_compliance",
    name: "Professional Compliance",
    tagline: "Volle Akademie + Jugendamt-Vorbereitung",
    monthlyCents: 2999,
    annualCents: 29900,
    priceKeyMonthly: "professional_compliance_monthly",
    priceKeyAnnual: "professional_compliance_annual",
    recommended: true,
    features: [
      "Alles aus Compliance Plus",
      "Voller Zugang zur KinderStars Akademie",
      "Vorrangige Dokumentenprüfungen",
      "Persönlicher Compliance-Pfad",
      "Jugendamt-Ready Dokumentenvorbereitung",
      "Rabatte bei externen Kursen",
      "Bevorzugte Profil-Promotion",
    ],
  },
];

export const VERIFICATION_FEE = {
  priceKey: "verification_fee",
  amountCents: 7900, // €79
  scope: [
    "Identitäts- und Adressprüfung",
    "Prüfung der Arbeitserlaubnis",
    "Zwei Referenzchecks",
    "Videointerview",
    "Prüfung der Qualifikationen",
    "Kinderschutz-Einführung",
    "Compliance-Profil",
    "Verifiziert-Abzeichen für 12 Monate",
  ],
  disclaimer:
    "Die Gebühr ist für Verifizierung und Verwaltung. KinderStars stellt keine staatliche Freigabe (z. B. Jugendamt-Anerkennung) aus und garantiert keine Aufträge.",
};

export const JUGENDAMT_READY = {
  assessmentPriceKey: "jugendamt_ready_assessment",
  assessmentAmountCents: 14900, // €149
  monitoringBasicPriceKey: "jugendamt_ready_monitor_basic",
  monitoringBasicMonthlyCents: 1999,
  monitoringProPriceKey: "jugendamt_ready_monitor_pro",
  monitoringProMonthlyCents: 2999,
};

export const FIRST_AID = {
  seatPriceKey: "first_aid_seat",
  seatPriceCents: 6900, // €69 per seat
  refresherMonths: 24,
  refresherReminderMonths: 22,
};
