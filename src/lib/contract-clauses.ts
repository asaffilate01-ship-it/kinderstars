export type ContractType = "sfe_ccg" | "la_funded" | "employer" | "private" | "childminder";

export interface ContractData {
  parentName: string;
  parentAddress: string;
  parentPostcode: string;
  parentEmail: string;
  parentPhone: string;
  childName: string;
  childDob: string;
  childminderName: string;
  fundingRef: string;
  localAuthority: string;
  employerName: string;
  hoursPerWeek: string;
  ratePerHour: string;
  startDate: string;
  expiresAt: string;
  notes: string;
}

export const CONTRACT_TYPES: { value: ContractType; label: string; desc: string }[] = [
  { value: "sfe_ccg", label: "§ 23 SGB VIII — Jugendamt-Förderung", desc: "Kindertagespflege gefördert nach § 23 SGB VIII (Bewilligungsbescheid des Jugendamts)" },
  { value: "la_funded", label: "Jugendamt-Kostenübernahme", desc: "Vollständige oder teilweise Kostenübernahme durch das Jugendamt" },
  { value: "employer", label: "Arbeitgeberzuschuss (§ 3 Nr. 33 EStG)", desc: "Steuerfreier Kinderbetreuungszuschuss des Arbeitgebers" },
  { value: "private", label: "Selbstzahler / Privat", desc: "Private Zahlungsvereinbarung zwischen Eltern und KinderStars" },
  { value: "childminder", label: "Vertrag mit Kindertagespflegeperson", desc: "Vereinbarung zwischen KinderStars und der Kindertagespflegeperson" },
];

export const defaultContractData: ContractData = {
  parentName: "", parentAddress: "", parentPostcode: "", parentEmail: "", parentPhone: "",
  childName: "", childDob: "", childminderName: "", fundingRef: "", localAuthority: "",
  employerName: "", hoursPerWeek: "", ratePerHour: "", startDate: "", expiresAt: "", notes: "",
};

