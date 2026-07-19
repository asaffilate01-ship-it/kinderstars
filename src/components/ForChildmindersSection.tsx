import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import AnimatedSection from "@/components/AnimatedSection";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, ClipboardList, GraduationCap, ShieldCheck, UserCheck, FileText, Rocket, CheckCircle2, Circle, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const STEP_TASK_MAPPINGS: Record<number, string[]> = {
  0: [], // Express interest — no matching task, always manual
  1: ["fz_applied", "fz_received"],
  2: ["first_aid_enrolled", "first_aid_completed", "kinderschutz_8a", "belehrung_43_ifsg", "dsgvo_training", "qualifikation_160h"],
  3: ["jugendamt_application", "eignungspruefung", "pflegeerlaubnis_43", "landesjugendamt_check"],
  4: [], // KinderStars onboarding — internal
  5: [], // Go live — internal
};

const becomeSteps = [
  {
    icon: ClipboardList,
    title: "1. Interesse bekunden",
    desc: "Füllen Sie unser Kontaktformular aus (Option: Kindertagespflegeperson werden) oder schreiben Sie an info@kinderstars.de. Wir vereinbaren ein persönliches Gespräch.",
  },
  {
    icon: ShieldCheck,
    title: "2. Erweitertes Führungszeugnis",
    desc: "Wir begleiten Sie bei der Beantragung des erweiterten Führungszeugnisses nach § 30a BZRG. Voraussetzung, bevor Sie Kinder betreuen dürfen.",
  },
  {
    icon: GraduationCap,
    title: "3. Qualifizierung abschließen",
    desc: "Erste‑Hilfe am Kind, Kinderschutz nach § 8a SGB VIII, Belehrung nach § 43 IfSG und der 160‑Stunden‑Grundkurs Kindertagespflege. KinderStars stellt eine persönliche Checkliste bereit.",
  },
  {
    icon: FileText,
    title: "4. Pflegeerlaubnis beim Jugendamt",
    desc: "Antrag auf Pflegeerlaubnis nach § 43 SGB VIII beim örtlichen Jugendamt, inkl. Eignungsprüfung und Raumbegehung. Wir begleiten Sie bei den Unterlagen.",
  },
  {
    icon: UserCheck,
    title: "5. KinderStars Onboarding",
    desc: "Qualitätsprüfung, Profil einrichten und Räumlichkeiten vorbereiten. Wir prüfen Ihre Nachweise und schalten Sie im Verzeichnis frei.",
  },
  {
    icon: Rocket,
    title: "6. Live gehen & betreuen",
    desc: "Sie sind im Verzeichnis sichtbar und empfangen Elternanfragen. KinderStars unterstützt Sie weiterhin mit Mentoring, Fortbildung und Compliance.",
  },
];

function useProspectProgress() {
  const { user } = useAuth();
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) { setLoaded(true); return; }
    supabase
      .from("prospect_training")
      .select("task_key, completed")
      .eq("user_id", user.id)
      .eq("completed", true)
      .then(({ data }) => {
        setCompletedKeys(new Set(data?.map((r) => r.task_key) ?? []));
        setLoaded(true);
      });
  }, [user]);

  const getStepStatus = (stepIndex: number): "complete" | "partial" | "none" => {
    const keys = STEP_TASK_MAPPINGS[stepIndex];
    if (!keys || keys.length === 0) return "none";
    const matched = keys.filter((k) => completedKeys.has(k));
    if (matched.length === 0) return "none";
    if (matched.length >= keys.length) return "complete";
    return "partial";
  };

  return { loaded, isLoggedIn: !!user, getStepStatus, completedKeys };
}

