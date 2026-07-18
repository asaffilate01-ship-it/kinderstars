import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { AlertTriangle, ShieldAlert, Plus, Phone } from "lucide-react";

type Concern = {
  id: string;
  child_initials: string;
  child_age_years: number | null;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "in_review" | "jugendamt_notified" | "resolved" | "closed";
  occurred_at: string;
  location: string | null;
  description: string;
  immediate_actions: string | null;
  witnesses: string | null;
  jugendamt_notified: boolean;
  jugendamt_reference: string | null;
  parents_informed: boolean;
  created_at: string;
};

const CATEGORIES = [
  { value: "physical_concern", label: "Körperliche Auffälligkeit" },
  { value: "emotional_concern", label: "Emotionale Auffälligkeit" },
  { value: "neglect", label: "Vernachlässigung" },
  { value: "sexual_concern", label: "Sexualisierte Auffälligkeit" },
  { value: "domestic_violence", label: "Häusliche Gewalt" },
  { value: "online_safety", label: "Online-Sicherheit" },
  { value: "accident_injury", label: "Unfall / Verletzung" },
  { value: "behavioural_change", label: "Verhaltensänderung" },
  { value: "other", label: "Sonstiges" },
];

const SEVERITY_BADGE: Record<string, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Offen",
  in_review: "In Prüfung",
  jugendamt_notified: "Jugendamt informiert",
  resolved: "Gelöst",
  closed: "Geschlossen",
};

