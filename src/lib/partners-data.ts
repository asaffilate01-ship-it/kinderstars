export type PartnerCategory =
  | "insurance"
  | "tax"
  | "payroll"
  | "pension"
  | "translation"
  | "first_aid"
  | "legal";

export const PARTNER_CATEGORIES: { id: PartnerCategory; label: string; description: string }[] = [
  { id: "insurance",   label: "Versicherung",           description: "Berufshaftpflicht, Unfall, Rechtsschutz" },
  { id: "tax",         label: "Steuerberatung",         description: "Einkommensteuer, Betriebsausgaben" },
  { id: "payroll",     label: "Lohn & Gehalt",          description: "Lohnabrechnung für Nanny-Anstellungen" },
  { id: "pension",     label: "Altersvorsorge",         description: "Rürup, Riester, private Vorsorge" },
  { id: "translation", label: "Übersetzung",            description: "Beglaubigte Übersetzungen von Zeugnissen" },
  { id: "first_aid",   label: "Erste Hilfe",            description: "Erste-Hilfe-am-Kind-Kurse" },
  { id: "legal",       label: "Rechtsberatung",         description: "Familien- und Arbeitsrecht" },
];

export interface Partner {
  id: string;
  name: string;
  category: PartnerCategory;
  tagline: string;
  description: string;
  url: string;
  region: string;
}

export const PARTNERS: Partner[] = [
  {
    id: "vhv-berufshaftpflicht",
    name: "VHV Versicherungen",
    category: "insurance",
    tagline: "Berufshaftpflicht für Kindertagespflege",
    description: "Spezielle Tarife für Tagespflegepersonen inkl. Schäden am Kind und in der Wohnung.",
    url: "https://www.vhv.de/",
    region: "Deutschlandweit",
  },
  {
    id: "hdi-unfall",
    name: "HDI Kinder-Unfallversicherung",
    category: "insurance",
    tagline: "Kinder-Unfallversicherung",
    description: "Absicherung von Tageskindern gegen Unfallfolgen — auf Wunsch als Gruppentarif.",
    url: "https://www.hdi.de/",
    region: "Deutschlandweit",
  },
  {
    id: "arag-rechtsschutz",
    name: "ARAG Rechtsschutz",
    category: "insurance",
    tagline: "Berufsrechtsschutz",
    description: "Rechtsschutz für Streitigkeiten mit Eltern, Jugendamt oder Behörden.",
    url: "https://www.arag.de/",
    region: "Deutschlandweit",
  },
  {
    id: "smartsteuer",
    name: "smartsteuer",
    category: "tax",
    tagline: "Online-Steuererklärung",
    description: "Einfache Anlage EÜR und S für selbstständige Kindertagespflegepersonen.",
    url: "https://www.smartsteuer.de/",
    region: "Deutschlandweit",
  },
  {
    id: "wundertax",
    name: "wundertax",
    category: "tax",
    tagline: "Steuererklärung für Selbstständige",
    description: "Digitale Steuererklärung mit Fokus auf freiberufliche Tätigkeiten.",
    url: "https://www.wundertax.de/",
    region: "Deutschlandweit",
  },
  {
    id: "lexoffice-payroll",
    name: "lexoffice Lohn & Gehalt",
    category: "payroll",
    tagline: "Lohnabrechnung für Minijob & Angestellte",
    description: "Rechtssichere Abrechnung für Familien, die eine Nanny anstellen (Haushaltsscheck-Alternative).",
    url: "https://www.lexoffice.de/",
    region: "Deutschlandweit",
  },
  {
    id: "minijob-zentrale",
    name: "Minijob-Zentrale (Haushaltsscheck)",
    category: "payroll",
    tagline: "Offizielle Anmeldung",
    description: "Anmeldung einer Nanny im Privathaushalt über das Haushaltsscheck-Verfahren.",
    url: "https://www.minijob-zentrale.de/",
    region: "Deutschlandweit",
  },
  {
    id: "swisslife-ruerup",
    name: "Swiss Life Rürup",
    category: "pension",
    tagline: "Basisrente für Selbstständige",
    description: "Steuerlich geförderte Altersvorsorge für Kindertagespflegepersonen.",
    url: "https://www.swisslife.de/",
    region: "Deutschlandweit",
  },
  {
    id: "bdue-uebersetzer",
    name: "BDÜ — Bundesverband der Dolmetscher und Übersetzer",
    category: "translation",
    tagline: "Beglaubigte Übersetzungen",
    description: "Verzeichnis vereidigter Übersetzer:innen für ausländische Zeugnisse und Führungszeugnisse.",
    url: "https://www.bdue.de/",
    region: "Deutschlandweit",
  },
  {
    id: "drk-erste-hilfe",
    name: "Deutsches Rotes Kreuz",
    category: "first_aid",
    tagline: "Erste Hilfe am Kind (9 UE)",
    description: "Anerkannte Erste-Hilfe-Kurse für Kindertagespflegepersonen an über 400 Standorten.",
    url: "https://www.drk.de/",
    region: "Deutschlandweit",
  },
  {
    id: "malteser-erste-hilfe",
    name: "Malteser Hilfsdienst",
    category: "first_aid",
    tagline: "Erste Hilfe am Kind",
    description: "9-UE-Kurse mit Fokus auf Notfälle im Kleinkindalter.",
    url: "https://www.malteser.de/",
    region: "Deutschlandweit",
  },
  {
    id: "advocard-familienrecht",
    name: "Fachanwaltssuche — Deutscher Anwaltverein",
    category: "legal",
    tagline: "Familien- und Arbeitsrecht",
    description: "Verzeichnis von Fachanwält:innen für familien- und arbeitsrechtliche Fragen der Kinderbetreuung.",
    url: "https://anwaltauskunft.de/",
    region: "Deutschlandweit",
  },
];