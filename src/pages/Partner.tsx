import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, ExternalLink } from "lucide-react";
import { PARTNERS, PARTNER_CATEGORIES, type PartnerCategory } from "@/lib/partners-data";

export default function Partner() {
  const [active, setActive] = useState<PartnerCategory | "all">("all");

  const filtered = useMemo(
    () => (active === "all" ? PARTNERS : PARTNERS.filter((p) => p.category === active)),
    [active],
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-8">
          <Badge className="mb-3">Partnerverzeichnis</Badge>
          <h1 className="text-4xl font-bold mb-3">KinderStars Partner</h1>
          <p className="text-muted-foreground max-w-3xl">
            Kuratiertes Verzeichnis vertrauenswürdiger Anbieter für
            Versicherung, Steuer, Lohn, Altersvorsorge, Übersetzung,
            Erste Hilfe und Rechtsberatung — für Kindertagespflege­personen
            und Familien.
          </p>
        </div>

        <Card className="p-5 mb-8 bg-muted/40 border-muted">
          <div className="flex items-start gap-3 text-sm">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Hinweis:</span>{" "}
              KinderStars vermittelt keine Versicherungs- oder
              Finanzprodukte und erhält keine Provisionen für den
              Abschluss. Die Links sind reine Empfehlungen — der Vertrag
              wird direkt mit dem jeweiligen Anbieter geschlossen. Bitte
              prüfen Sie Konditionen und Eignung eigenständig.
            </p>
          </div>
        </Card>

        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={active === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActive("all")}
          >
            Alle
          </Button>
          {PARTNER_CATEGORIES.map((c) => (
            <Button
              key={c.id}
              variant={active === c.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActive(c.id)}
            >
              {c.label}
            </Button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((p) => {
            const cat = PARTNER_CATEGORIES.find((c) => c.id === p.category);
            return (
              <Card key={p.id} className="p-6 flex flex-col justify-between">
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{cat?.label}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {p.region}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <p className="text-sm font-medium text-primary">
                    {p.tagline}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {p.description}
                  </p>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <a href={p.url} target="_blank" rel="noopener noreferrer sponsored">
                    Zum Anbieter <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground mt-10 text-center max-w-3xl mx-auto">
          Möchten Sie als Anbieter in dieses Verzeichnis aufgenommen
          werden? Schreiben Sie an partner@kinderstars.de. KinderStars
          behält sich vor, Aufnahme und Verbleib nach Qualitätskriterien
          zu prüfen.
        </p>
      </main>
      <Footer />
    </div>
  );
}