const ForChildmindersSection = () => {
  const { t } = useTranslation();
  const [showGuide, setShowGuide] = useState(false);
  const { loaded, isLoggedIn, getStepStatus } = useProspectProgress();

  const perks = [
    { icon: "📣", title: t("childminders.visibilityTitle"), desc: t("childminders.visibilityDesc") },
    { icon: "🎓", title: t("childminders.trainingTitle"), desc: t("childminders.trainingDesc") },
    { icon: "📋", title: t("childminders.complianceTitle"), desc: t("childminders.complianceDesc") },
    { icon: "🤝", title: t("childminders.mentoringTitle"), desc: t("childminders.mentoringDesc") },
  ];

  return (
    <section id="for-childminders" className="ks-card ks-section mt-4">
      <AnimatedSection>
        <span className="ks-tag text-xs font-bold uppercase tracking-widest">{t("childminders.tag")}</span>
        <h2 className="text-2xl font-bold tracking-tight mt-2.5 mb-1.5">{t("childminders.heading")}</h2>
        <p className="text-muted-foreground text-sm max-w-[62ch]">{t("childminders.description")}</p>
      </AnimatedSection>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {perks.map((p, i) => (
          <AnimatedSection key={i} delay={i * 0.08}>
            <div className="ks-tile h-full">
              <div className="ks-icon-box" aria-hidden="true">{p.icon}</div>
              <h3 className="font-semibold text-[15.5px] mb-2">{p.title}</h3>
              <p className="text-muted-foreground text-[13.5px]">{p.desc}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>

      <AnimatedSection delay={0.3}>
        <div className="mt-4 flex gap-2.5 flex-wrap">
          <Button variant="hero" asChild>
            <a href="/auth?role=childminder">Als Kindertagespflegeperson registrieren</a>
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowGuide((v) => !v)}
            className="gap-1.5"
          >
            Kindertagespflegeperson werden
            {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" asChild><a href="#faq">{t("childminders.readFaq")}</a></Button>
        </div>
      </AnimatedSection>

      {/* Expandable "How to become a childminder" guide */}
      {showGuide && (
        <AnimatedSection delay={0.05}>
          <div className="mt-5 rounded-2xl border border-border bg-muted/30 p-5">
            <h3 className="text-lg font-bold mb-1">Wie werde ich Kindertagespflegeperson?</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-[56ch]">
              Diese Schritte begleiten Sie auf dem Weg zur anerkannten Kindertagespflegeperson. KinderStars unterstützt Sie in jeder Phase – von der ersten Anfrage bis zum Start.
            </p>

            {/* Progress summary for logged-in prospects */}
            {isLoggedIn && loaded && (
              <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Ihr Fortschritt aus dem Anwärter‑Dashboard wird unten angezeigt.</span>
              </div>
            )}
            {!isLoggedIn && (
              <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                <LogIn className="w-4 h-4" />
                <span>
                  <a href="/auth?role=childminder" className="underline text-primary hover:text-primary/80">Anmelden</a>, um Ihren persönlichen Fortschritt zu sehen.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {becomeSteps.map((step, i) => {
                const status = loaded && isLoggedIn ? getStepStatus(i) : "none";
                return (
                  <div
                    key={i}
                    className={`ks-tile flex flex-col gap-2 transition-all ${
                      status === "complete" ? "ring-2 ring-primary/30 bg-primary/5" : 
                      status === "partial" ? "ring-1 ring-primary/20 bg-primary/[0.02]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`rounded-lg p-2 ${
                        status === "complete" ? "bg-primary/20" : "bg-primary/10"
                      }`}>
                        {status === "complete" ? (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        ) : (
                          <step.icon className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <h4 className="font-semibold text-sm flex-1">{step.title}</h4>
                      {status === "partial" && (
                        <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">In Bearbeitung</span>
                      )}
                      {status === "complete" && (
                        <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Erledigt</span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-[13px] leading-relaxed">{step.desc}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex gap-2.5 flex-wrap">
              <Button variant="hero" size="sm" asChild>
                <a href="#contact">Jetzt starten – Kontakt aufnehmen</a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="#faq">Zum FAQ</a>
              </Button>
            </div>
          </div>
        </AnimatedSection>
      )}
    </section>
  );
};

export default ForChildmindersSection;
