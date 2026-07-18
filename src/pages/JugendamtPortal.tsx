import { useEffect, useState } from "react";
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
import { CheckCircle2, ShieldCheck, FileCheck2, Search, Info } from "lucide-react";

const BUNDESLAENDER = [
  "Baden-Württemberg","Bayern","Berlin","Brandenburg","Bremen","Hamburg","Hessen",
  "Mecklenburg-Vorpommern","Niedersachsen","Nordrhein-Westfalen","Rheinland-Pfalz",
  "Saarland","Sachsen","Sachsen-Anhalt","Schleswig-Holstein","Thüringen",
];

const PURPOSES = [
  { value: "verification_check", label: "Verifizierungsstatus einer Person prüfen" },
  { value: "list_area", label: "Übersicht der registrierten Personen im Zuständigkeitsbereich" },
  { value: "safeguarding", label: "Kinderschutz-Anfrage (§ 8a SGB VIII)" },
  { value: "cooperation", label: "Kooperationsgespräch / Rahmenvereinbarung" },
  { value: "sonstiges", label: "Sonstiges" },
];

export default function JugendamtPortal() {
  const [stats, setStats] = useState({ registered: 0, verified: 0, jugendamt_approved: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    jugendamt_name: "",
    contact_name: "",
    contact_email: "",
    bundesland: "",
    city: "",
    plz: "",
    purpose: "",
    notes: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("minder_verification").select("status");
      if (!data) return;
      const s = { registered: 0, verified: 0, jugendamt_approved: 0 };
      for (const r of data) {
        const st = (r as { status: string }).status;
        if (st === "verified") s.verified++;
        else if (st === "jugendamt_approved") s.jugendamt_approved++;
        else s.registered++;
      }
      setStats(s);
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.jugendamt_name || !form.contact_email || !form.purpose) {
      toast({ title: "Bitte Pflichtfelder ausfüllen", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("jugendamt_lookups").insert({
      jugendamt_name: form.jugendamt_name,
      contact_name: form.contact_name || null,
      contact_email: form.contact_email,
      bundesland: form.bundesland || null,
      city: form.city || null,
      plz: form.plz || null,
      purpose: form.purpose,
      notes: form.notes || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Fehler beim Senden", description: error.message, variant: "destructive" });
      return;
    }
    setSubmitted(true);
    toast({ title: "Danke – wir melden uns innerhalb von 2 Werktagen." });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary/5 to-background py-20">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-6">
              <ShieldCheck className="w-4 h-4" /> Portal für Jugendämter
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Kooperation mit dem Jugendamt
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              KinderStars unterstützt Jugendämter und Landesjugendämter bei der Übersicht über
              Kindertagespflegepersonen, die unser dreistufiges Verifizierungsverfahren durchlaufen haben.
              Wir arbeiten ergänzend zu § 43 SGB VIII – wir ersetzen keine Pflegeerlaubnis.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <a href="#anfrage"><Button size="lg">Anfrage stellen</Button></a>
              <Link to="/verifizierung"><Button size="lg" variant="outline">Verifizierungsstandards</Button></Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-14">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">{stats.registered}</CardTitle>
                  <CardDescription>KinderStars Registriert</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Identität geprüft, Grundprofil vorhanden.
                </CardContent>
              </Card>
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-2xl">{stats.verified}</CardTitle>
                  <CardDescription>KinderStars Verifiziert</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Erweitertes Führungszeugnis, Erste Hilfe, Kinderschutz-Schulung.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">{stats.jugendamt_approved}</CardTitle>
                  <CardDescription>Jugendamt Anerkannt</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Pflegeerlaubnis nach § 43 SGB VIII nachgewiesen.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* What we can share */}
        <section className="py-14 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-10">Was wir mit Jugendämtern teilen dürfen</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center gap-3">
                  <FileCheck2 className="w-6 h-6 text-primary" />
                  <CardTitle className="text-lg">Verifizierungsnachweise</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Auf Anfrage und mit Einwilligung der betroffenen Person: Nachweise über Führungszeugnis-Prüfung,
                  Erste-Hilfe-Kurs, Fortbildungen und Belehrung nach § 43 IfSG.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center gap-3">
                  <Search className="w-6 h-6 text-primary" />
                  <CardTitle className="text-lg">Bereichs-Statistik</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Aggregierte, anonymisierte Zahlen zu registrierten Personen in Ihrem Zuständigkeitsbereich (PLZ-Cluster).
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                  <CardTitle className="text-lg">Kinderschutz-Meldungen</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Bei akuter Kindeswohlgefährdung (§ 8a SGB VIII) melden wir uns unverzüglich beim örtlich zuständigen Jugendamt.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center gap-3">
                  <Info className="w-6 h-6 text-primary" />
                  <CardTitle className="text-lg">Kooperationsrahmen</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Wir schließen bei Bedarf Kooperations- und Datenschutzvereinbarungen (Art. 26/28 DSGVO)
                  mit Ihrem Jugendamt oder Landesjugendamt.
                </CardContent>
              </Card>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-8 max-w-3xl mx-auto">
              Wichtig: KinderStars ist kein staatlicher Träger und erteilt keine Pflegeerlaubnis nach § 43 SGB VIII.
              Unser Verifizierungsverfahren ist ein privatwirtschaftlicher Qualitätsstandard.
            </p>
          </div>
        </section>

        {/* Lead form */}
        <section id="anfrage" className="py-20">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-3">Anfrage an KinderStars</h2>
              <p className="text-muted-foreground">
                Bitte nutzen Sie ausschließlich dienstliche E-Mail-Adressen. Wir melden uns innerhalb von 2 Werktagen.
              </p>
            </div>

            {submitted ? (
              <Card>
                <CardContent className="p-10 text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
                  <h3 className="text-xl font-semibold">Vielen Dank!</h3>
                  <p className="text-muted-foreground">
                    Ihre Anfrage ist bei uns eingegangen. Unser Compliance-Team meldet sich in Kürze.
                  </p>
                  <Link to="/"><Button variant="outline">Zurück zur Startseite</Button></Link>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={submit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="jugendamt">Jugendamt / Landesjugendamt *</Label>
                        <Input id="jugendamt" required value={form.jugendamt_name} onChange={(e) => set("jugendamt_name", e.target.value)} placeholder="z. B. Jugendamt Köln" />
                      </div>
                      <div>
                        <Label htmlFor="cname">Ansprechpartner:in</Label>
                        <Input id="cname" value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="cemail">Dienstliche E-Mail *</Label>
                        <Input id="cemail" type="email" required value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} />
                      </div>
                      <div>
                        <Label>Bundesland</Label>
                        <Select value={form.bundesland} onValueChange={(v) => set("bundesland", v)}>
                          <SelectTrigger><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
                          <SelectContent>
                            {BUNDESLAENDER.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="city">Stadt / Kreis</Label>
                        <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="plz">PLZ</Label>
                        <Input id="plz" value={form.plz} onChange={(e) => set("plz", e.target.value)} maxLength={5} />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Anlass der Anfrage *</Label>
                        <Select value={form.purpose} onValueChange={(v) => set("purpose", v)}>
                          <SelectTrigger><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
                          <SelectContent>
                            {PURPOSES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="notes">Anmerkungen</Label>
                        <Textarea id="notes" rows={4} value={form.notes} onChange={(e) => set("notes", e.target.value)}
                          placeholder="Bitte beschreiben Sie Ihr Anliegen. Nennen Sie keine personenbezogenen Daten, die nicht zwingend nötig sind." />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? "Wird gesendet …" : "Anfrage senden"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Mit dem Absenden stimmen Sie unserer <Link to="/datenschutz" className="underline">Datenschutzerklärung</Link> zu.
                      Bei akuter Kindeswohlgefährdung wenden Sie sich bitte direkt an das zuständige Jugendamt oder an 110 / 112.
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