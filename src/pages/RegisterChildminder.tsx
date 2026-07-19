import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import logo from "@/assets/kinderstars-logo.png";
import { Loader2, CheckCircle2 } from "lucide-react";

const registrationSchema = z.object({
  firstName: z.string().trim().min(1, "Vorname erforderlich").max(50),
  lastName: z.string().trim().min(1, "Nachname erforderlich").max(50),
  email: z.string().trim().email("Ungültige E‑Mail‑Adresse").max(255),
  phone: z.string().trim().min(7, "Telefonnummer erforderlich").max(20),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
  address: z.string().trim().min(1, "Adresse erforderlich").max(200),
  postcode: z.string().trim().min(3, "PLZ erforderlich").max(10),
  rightToWork: z.literal(true, { errorMap: () => ({ message: "Bitte bestätigen Sie die Berechtigung zur Erwerbstätigkeit" }) }),
  hasDbs: z.boolean(),
  dbsNumber: z.string().max(50).optional(),
  experienceSummary: z.string().trim().max(1000).optional(),
  availabilityNotes: z.string().trim().max(500).optional(),
});

const RegisterChildminder = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    postcode: "",
    rightToWork: false,
    hasDbs: false,
    dbsNumber: "",
    experienceSummary: "",
    availabilityNotes: "",
  });

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const result = registrationSchema.safeParse(form);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setSubmitting(true);

    // 1. Create auth account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          role: "childminder",
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    // 2. Send registration details to KinderStars email (fire-and-forget)
    supabase.functions.invoke("send-contact-email", {
      body: {
        name: `${form.firstName} ${form.lastName}`,
        email: form.email,
        message: [
          `NEW CHILDMINDER REGISTRATION`,
          `Phone: ${form.phone}`,
          `Address: ${form.address}`,
          `Postcode: ${form.postcode}`,
          `Right to Work: ${form.rightToWork ? "Yes" : "No"}`,
          `DBS: ${form.hasDbs ? `Yes — ${form.dbsNumber}` : "No"}`,
          `Experience: ${form.experienceSummary || "Not provided"}`,
          `Availability: ${form.availabilityNotes || "Not provided"}`,
        ].join("\n"),
      },
    }).catch(() => {});

    // 3. Send welcome email
    supabase.functions.invoke("send-welcome-email", {
      body: { email: form.email, firstName: form.firstName, role: "childminder" },
    }).catch(() => {});

    setSubmitting(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{
        background: "radial-gradient(900px 520px at 10% 0%, hsla(44,93%,57%,0.18), transparent 60%), radial-gradient(900px 520px at 90% 20%, hsla(200,93%,23%,0.10), transparent 60%), linear-gradient(180deg, hsl(36,100%,97%), hsl(0,0%,100%))",
      }}>
        <div className="w-full max-w-[480px] text-center">
          <a href="/"><img src={logo} alt="KinderStars" className="w-[160px] mx-auto mb-6" /></a>
          <div className="ks-card p-8">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Registrierung abgesendet!</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Bitte prüfen Sie Ihr E‑Mail‑Postfach, um Ihr Konto zu bestätigen, und melden Sie sich anschließend an. Unser Team prüft Ihre Bewerbung
              und begleitet Sie durch das Onboarding.
            </p>
            <Button variant="hero" onClick={() => navigate("/auth?role=childminder")}>
              Zur Anmeldung
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-6" style={{
      background: "radial-gradient(900px 520px at 10% 0%, hsla(44,93%,57%,0.18), transparent 60%), radial-gradient(900px 520px at 90% 20%, hsla(200,93%,23%,0.10), transparent 60%), linear-gradient(180deg, hsl(36,100%,97%), hsl(0,0%,100%))",
    }}>
      <div className="w-full max-w-[560px] mx-auto">
        <div className="text-center mb-6">
          <a href="/"><img src={logo} alt="KinderStars" className="w-[160px] mx-auto mb-4" /></a>
          <h1 className="text-xl font-bold tracking-tight">Als Kindertagespflegeperson bei KinderStars mitmachen</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Registrieren Sie sich unten – unser Team begleitet Sie durch Onboarding, Verifizierung und Ihre erste Vermittlung.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Personal Details */}
          <div className="ks-card p-5">
            <h2 className="font-bold text-sm mb-3">Persönliche Angaben</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="ks-field">
                <label>Vorname *</label>
                <input required value={form.firstName} onChange={(e) => update("firstName", e.target.value)} maxLength={50} />
              </div>
              <div className="ks-field">
                <label>Nachname *</label>
                <input required value={form.lastName} onChange={(e) => update("lastName", e.target.value)} maxLength={50} />
              </div>
              <div className="ks-field">
                <label>E‑Mail *</label>
                <input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} maxLength={255} />
              </div>
              <div className="ks-field">
                <label>Telefon *</label>
                <input type="tel" required value={form.phone} onChange={(e) => update("phone", e.target.value)} maxLength={20} />
              </div>
              <div className="ks-field col-span-full">
                <label>Adresse *</label>
                <input required value={form.address} onChange={(e) => update("address", e.target.value)} maxLength={200} />
              </div>
              <div className="ks-field">
                <label>PLZ *</label>
                <input required value={form.postcode} onChange={(e) => update("postcode", e.target.value)} maxLength={10} />
              </div>
              <div className="ks-field">
                <label>Passwort * (mind. 8 Zeichen)</label>
                <input type="password" required minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Compliance */}
          <div className="ks-card p-5">
            <h2 className="font-bold text-sm mb-3">Nachweise & Berechtigung</h2>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.rightToWork}
                  onChange={(e) => update("rightToWork", e.target.checked)}
                  className="mt-1 accent-primary"
                />
                <span className="text-sm">
                  Ich bestätige, dass ich zur <strong>selbstständigen Erwerbstätigkeit in Deutschland</strong> berechtigt bin *
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasDbs}
                  onChange={(e) => update("hasDbs", e.target.checked)}
                  className="mt-1 accent-primary"
                />
                <span className="text-sm">
                  Ich habe ein gültiges <strong>erweitertes Führungszeugnis</strong> (§ 30a BZRG)
                </span>
              </label>

              {form.hasDbs && (
                <div className="ks-field ml-7">
                  <label>Führungszeugnis‑Nr.</label>
                  <input value={form.dbsNumber} onChange={(e) => update("dbsNumber", e.target.value)} placeholder="z. B. FZ‑2026/12345" maxLength={50} />
                </div>
              )}
            </div>
          </div>

          {/* Experience */}
          <div className="ks-card p-5">
            <h2 className="font-bold text-sm mb-3">Erfahrung & Verfügbarkeit</h2>
            <div className="space-y-3">
              <div className="ks-field">
                <label>Kurzbeschreibung Ihrer Erfahrung</label>
                <textarea value={form.experienceSummary} onChange={(e) => update("experienceSummary", e.target.value)}
                  placeholder="Beschreiben Sie kurz Ihre Erfahrung, Qualifikationen und bevorzugte Altersgruppen…"
                  maxLength={1000} rows={3} />
              </div>
              <div className="ks-field">
                <label>Verfügbarkeit</label>
                <textarea value={form.availabilityNotes} onChange={(e) => update("availabilityNotes", e.target.value)}
                  placeholder="z. B. Mo–Fr 8:00–18:00 Uhr, flexible Wochenenden…"
                  maxLength={500} rows={2} />
              </div>
            </div>
          </div>

          {/* Safeguarding notice */}
          <div className="ks-card p-4 bg-primary/5 border-primary/20">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">🛡️ Kinderschutz:</strong> Alle Kindertagespflegepersonen durchlaufen unser Onboarding – erweitertes Führungszeugnis, Referenzen, Nachweis der Erwerbsberechtigung und ein persönliches Gespräch. KinderStars verpflichtet sich dem Schutzauftrag nach § 8a SGB VIII.
            </p>
          </div>

          {error && <p className="text-destructive text-xs font-medium">{error}</p>}

          <Button variant="hero" type="submit" disabled={submitting} className="w-full gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Wird gesendet…" : "Als Kindertagespflegeperson registrieren"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Already registered? <a href="/auth?role=childminder" className="underline font-medium text-foreground">Sign in</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterChildminder;
