import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Save, CreditCard, Building2, GraduationCap, Landmark } from "lucide-react";

const FUNDING_TYPES = [
  { value: "self_funded", label: "Private Selbstzahlung", icon: CreditCard },
  { value: "sfe", label: "Bildungsgutschein (BAföG/Studierendenwerk)", icon: GraduationCap },
  { value: "ccg", label: "Krankenkasse / Rehaträger", icon: Building2 },
  { value: "local_authority", label: "Jugendamt‑Förderung nach § 23 SGB VIII", icon: Landmark },
  { value: "tax_free_childcare", label: "Steuerliche Absetzbarkeit (§ 10 Abs. 1 Nr. 5 EStG)", icon: CreditCard },
  { value: "employer", label: "Arbeitgeberzuschuss (§ 3 Nr. 33 EStG)", icon: Building2 },
];

const PAYMENT_METHODS = ["SEPA‑Lastschrift", "Überweisung", "Kreditkarte", "PayPal", "Firmenkonto"];

const FundingPage = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({
    funding_type: "self_funded",
    sfe_reference: "",
    ccg_details: "",
    local_authority: "",
    payment_method: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("parent_profiles").select("funding_type, sfe_reference, ccg_details, local_authority, payment_method")
      .eq("user_id", user.id).maybeSingle().then(({ data }) => {
        if (data) {
          setForm({
            funding_type: data.funding_type || "self_funded",
            sfe_reference: data.sfe_reference || "",
            ccg_details: data.ccg_details || "",
            local_authority: data.local_authority || "",
            payment_method: data.payment_method || "",
          });
        }
        setLoaded(true);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("parent_profiles").upsert({
      user_id: user.id,
      funding_type: form.funding_type,
      sfe_reference: form.sfe_reference || null,
      ccg_details: form.ccg_details || null,
      local_authority: form.local_authority || null,
      payment_method: form.payment_method || null,
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Funding configuration saved" });
    }
  };

  if (!loaded) return <div className="text-muted-foreground text-sm py-10 text-center">Wird geladen…</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-1">Finanzierung & Zahlungen</h1>
      <p className="text-muted-foreground text-sm mb-6">Legen Sie fest, wie Ihre Kindertagespflege finanziert wird und welche Zahlungsart Sie bevorzugen.</p>

      <div className="space-y-6">
        {/* Funding type selection */}
        <div className="ks-card p-5">
          <h2 className="font-bold text-sm mb-3">Finanzierungsart</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FUNDING_TYPES.map((ft) => (
              <button key={ft.value} type="button" onClick={() => setForm({ ...form, funding_type: ft.value })}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left text-sm transition-all ${
                  form.funding_type === ft.value
                    ? "border-secondary bg-secondary/8 font-medium"
                    : "border-border hover:border-secondary/30 bg-card"
                }`}>
                <ft.icon className={`w-5 h-5 ${form.funding_type === ft.value ? "text-secondary" : "text-muted-foreground"}`} />
                {ft.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conditional fields */}
        {form.funding_type === "sfe" && (
          <div className="ks-card p-5">
            <h2 className="font-bold text-sm mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Bildungsgutschein</h2>
            <div className="ks-field">
              <label>Aktenzeichen / Bewilligungsbescheid</label>
              <input value={form.sfe_reference} onChange={(e) => setForm({ ...form, sfe_reference: e.target.value })}
                placeholder="z. B. BAföG‑Az / Bescheidnummer" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Referenznummer aus dem Bewilligungsbescheid Ihres Studierendenwerks bzw. BAföG‑Amtes für den Kinderbetreuungszuschlag.</p>
          </div>
        )}

        {form.funding_type === "ccg" && (
          <div className="ks-card p-5">
            <h2 className="font-bold text-sm mb-3 flex items-center gap-2"><Building2 className="w-4 h-4" /> Krankenkasse / Rehaträger</h2>
            <div className="ks-field">
              <label>Kostenträger & Aktenzeichen</label>
              <textarea value={form.ccg_details} onChange={(e) => setForm({ ...form, ccg_details: e.target.value })}
                placeholder="z. B. AOK Nordost, Az. 2026/12345 – Haushaltshilfe nach § 38 SGB V…" />
            </div>
          </div>
        )}

        {form.funding_type === "local_authority" && (
          <div className="ks-card p-5">
            <h2 className="font-bold text-sm mb-3 flex items-center gap-2"><Landmark className="w-4 h-4" /> Jugendamt</h2>
            <div className="ks-field">
              <label>Zuständiges Jugendamt</label>
              <input value={form.local_authority} onChange={(e) => setForm({ ...form, local_authority: e.target.value })}
                placeholder="z. B. Jugendamt Berlin‑Mitte" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Förderung der Kindertagespflege nach § 23 SGB VIII. Reichen Sie den Bewilligungsbescheid im Bereich „Dokumente" ein – KinderStars rechnet direkt mit dem Jugendamt ab.</p>
          </div>
        )}

        {form.funding_type === "tax_free_childcare" && (
          <div className="ks-card p-5">
            <h2 className="font-bold text-sm mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Steuerliche Absetzbarkeit</h2>
            <p className="text-sm text-muted-foreground">
              Sie können bis zu zwei Drittel der Betreuungskosten (max. 4.000 € pro Kind und Jahr) als Sonderausgaben nach § 10 Abs. 1 Nr. 5 EStG geltend machen. KinderStars stellt am Jahresende eine Sammelrechnung für Ihr Finanzamt aus.
            </p>
            <p className="text-xs text-muted-foreground mt-2">Informationen: <span className="font-medium">bundesfinanzministerium.de</span> – Betreuungsperson und Steuer‑ID werden auf der Rechnung ausgewiesen.</p>
          </div>
        )}

        {/* Payment method — only for self-funded */}
        {form.funding_type === "self_funded" && (
          <div className="ks-card p-5">
            <h2 className="font-bold text-sm mb-3">Bevorzugte Zahlungsart</h2>
            <div className="ks-field">
              <label>Zahlungsart</label>
              <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                <option value="">Bitte wählen…</option>
                {PAYMENT_METHODS.map((pm) => <option key={pm} value={pm}>{pm}</option>)}
              </select>
            </div>
          </div>
        )}

        {form.funding_type && form.funding_type !== "self_funded" && (
          <div className="ks-card p-5">
            <h2 className="font-bold text-sm mb-3">Zahlung</h2>
            <p className="text-sm text-muted-foreground">
              💡 KinderStars rechnet direkt mit dem zuständigen Kostenträger ab. Eine Auswahl der Zahlungsart ist nicht erforderlich.
            </p>
          </div>
        )}

        <Button variant="success" onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" /> {saving ? "Speichern…" : "Konfiguration speichern"}
        </Button>
      </div>
    </div>
  );
};

export default FundingPage;