export function getContractClauses(type: ContractType, data: ContractData) {
  const hoursText = data.hoursPerWeek ? `${data.hoursPerWeek} Stunden pro Woche` : "die vereinbarten Betreuungsstunden";
  const rateText = data.ratePerHour ? `${data.ratePerHour} € pro Stunde` : "den vereinbarten Stundensatz";
  const startText = data.startDate ? new Date(data.startDate).toLocaleDateString("de-DE") : "dem vereinbarten Datum";

  const common = [
    { title: "Vertragsparteien", body: `Dieser Vertrag wird geschlossen zwischen KinderStars DE („die Plattform") und ${data.parentName || "der genannten Vertragspartei"} („${type === "childminder" ? "die Kindertagespflegeperson" : "die Eltern / Sorgeberechtigten"}").` },
    { title: "Vertragsbeginn", body: `Der Vertrag beginnt am ${startText} und läuft bis zur Kündigung durch eine der Parteien mit einer Frist von 4 Wochen in Textform.` },
  ];

  if (type === "childminder") {
    return [
      ...common,
      { title: "Selbstständige Tätigkeit", body: `Die Kindertagespflegeperson erbringt ihre Leistungen als selbstständige Kindertagespflegeperson im Sinne von § 22 SGB VIII. KinderStars DE tritt ausschließlich als Vermittlungs- und Verwaltungsplattform auf; es entsteht kein Arbeits- oder Beschäftigungsverhältnis (§ 296 SGB III). Die Vergütung beträgt ${rateText} für ${hoursText}.` },
      { title: "Pflichten", body: "Die Kindertagespflegeperson erbringt die Betreuung eigenverantwortlich unter Beachtung des SGB VIII, hält eine gültige Pflegeerlaubnis nach § 43 SGB VIII, ein aktuelles erweitertes Führungszeugnis (§ 30a BZRG), Erste-Hilfe-Ausbildung am Kind, Belehrung nach § 43 IfSG sowie eine Berufshaftpflichtversicherung vor." },
      { title: "Zahlung", body: "Die Auszahlung erfolgt monatlich per SEPA-Überweisung auf Grundlage der freigegebenen Leistungsnachweise. Zahlungsziel: 14 Tage nach Freigabe." },
      { title: "Compliance", body: "Die Kindertagespflegeperson gewährleistet durchgängig die Gültigkeit von Pflegeerlaubnis, erweitertem Führungszeugnis, Erste-Hilfe-Nachweis und Haftpflichtversicherung und legt diese auf Verlangen vor." },
      { title: "Vertraulichkeit & Datenschutz", body: "Die Kindertagespflegeperson wahrt strikte Vertraulichkeit über alle Familien-, Kinder- und Geschäftsdaten und verarbeitet personenbezogene Daten nach DSGVO." },
      { title: "Kündigung", body: "Beide Parteien können mit einer Frist von 4 Wochen in Textform kündigen. KinderStars behält sich die außerordentliche Kündigung bei groben Pflichtverletzungen oder Kinderschutz­bedenken (§ 8a SGB VIII) vor." },
    ];
  }

  const paymentClause = type === "sfe_ccg"
    ? `Die Betreuungskosten werden nach § 23 SGB VIII durch das zuständige Jugendamt gefördert${data.fundingRef ? ` (Bewilligungsbescheid: ${data.fundingRef})` : ""}. Rechnungen werden über KinderStars DE ausgestellt. Die Eltern verpflichten sich, die Fördervoraussetzungen aufrechtzuerhalten und Änderungen unverzüglich mitzuteilen.`
    : type === "la_funded"
    ? `Die Betreuung erfolgt im Rahmen der Kostenübernahme durch das ${data.localAuthority || "zuständige Jugendamt"} nach § 23 SGB VIII. KinderStars DE rechnet die geförderten Stunden direkt mit dem Jugendamt ab. Über den Förderumfang hinausgehende Stunden werden den Eltern mit ${rateText} in Rechnung gestellt.`
    : type === "employer"
    ? `Die Betreuungskosten werden ganz oder teilweise durch den Arbeitgeber der Eltern${data.employerName ? ` (${data.employerName})` : ""} als steuerfreier Zuschuss nach § 3 Nr. 33 EStG übernommen. KinderStars DE rechnet direkt mit dem Arbeitgeber ab; verbleibende Restbeträge werden den Eltern in Rechnung gestellt.`
    : `Die Eltern verpflichten sich zur Zahlung von ${rateText} für ${hoursText} an KinderStars DE. Rechnungen werden monatlich ausgestellt und sind innerhalb von 14 Tagen fällig. 20 % der Kinderbetreuungskosten (max. 4.000 € pro Jahr und Kind) können als Sonderausgabe steuerlich geltend gemacht werden (§ 10 Abs. 1 Nr. 5 EStG).`;

  return [
    ...common,
    { title: "Kind", body: `Dieser Vertrag umfasst die Betreuung von ${data.childName || "dem/der genannten Kind(ern)"}${data.childDob ? `, geboren am ${new Date(data.childDob).toLocaleDateString("de-DE")}` : ""}.` },
    { title: "Leistungen", body: `KinderStars DE vermittelt ${hoursText} Kindertagespflege durch eine geeignete Kindertagespflegeperson${data.childminderName ? ` (${data.childminderName})` : ""} mit gültiger Pflegeerlaubnis nach § 43 SGB VIII. Die Betreuung erfolgt gemäß der individuellen Vereinbarung (regulär, Rand- und Ferienzeiten).` },
    { title: "Zahlung & Rechnung", body: paymentClause },
    { title: "Rolle der Plattform", body: "KinderStars DE ist eine Vermittlungs- und Verwaltungsplattform im Sinne des § 296 SGB III. Der Betreuungsvertrag im engeren Sinne kommt zwischen Eltern und der selbstständigen Kindertagespflegeperson zustande; KinderStars DE übernimmt Abwicklung, Zahlungsverwaltung und Compliance-Unterstützung." },
    { title: "Kinderschutz", body: "Alle über KinderStars vermittelten Kindertagespflegepersonen verfügen über gültige Pflegeerlaubnis (§ 43 SGB VIII), erweitertes Führungszeugnis (§ 30a BZRG), Erste-Hilfe-Ausbildung am Kind, Belehrung nach § 43 IfSG, Fortbildung Kinderschutz (§ 8a SGB VIII) sowie Berufshaftpflichtversicherung." },
    { title: "Kündigung & Absagen", body: "Beide Parteien können mit einer Frist von 4 Wochen in Textform kündigen. Kurzfristige Absagen einzelner Termine müssen mindestens 48 Stunden vorher erfolgen; verspätete Absagen können in voller Höhe berechnet werden." },
    { title: "Datenschutz (DSGVO)", body: "KinderStars DE verarbeitet personenbezogene Daten nach DSGVO und BDSG ausschließlich zur Erbringung der Betreuungsleistungen und zur Erfüllung gesetzlicher Pflichten. Rechtsgrundlage: Art. 6 Abs. 1 lit. b und c DSGVO." },
  ];
}
