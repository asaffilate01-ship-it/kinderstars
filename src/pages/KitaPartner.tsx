import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, HeartHandshake, TrendingUp, Users, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const leadSchema = z.object({
  name: z.string().trim().min(2, "Bitte Kita-Namen angeben").max(200),
  contact_name: z.string().trim().min(2).max(120),
  contact_email: z.string().trim().email("Ungültige E-Mail").max(255),
  contact_phone: z.string().trim().max(40).optional(),
  plz: z.string().trim().regex(/^\d{5}$/, "5-stellige PLZ").optional().or(z.literal("")),
  town: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export default function KitaPartner() {
  const [form, setForm] = useState({
    name: "", contact_name: "", contact_email: "", contact_phone: "", plz: "", town: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    const parsed = leadSchema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message ?? "Bitte Formular prüfen";
      toast({ title: "Eingabe prüfen", description: first, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("kita_partners").insert({
      name: parsed.data.name,
      contact_name: parsed.data.contact_name,
      contact_email: parsed.data.contact_email,
      contact_phone: parsed.data.contact_phone || null,
      plz: parsed.data.plz || null,
      town: parsed.data.town || null,
      notes: parsed.data.notes || null,
      status: "lead",
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-10">
          <Badge className="mb-3">Kita-Partnerprogramm</Badge>
          <h1 className="text-4xl font-bold mb-3">Werden Sie KinderStars Kita-Partner</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ihre Kita ist ausgebucht? Verweisen Sie überzählige Familien an geprüfte
            Kindertagespflege­personen — und erhalten Sie eine Vermittlungs­prämie
            für jede erfolgreich vermittelte Familie.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <Card className="p-5">
            <HeartHandshake className="w-8 h-8 text-primary mb-2" />
            <h3 className="font-semibold mb-1">Für Ihre Familien</h3>
            <p className="text-sm text-muted-foreground">
              Statt Wartelisten: geprüfte Betreuung mit Berufshaftpflicht, Führungszeugnis und § 43 SGB VIII-Nachweisen.
            </p>
          </Card>
          <Card className="p-5">
            <TrendingUp className="w-8 h-8 text-primary mb-2" />
            <h3 className="font-semibold mb-1">10 % Vermittlungs­prämie</h3>
            <p className="text-sm text-muted-foreground">
              10 % der Betreuungs­einnahmen aus dem ersten Jahr — pro erfolgreich vermittelter Familie.
            </p>
          </Card>
          <Card className="p-5">
            <Users className="w-8 h-8 text-primary mb-2" />
            <h3 className="font-semibold mb-1">Keine Verpflichtung</h3>
            <p className="text-sm text-muted-foreground">
              Kein Vertragszwang mit Ihren Eltern — Sie helfen weiter, wir übernehmen die Vermittlung.
            </p>
          </Card>
        </div>

        <Card className="p-6 max-w-2xl mx-auto">
          {done ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
              <h2 className="text-xl font-semibold mb-2">Danke!</h2>
              <p className="text-sm text-muted-foreground">
                Unser Partner-Team meldet sich innerhalb von 2 Werktagen bei Ihnen.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" /> Kita anmelden
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Name der Kita*</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={200} />
                </div>
                <div>
                  <Label>Ansprechpartner*</Label>
                  <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} maxLength={120} />
                </div>
                <div>
                  <Label>E-Mail*</Label>
                  <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} maxLength={255} />
                </div>
                <div>
                  <Label>Telefon</Label>
                  <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} maxLength={40} />
                </div>
                <div>
                  <Label>PLZ</Label>
                  <Input value={form.plz} onChange={(e) => setForm({ ...form, plz: e.target.value })} maxLength={5} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Ort</Label>
                  <Input value={form.town} onChange={(e) => setForm({ ...form, town: e.target.value })} maxLength={120} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Anmerkungen</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={2000} rows={3} />
                </div>
              </div>
              <Button className="w-full mt-5" onClick={submit} disabled={submitting}>
                {submitting ? "Wird gesendet…" : "Partner werden"}
              </Button>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Mit dem Absenden akzeptieren Sie unsere <a href="/datenschutz" className="underline">Datenschutz­erklärung</a>.
              </p>
            </>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  );
}