export default function SafeguardingPage() {
  const { user } = useAuth();
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    child_initials: "",
    child_age_years: "",
    category: "other",
    severity: "medium",
    occurred_at: new Date().toISOString().slice(0, 16),
    location: "",
    description: "",
    immediate_actions: "",
    witnesses: "",
  });

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("safeguarding_concerns")
      .select("*")
      .order("created_at", { ascending: false });
    setConcerns((data as Concern[]) || []);
    setLoading(false);
  };

  const submit = async () => {
    if (!user) return;
    if (!form.child_initials || !form.description) {
      toast.error("Initialen und Beschreibung sind Pflichtfelder.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("safeguarding_concerns").insert({
      reporter_id: user.id,
      child_initials: form.child_initials,
      child_age_years: form.child_age_years ? parseInt(form.child_age_years, 10) : null,
      category: form.category as any,
      severity: form.severity as any,
      occurred_at: new Date(form.occurred_at).toISOString(),
      location: form.location || null,
      description: form.description,
      immediate_actions: form.immediate_actions || null,
      witnesses: form.witnesses || null,
    });
    setSaving(false);
    if (error) {
      toast.error("Speichern fehlgeschlagen: " + error.message);
      return;
    }
    toast.success("Meldung erfasst. Bei akuter Gefahr bitte sofort 110 wählen.");
    setOpen(false);
    setForm({ ...form, child_initials: "", description: "", immediate_actions: "", witnesses: "", location: "" });
    void load();
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-7 w-7 text-primary" />
            Kinderschutz
          </h1>
          <p className="text-muted-foreground mt-1">
            Meldungen nach § 8a SGB VIII — vertraulich dokumentieren und nachverfolgen.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Neue Meldung</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Kinderschutz-Meldung erfassen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Akute Gefahr?</AlertTitle>
                <AlertDescription>
                  Bei unmittelbarer Gefahr rufen Sie <strong>110</strong> (Polizei) oder das
                  örtliche <strong>Jugendamt</strong>. Diese Dokumentation ersetzt keine Meldung an Behörden.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Initialen des Kindes *</Label>
                  <Input value={form.child_initials} maxLength={5}
                    onChange={e => setForm({ ...form, child_initials: e.target.value })} placeholder="z.B. M.K." />
                </div>
                <div>
                  <Label>Alter (Jahre)</Label>
                  <Input type="number" min={0} max={18} value={form.child_age_years}
                    onChange={e => setForm({ ...form, child_age_years: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Kategorie</Label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Schweregrad</Label>
                  <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Niedrig</SelectItem>
                      <SelectItem value="medium">Mittel</SelectItem>
                      <SelectItem value="high">Hoch</SelectItem>
                      <SelectItem value="critical">Kritisch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Zeitpunkt</Label>
                  <Input type="datetime-local" value={form.occurred_at}
                    onChange={e => setForm({ ...form, occurred_at: e.target.value })} />
                </div>
                <div>
                  <Label>Ort</Label>
                  <Input value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })} placeholder="z.B. Betreuungsraum" />
                </div>
              </div>

              <div>
                <Label>Sachliche Beobachtung *</Label>
                <Textarea rows={4} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Beobachtete Fakten, wörtliche Zitate, keine Interpretationen." />
              </div>

              <div>
                <Label>Sofortmaßnahmen</Label>
                <Textarea rows={2} value={form.immediate_actions}
                  onChange={e => setForm({ ...form, immediate_actions: e.target.value })} />
              </div>

              <div>
                <Label>Zeug:innen / anwesende Personen</Label>
                <Input value={form.witnesses}
                  onChange={e => setForm({ ...form, witnesses: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
              <Button onClick={submit} disabled={saving}>{saving ? "Speichert…" : "Meldung speichern"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Alert>
        <Phone className="h-4 w-4" />
        <AlertTitle>Wichtige Notfallnummern</AlertTitle>
        <AlertDescription className="text-sm">
          Polizei: <strong>110</strong> · Notarzt: <strong>112</strong> · Nummer gegen Kummer: <strong>116 111</strong> ·
          Hilfetelefon Sexueller Missbrauch: <strong>0800 22 55 530</strong>. Örtliches Jugendamt: siehe Kommune.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Meine Meldungen</CardTitle>
          <CardDescription>Chronologische Liste aller von Ihnen erfassten Kinderschutz-Vorfälle.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Lädt…</p>
          ) : concerns.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Meldungen erfasst.</p>
          ) : (
            <div className="space-y-3">
              {concerns.map(c => (
                <div key={c.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{c.child_initials}</span>
                        {c.child_age_years && <span className="text-sm text-muted-foreground">· {c.child_age_years} J.</span>}
                        <Badge className={SEVERITY_BADGE[c.severity]}>{c.severity}</Badge>
                        <Badge variant="outline">{STATUS_LABEL[c.status]}</Badge>
                        {c.jugendamt_notified && <Badge variant="secondary">Jugendamt informiert</Badge>}
                      </div>
                      <p className="text-sm mt-2 whitespace-pre-wrap">{c.description}</p>
                      <div className="text-xs text-muted-foreground mt-2">
                        {CATEGORIES.find(x => x.value === c.category)?.label} ·
                        {" "}{new Date(c.occurred_at).toLocaleString("de-DE")}
                        {c.location && <> · {c.location}</>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rechtlicher Rahmen</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p><strong>§ 8a SGB VIII</strong> — Schutzauftrag bei Kindeswohlgefährdung. Kindertagespflegepersonen sind verpflichtet,
          Anhaltspunkte für Gefährdungen unter Hinzuziehung einer insoweit erfahrenen Fachkraft (InsoFa) einzuschätzen.</p>
          <p><strong>§ 8b SGB VIII</strong> — Fachkräfte haben gegenüber dem Träger der öffentlichen Jugendhilfe Anspruch auf
          Beratung durch eine insoweit erfahrene Fachkraft.</p>
          <p><strong>DSGVO</strong> — Meldungen enthalten besondere Kategorien personenbezogener Daten (Art. 9). Zugriff ist auf
          Melder:in und autorisiertes KinderStars-Personal beschränkt; Weitergabe an Behörden nur auf Rechtsgrundlage.</p>
        </CardContent>
      </Card>
    </div>
  );
}