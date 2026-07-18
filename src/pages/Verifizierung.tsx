import { Link } from "react-router-dom";
import { ArrowLeft, ShieldQuestion, ShieldCheck, BadgeCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import VerificationBadge from "@/components/VerificationBadge";

const Section = ({
  tier,
  title,
  intro,
  items,
  disclaimer,
}: {
  tier: "registered" | "verified" | "jugendamt_approved";
  title: string;
  intro: string;
  items: string[];
  disclaimer: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center gap-3">
      <VerificationBadge tier={tier} />
      <CardTitle className="text-xl">{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-muted-foreground">{intro}</p>
      <ul className="list-disc pl-5 space-y-1 text-sm">
        {items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
      <p className="text-xs italic text-muted-foreground border-l-2 border-border pl-3">
        {disclaimer}
      </p>
    </CardContent>
  </Card>
);

const Verifizierung = () => (
  <div className="min-h-screen bg-background">
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Zurück
      </Link>
      <h1 className="text-3xl md:text-4xl font-bold mb-3">
        Die drei KinderStars-Verifizierungsstufen
      </h1>
      <p className="text-muted-foreground mb-8 max-w-2xl">
        In Deutschland gibt es keine zentrale Aufsichtsbehörde für private
        Kinderbetreuung im Haushalt der Eltern. Verantwortlich sind – je nach
        Bereich – Jugendamt, Landesjugendamt, Bundesamt für Justiz, Rentenversicherung,
        Berufsgenossenschaft und Landesdatenschutzbehörde. KinderStars kennzeichnet
        Betreuungspersonen daher in drei klar getrennten Stufen.
      </p>

      <div className="grid gap-6">
        <Section
          tier="registered"
          title="Stufe 1 – KinderStars Registriert"
          intro="Minimalvoraussetzungen, um überhaupt ein Profil anzulegen."
          items={[
            "Identität geprüft",
            "Deutsche Adresse geprüft",
            "Aufenthalts- und Arbeitserlaubnis geprüft",
            "Telefon und E-Mail verifiziert",
            "Basisprofil ausgefüllt",
            "Plattform-AGB akzeptiert",
            "Kinderschutz-Erklärung unterschrieben",
          ]}
          disclaimer="Registrierte Betreuungspersonen erscheinen noch nicht als vollständig verifiziert."
        />

        <Section
          tier="verified"
          title="Stufe 2 – KinderStars Verifiziert"
          intro="Erforderlich, bevor reguläre private Buchungen angenommen werden dürfen."
          items={[
            "Erweitertes Führungszeugnis geprüft",
            "Zwei Referenzen geprüft",
            "Identität und Arbeitserlaubnis verifiziert",
            "Persönliches Video-Interview",
            "KinderStars-Kinderschutzeinführung",
            "Grundlagen-Wissenstest Kinderbetreuung",
            "Erste-Hilfe-Kurs am Kind (gültig oder terminiert)",
            "Schulung Notfallverfahren",
            "Erklärung zu Erfahrung und Qualifikation",
            "Informationen zu Versicherung und Status",
            "Unterzeichneter Verhaltenskodex",
          ]}
          disclaimer="Dies ist ein privater KinderStars-Qualitätsstandard – keine behördliche Zulassung."
        />

        <Section
          tier="jugendamt_approved"
          title="Stufe 3 – Jugendamt Approved"
          intro="Nur für potenziell öffentlich geförderte Kindertagespflege gemäß §23 SGB VIII."
          items={[
            "Eignung durch das zuständige Jugendamt bestätigt",
            "Kommunale Qualifikationsanforderungen erfüllt",
            "Erste Hilfe am Kind gültig",
            "Erweitertes Führungszeugnis vom Jugendamt akzeptiert",
            "Anerkannte Qualifizierung (z. B. QHB) dokumentiert",
            "Fortlaufende Fortbildung (CPD) dokumentiert",
            "Steuerliche und sozialversicherungsrechtliche Regelung dokumentiert",
            "Kommune und Gültigkeitszeitraum ausgewiesen",
            "Erlaubte Betreuungskategorien hinterlegt",
          ]}
          disclaimer='"Jugendamt Approved" wird erst nach dokumentierter Bestätigung des Jugendamts angezeigt. "Jugendamt Ready" (Vorbereitungspaket) ist ausdrücklich nicht dasselbe wie "Jugendamt Approved".'
        />
      </div>

      <div className="mt-10 rounded-lg border p-5 bg-muted/30 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">Wichtig:</strong> KinderStars ist keine
          staatliche Aufsichts- oder Zulassungsbehörde. „KinderStars Verifiziert"
          bedeutet, dass wir gegen unseren internen Standard geprüft haben.
          „Jugendamt Approved" bedeutet, dass die zuständige Kommune die Eignung
          separat bestätigt hat. Beide Aussagen dürfen nicht vermischt werden.
        </p>
      </div>
    </div>
  </div>
);

export default Verifizierung;