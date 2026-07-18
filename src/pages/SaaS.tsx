import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle2 } from "lucide-react";

type Tier = "starter" | "growth" | "scale" | "bespoke";

const TIERS: Array<{
  id: Tier;
  name: string;
  price: string;
  cadence: string;
  audience: string;
  features: string[];
  highlight?: boolean;
}> = [
  {
    id: "starter",
    name: "SaaS Starter",
    price: "€99",
    cadence: "/Monat",
    audience: "Kleine Träger, bis 15 Fachkräfte",
    features: [
      "Compliance-Dashboard (weiß-etikettiert)",
      "Dokumenten-Tresor & Erinnerungen",
      "Fortbildungsnachweise & CPD",
      "E-Mail-Support",
    ],
  },
  {
    id: "growth",
    name: "SaaS Growth",
    price: "€299",
    cadence: "/Monat",
    audience: "Träger & Ketten, bis 75 Fachkräfte",
    features: [
      "Alles aus Starter",
      "Eigenes Branding (Logo, Farben, Subdomain)",
      "Mehrere Standorte / Teams",
      "Rollen-/Rechteverwaltung",
      "Prioritäts-Support",
    ],
    highlight: true,
  },
  {
    id: "scale",
    name: "SaaS Scale",
    price: "€750 – €2.000",
    cadence: "/Monat",
    audience: "Große Träger, Kommunen, Landesverbände",
    features: [
      "Alles aus Growth",
      "SSO / SAML & Active Directory",
      "Individuelle Compliance-Regeln je Bundesland",
      "API-Zugriff & Datenexport",
      "Auftragsverarbeitungsvertrag (AVV) & DSGVO-Support",
      "Dedicated Customer Success Manager",
    ],
  },
  {
    id: "bespoke",
    name: "SaaS Bespoke",
    price: "individuell",
    cadence: "",
    audience: "Länder, Bundesbehörden, Sonderprojekte",
    features: [
      "Individuelle Funktionsentwicklung",
      "On-Premise oder EU-Region-Hosting nach Wahl",
      "Auditierbare Prozesse & BSI-Grundschutz-Vorlagen",
      "24/7-SLA & TOMs nach Vereinbarung",
      "Rahmenvertrag & Ausschreibungsunterlagen",
    ],
  },
];

const ORG_TYPES = [
  { value: "traeger", label: "Freier Träger" },
  { value: "kette", label: "Kette / Netzwerk" },
  { value: "kommune", label: "Kommune / Jugendamt" },
  { value: "sonstiges", label: "Sonstiges" },
];

export default function SaaS() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    org_type: "" as "" | "traeger" | "kette" | "kommune" | "sonstiges",
    estimated_seats: "",
    current_software: "",
    tier_interest: "" as "" | Tier,
    message: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name || !form.contact_name || !form.email) {
      toast({ title: "Bitte alle Pflichtfelder ausfüllen", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("saas_leads").insert({
      company_name: form.company_name,
      contact_name: form.contact_name,
      email: form.email,
      phone: form.phone || null,
      org_type: form.org_type || null,
      estimated_seats: form.estimated_seats ? parseInt(form.estimated_seats, 10) : null,
      current_software: form.current_software || null,
      tier_interest: form.tier_interest || null,
      message: form.message || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Fehler beim Senden", description: error.message, variant: "destructive" });
      return;
    }
    setSubmitted(true);
    toast({ title: "Danke! Wir melden uns innerhalb von 1 Werktag." });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-20">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-6">
              KinderStars Compliance SaaS – White-Label
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Compliance-Plattform für Träger, Ketten und Kommunen
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Nutzen Sie unsere Compliance-, Dokumenten- und Fortbildungs-Infrastruktur unter Ihrer eigenen Marke –
              DSGVO-konform, gehostet in der EU, ohne eigene Entwicklungsressourcen.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <a href="#demo">
                <Button size="lg">Demo anfragen</Button>
              </a>
              <a href="#tiers">
                <Button size="lg" variant="outline">Preise ansehen</Button>
              </a>
            </div>
          </div>
        </section>

        {/* Tiers */}
        <section id="tiers" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-bold mb-3">Vier Ausbaustufen</h2>
              <p className="text-muted-foreground">
                Von der schlanken Compliance-Ablage bis zum ausschreibungsfähigen Rahmenvertrag.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {TIERS.map((t) => (
                <Card key={t.id} className={t.highlight ? "border-primary shadow-lg" : ""}>
                  <CardHeader>
                    <CardTitle className="text-xl">{t.name}</CardTitle>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-bold">{t.price}</span>
                      <span className="text-muted-foreground text-sm">{t.cadence}</span>
                    </div>
                    <CardDescription>{t.audience}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {t.features.map((f) => (
                        <li key={f} className="flex gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-8 max-w-3xl mx-auto">
              Alle Preise verstehen sich als Nettopreise pro Monat zzgl. USt. Preise für Scale/Bespoke werden individuell auf
              Basis Nutzerzahl, Standorten und benötigter Integrationen kalkuliert.
            </p>
          </div>
        </section>

        {/* Lead form */}
        <section id="demo" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-3">Demo anfragen</h2>
              <p className="text-muted-foreground">
                Wir melden uns innerhalb eines Werktags mit einem passenden Angebot.
              </p>
            </div>

            {submitted ? (
              <Card>
                <CardContent className="p-10 text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
                  <h3 className="text-xl font-semibold">Vielen Dank!</h3>
                  <p className="text-muted-foreground">
                    Ihre Anfrage ist bei uns eingegangen. Unser SaaS-Team meldet sich in Kürze.
                  </p>
                  <Link to="/"><Button variant="outline">Zurück zur Startseite</Button></Link>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={submit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="company">Organisation *</Label>
                        <Input id="company" required value={form.company_name} onChange={(e) => set("company_name", e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="contact">Ansprechpartner:in *</Label>
                        <Input id="contact" required value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="email">E-Mail *</Label>
                        <Input id="email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="phone">Telefon</Label>
                        <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                      </div>
                      <div>
                        <Label>Art der Organisation</Label>
                        <Select value={form.org_type} onValueChange={(v) => set("org_type", v as typeof form.org_type)}>
                          <SelectTrigger><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
                          <SelectContent>
                            {ORG_TYPES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="seats">Voraussichtliche Nutzer</Label>
                        <Input id="seats" type="number" min="1" value={form.estimated_seats} onChange={(e) => set("estimated_seats", e.target.value)} />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Interessantes Paket</Label>
                        <Select value={form.tier_interest} onValueChange={(v) => set("tier_interest", v as typeof form.tier_interest)}>
                          <SelectTrigger><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
                          <SelectContent>
                            {TIERS.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} – {t.price}{t.cadence}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="software">Aktuell eingesetzte Software</Label>
                        <Input id="software" placeholder="z. B. adebisKITA, KitaPlus, Excel …" value={form.current_software} onChange={(e) => set("current_software", e.target.value)} />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="message">Ihre Nachricht</Label>
                        <Textarea id="message" rows={4} value={form.message} onChange={(e) => set("message", e.target.value)} />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? "Wird gesendet …" : "Demo anfragen"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Mit dem Absenden stimmen Sie unserer <Link to="/datenschutz" className="underline">Datenschutzerklärung</Link> zu.
                    </p>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}