import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Shield } from "lucide-react";

const sections: { heading: string; body: string }[] = [
  {
    heading: "1. Verantwortlicher",
    body:
      "Verantwortlicher im Sinne der DSGVO ist die LoungeTech GmbH, Betreiberin der KinderStars-Plattform. Kontakt: info@kinderstars.de. Die vollständige Anbieterkennzeichnung finden Sie im Impressum.",
  },
  {
    heading: "2. Zwecke und Rechtsgrundlagen der Verarbeitung",
    body:
      "Wir verarbeiten personenbezogene Daten zur Bereitstellung des Kinderbetreuungs-Marktplatzes (Art. 6 Abs. 1 lit. b DSGVO — Vertrag), zur Erfüllung gesetzlicher Pflichten (lit. c), zur Wahrung berechtigter Interessen wie Betrugsprävention und Verifikation (lit. f) sowie auf Grundlage Ihrer Einwilligung (lit. a) — z. B. für Analyse-Cookies und Marketing-Kommunikation.",
  },
  {
    heading: "3. Kategorien verarbeiteter Daten",
    body:
      "• Stammdaten (Name, E-Mail, Telefon, PLZ/Stadt/Bundesland)\n• Kinderbezogene Angaben (Alter, Betreuungsbedarf) — auf das Notwendige begrenzt\n• Betreuer-Profildaten (Qualifikationen, Führungszeugnis-Status, Erste-Hilfe-Zertifikat, Referenzen)\n• Buchungs-, Zahlungs- und Rechnungsdaten (über lizenzierten Zahlungsdienstleister)\n• Kommunikationsdaten (Nachrichten über die Plattform)\n• Nutzungsdaten (Cookies, Analyse — nur mit Einwilligung)",
  },
  {
    heading: "4. Empfänger und Auftragsverarbeiter",
    body:
      "Wir setzen sorgfältig ausgewählte Auftragsverarbeiter ein (Hosting, Datenbank, Zahlungsabwicklung, E-Mail-Versand, Analyse). Zahlungen werden über einen in der EU lizenzierten Marktplatz-Zahlungsdienstleister abgewickelt; wir halten keine Kundengelder selbst. Eine Weitergabe an Behörden (z. B. Jugendamt, Jobcenter) erfolgt nur, wenn Sie oder Ihr:e Betreuer:in dies im Rahmen einer öffentlich geförderten Betreuung veranlassen.",
  },
  {
    heading: "5. Plattform-Meldepflicht (PStTG / DAC7)",
    body:
      "Als digitale Plattform sind wir verpflichtet, bestimmte Angaben zu Anbieter:innen und deren Vergütungen an das Bundeszentralamt für Steuern zu melden (Plattformen-Steuertransparenzgesetz, PStTG). Betroffene werden hierüber gesondert informiert.",
  },
  {
    heading: "6. Speicherdauer",
    body:
      "Wir speichern personenbezogene Daten nur so lange, wie es für die genannten Zwecke erforderlich ist bzw. gesetzliche Aufbewahrungspflichten (z. B. §257 HGB, §147 AO — bis zu 10 Jahre für steuerrelevante Belege) es verlangen.",
  },
  {
    heading: "7. Ihre Rechte",
    body:
      "Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21) sowie das Recht, eine erteilte Einwilligung jederzeit zu widerrufen (Art. 7 Abs. 3). Kontakt: info@kinderstars.de.",
  },
  {
    heading: "8. Beschwerderecht",
    body:
      "Sie können sich bei der zuständigen Datenschutz-Aufsichtsbehörde beschweren — in der Regel die Landesdatenschutzaufsichtsbehörde Ihres Bundeslandes.",
  },
  {
    heading: "9. Cookies und Reichweitenmessung",
    body:
      "Wir setzen nur technisch notwendige Cookies ohne Einwilligung. Für Analyse- und Marketing-Cookies holen wir Ihre Einwilligung über unseren Cookie-Banner nach §25 TDDDG (ehemals TTDSG) ein. Sie können Ihre Auswahl jederzeit über den Banner ändern.",
  },
  {
    heading: "10. Änderungen",
    body:
      "Diese Datenschutzerklärung wird bei Bedarf angepasst. Wesentliche Änderungen werden auf der Plattform kommuniziert. Stand: Entwurf — vor Launch durch Anwalt prüfen lassen.",
  },
];

const Datenschutz = () => (
  <>
    <SEOHead
      title="Datenschutzerklärung | KinderStars"
      description="Informationen zur Verarbeitung personenbezogener Daten bei KinderStars nach DSGVO / BDSG."
    />
    <Navbar />
    <main className="max-w-[720px] mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-7 h-7 text-brand-accent" />
        <h1 className="text-2xl font-bold text-foreground">Datenschutzerklärung</h1>
      </div>
      <p className="text-xs text-muted-foreground mb-8">
        Stand: Entwurf — vor Launch durch Anwalt prüfen lassen.
      </p>

      <div className="space-y-8">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-base font-bold text-foreground mb-2">{s.heading}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {s.body}
            </p>
          </section>
        ))}
      </div>

      <div className="mt-12 pt-6 border-t border-border">
        <Footer />
      </div>
    </main>
  </>
);

export default Datenschutz;