import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const tiers = [
  {
    name: "Starter",
    price: "€199",
    period: "/Monat",
    seats: "bis 10 Mitarbeitende",
    features: [
      "Firmenkonto & Compliance-Übersicht",
      "Bis zu 10 gelinkte Kindertagespflegepersonen",
      "Monatlicher Compliance-Report (PDF)",
      "Rechnungsexport (CSV/DATEV-freundlich)",
      "Hinweis: § 3 Nr. 33 EStG steuerfreie Zuschüsse",
    ],
  },
  {
    name: "Growth",
    price: "€499",
    period: "/Monat",
    seats: "bis 50 Mitarbeitende",
    recommended: true,
    features: [
      "Alles aus Starter",
      "Bis zu 50 gelinkte Betreuungspersonen",
      "Compliance-Matrix mit Ampelstatus",
      "Zuschuss- und Stundenkontingente pro Mitarbeitendem",
      "Prioritäts-Support innerhalb 1 Werktag",
      "Onboarding-Session (60 Min.)",
    ],
  },
  {
    name: "Enterprise",
    price: "€999",
    period: "/Monat",
    seats: "unbegrenzte Sitze",
    features: [
      "Alles aus Growth",
      "Unbegrenzte Betreuungspersonen und Standorte",
      "SSO & individuelle Datenexporte",
      "Dedizierter Account Manager",
      "SLA & DSGVO-Auftragsverarbeitung nach Maß",
      "Individuelle Reportings & API-Zugriff auf Anfrage",
    ],
  },
];

export default function FuerArbeitgeber() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            KinderStars für Arbeitgeber
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Kinderbetreuung als Benefit — steuerfreie Zuschüsse nach § 3 Nr. 33 EStG,
            transparente Compliance und einfache Abrechnung für Ihr HR-Team.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {tiers.map((tier) => (
            <Card key={tier.name} className={tier.recommended ? "border-primary shadow-lg" : ""}>
              <CardHeader>
                {tier.recommended && (
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                    Empfohlen
                  </div>
                )}
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground">{tier.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{tier.seats}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full" variant={tier.recommended ? "default" : "outline"}>
                  <Link to="/employer">Kostenlos einrichten</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-muted/40">
          <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">Steuerlicher Hinweis:</strong> Zuschüsse an
              nicht-schulpflichtige Kinder können nach § 3 Nr. 33 EStG steuer- und
              sozialversicherungsfrei sein. Bitte prüfen Sie individuell mit Ihrer Steuerberatung.
            </p>
            <p>
              KinderStars ist ein lizenzierter Marktplatz (§ 296 SGB III) und kein
              Personalvermittler. Verträge kommen direkt zwischen Eltern und Betreuungsperson zustande.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
