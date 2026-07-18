import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Building2 } from "lucide-react";

const Impressum = () => (
  <>
    <SEOHead
      title="Impressum | KinderStars"
      description="Impressum und Anbieterkennzeichnung nach §5 TMG für KinderStars (LoungeTech GmbH)."
    />
    <Navbar />
    <main className="max-w-[720px] mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-7 h-7 text-brand-accent" />
        <h1 className="text-2xl font-bold text-foreground">Impressum</h1>
      </div>
      <p className="text-xs text-muted-foreground mb-8">
        Angaben gemäß §5 TMG · Entwurf — vor Launch durch Anwalt prüfen lassen.
      </p>

      <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-base font-bold text-foreground mb-2">1. Diensteanbieter</h2>
          <p className="whitespace-pre-line">
            LoungeTech GmbH{"\n"}
            [Straße und Hausnummer]{"\n"}
            [PLZ] Berlin{"\n"}
            Deutschland
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">2. Kontakt</h2>
          <p className="whitespace-pre-line">
            E-Mail: info@kinderstars.de{"\n"}
            Telefon: [wird ergänzt]
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">3. Vertretungsberechtigte:r</h2>
          <p>Geschäftsführer:in: [Name der Geschäftsführung]</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">4. Registereintrag</h2>
          <p className="whitespace-pre-line">
            Amtsgericht Berlin (Charlottenburg){"\n"}
            HRB: [Nummer]
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">5. Umsatzsteuer-Identifikationsnummer</h2>
          <p>USt-IdNr. gemäß §27a UStG: [DEXXXXXXXXX]</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">
            6. Verantwortlich für den Inhalt nach §18 Abs. 2 MStV
          </h2>
          <p className="whitespace-pre-line">
            [Name]{"\n"}
            c/o LoungeTech GmbH{"\n"}
            [Adresse wie oben]
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">
            7. EU-Streitschlichtung
          </h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung
            (OS) bereit:{" "}
            <a
              className="underline"
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
            >
              ec.europa.eu/consumers/odr
            </a>
            . Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren
            vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">8. Haftungshinweis</h2>
          <p>
            Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für
            die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind
            ausschließlich deren Betreiber verantwortlich.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-border">
        <Footer />
      </div>
    </main>
  </>
);

export default Impressum;