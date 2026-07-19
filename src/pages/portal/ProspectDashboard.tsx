import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle2, Circle, GraduationCap, Shield, FileText, Heart,
  Award, UserCheck, ClipboardList, Loader2, BookOpen, Building2, MapPin
} from "lucide-react";

type Regulator = "ofsted" | "ciw" | "care_inspectorate" | "rqia";

// German aufsichtsführende Stellen: örtliches Jugendamt (Pflegeerlaubnis nach § 43 SGB VIII)
// plus Landesjugendamt (überregionale Aufsicht). We map the four legacy codes to German
// regional groupings so existing DB values continue to load.
const REGULATOR_INFO: Record<Regulator, { name: string; fullName: string; region: string; icon: typeof Building2 }> = {
  ofsted: { name: "Jugendamt Nord/West", fullName: "Örtliches Jugendamt – NRW, Niedersachsen, Bremen, Hamburg, SH, MV", region: "Nord & Nordrhein-Westfalen", icon: Building2 },
  ciw: { name: "Jugendamt Süd", fullName: "Örtliches Jugendamt – Bayern, Baden-Württemberg", region: "Süddeutschland", icon: Building2 },
  care_inspectorate: { name: "Jugendamt Mitte", fullName: "Örtliches Jugendamt – Hessen, RLP, Saarland, Thüringen", region: "Mitte", icon: Building2 },
  rqia: { name: "Jugendamt Ost", fullName: "Örtliches Jugendamt – Berlin, Brandenburg, Sachsen, Sachsen-Anhalt", region: "Berlin & Ostdeutschland", icon: Building2 },
};

interface TrainingTask {
  key: string;
  label: string;
  category: string;
  icon: typeof Shield;
}

const COMMON_TASKS: TrainingTask[] = [
  { key: "fz_applied", label: "Erweitertes Führungszeugnis nach § 30a BZRG beantragt", category: "safeguarding", icon: Shield },
  { key: "fz_received", label: "Erweitertes Führungszeugnis vorliegend (max. 3 Monate alt)", category: "safeguarding", icon: Shield },
  { key: "first_aid_enrolled", label: "Erste‑Hilfe‑Kurs am Kind angemeldet (mind. 9 UE)", category: "training", icon: Heart },
  { key: "first_aid_completed", label: "Erste‑Hilfe‑Kurs am Kind abgeschlossen", category: "training", icon: Heart },
  { key: "kinderschutz_8a", label: "Kinderschutz‑Schulung nach § 8a SGB VIII", category: "training", icon: Shield },
  { key: "belehrung_43_ifsg", label: "Belehrung nach § 43 IfSG (Infektionsschutz) beim Gesundheitsamt", category: "training", icon: Award },
  { key: "dsgvo_training", label: "DSGVO‑Basisschulung für Kindertagespflege", category: "training", icon: Shield },
  { key: "insurance_obtained", label: "Berufshaftpflicht- & Unfallversicherung abgeschlossen (BGW)", category: "compliance", icon: FileText },
  { key: "premises_risk", label: "Räumlichkeiten geprüft (Gefährdungsbeurteilung Wohnung)", category: "compliance", icon: MapPin },
  { key: "policies_drafted", label: "Konzeption erstellt (Kinderschutz, Beschwerden, DSGVO)", category: "compliance", icon: FileText },
  { key: "qualifikation_160h", label: "160‑Stunden‑Grundqualifikation Kindertagespflege (DJI‑Curriculum)", category: "training", icon: BookOpen },
];

const REGIONAL_TASKS: TrainingTask[] = [
  { key: "jugendamt_application", label: "Antrag auf Pflegeerlaubnis (§ 43 SGB VIII) beim örtlichen Jugendamt eingereicht", category: "registration", icon: Building2 },
  { key: "eignungspruefung", label: "Eignungsprüfung durch das Jugendamt absolviert", category: "registration", icon: Shield },
  { key: "raumbegehung", label: "Raumbegehung / Ortstermin durch das Jugendamt", category: "registration", icon: Building2 },
  { key: "pflegeerlaubnis_43", label: "Pflegeerlaubnis nach § 43 SGB VIII erteilt", category: "registration", icon: Award },
  { key: "landesjugendamt_check", label: "Meldung / Prüfung durch das Landesjugendamt (§ 45 SGB VIII, falls einschlägig)", category: "registration", icon: Building2 },
];

const REGULATOR_TASKS: Record<Regulator, TrainingTask[]> = {
  ofsted: REGIONAL_TASKS,
  ciw: REGIONAL_TASKS,
  care_inspectorate: REGIONAL_TASKS,
  rqia: REGIONAL_TASKS,
};

const CATEGORIES = [
  { key: "safeguarding", label: "Kinderschutz & Führungszeugnis" },
  { key: "training", label: "Qualifizierung & Fortbildung" },
  { key: "compliance", label: "Compliance & Versicherung" },
  { key: "registration", label: "Pflegeerlaubnis & Jugendamt" },
];

const ProspectDashboard = () => {
  const { user } = useAuth();
  const [regulator, setRegulator] = useState<Regulator | null>(null);
  const [tasks, setTasks] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: profile }, { data: trainingRows }] = await Promise.all([
      supabase.from("childminder_profiles").select("regulator, prospect_stage, onboarding_status").eq("user_id", user.id).maybeSingle(),
      supabase.from("prospect_training").select("task_key, completed").eq("user_id", user.id),
    ]);

    if (profile?.regulator) {
      setRegulator(profile.regulator as Regulator);
    }

    const map: Record<string, boolean> = {};
    trainingRows?.forEach((r) => (map[r.task_key] = r.completed));
    setTasks(map);
    setLoading(false);
  };

  const selectRegulator = async (reg: Regulator) => {
    if (!user) return;
    setRegulator(reg);

    // Upsert childminder profile with regulator and prospect stage
    const { error } = await supabase
      .from("childminder_profiles")
      .upsert(
        {
          user_id: user.id,
          regulator: reg,
          prospect_stage: "prospect",
          onboarding_status: "pending",
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Failed to save regulator:", error);
      toast({ title: "Fehler", description: "Auswahl konnte nicht gespeichert werden.", variant: "destructive" });
    }
  };

  const toggleTask = async (key: string, label: string, category: string) => {
    if (!user || !regulator) return;
    const newVal = !tasks[key];
    setTasks((prev) => ({ ...prev, [key]: newVal }));

    await supabase.from("prospect_training").upsert(
      {
        user_id: user.id,
        regulator,
        task_key: key,
        task_label: label,
        category,
        completed: newVal,
        completed_at: newVal ? new Date().toISOString() : null,
      },
      { onConflict: "user_id,task_key" }
    );
  };

  const allTasks = regulator ? [...COMMON_TASKS, ...REGULATOR_TASKS[regulator]] : COMMON_TASKS;
  const completedCount = allTasks.filter((t) => tasks[t.key]).length;
  const progress = allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0;

  const handleRequestReview = async () => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from("childminder_profiles")
      .update({ prospect_stage: "ready_for_review" })
      .eq("user_id", user.id);
    setSaving(false);
    toast({ title: "Prüfung angefragt!", description: "Ein Admin prüft Ihren Fortschritt und meldet sich mit den nächsten Schritten." });
  };

  if (loading) return <div className="text-muted-foreground p-4">Anwärter‑Dashboard wird geladen…</div>;

  // Step 1: Select regulator if not chosen
  if (!regulator) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kindertagespflegeperson werden 🌟</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Willkommen auf dem Weg zur anerkannten Kindertagespflegeperson! Wählen Sie zunächst Ihre Region, um das zuständige Jugendamt zu bestimmen.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(Object.entries(REGULATOR_INFO) as [Regulator, typeof REGULATOR_INFO.ofsted][]).map(([key, info]) => (
            <button
              key={key}
              onClick={() => selectRegulator(key)}
              className="ks-card p-5 text-left hover:shadow-lg hover:border-primary/30 transition-all group"
            >
              <div className="ks-icon-box">
                <info.icon className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="font-bold text-sm group-hover:text-secondary transition-colors">{info.name}</h3>
              <p className="text-muted-foreground text-xs mt-1">{info.fullName}</p>
              <span className="ks-tag mt-2 text-xs">{info.region}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const regulatorInfo = REGULATOR_INFO[regulator];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Anwärter‑Dashboard 🎓</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ihr Weg zur Pflegeerlaubnis nach § 43 SGB VIII über {regulatorInfo.name} ({regulatorInfo.region})
        </p>
      </div>

      {/* Progress overview */}
      <div className="ks-card p-4">
        <div className="flex items-center gap-3 mb-3">
          <GraduationCap className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-sm">Qualifizierungs‑Fortschritt</p>
            <p className="text-xs text-muted-foreground">{completedCount} von {allTasks.length} Aufgaben erledigt</p>
          </div>
          <span className="ks-tag font-bold">{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Tasks by category */}
      {CATEGORIES.map((cat) => {
        const catTasks = allTasks.filter((t) => t.category === cat.key);
        if (catTasks.length === 0) return null;
        const catCompleted = catTasks.filter((t) => tasks[t.key]).length;

        return (
          <div key={cat.key}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-sm">{cat.label}</h2>
              <span className="text-xs text-muted-foreground">{catCompleted}/{catTasks.length}</span>
            </div>
            <div className="ks-card divide-y divide-border">
              {catTasks.map((task) => {
                const Icon = task.icon;
                const done = tasks[task.key];
                return (
                  <button
                    key={task.key}
                    onClick={() => toggleTask(task.key, task.label, task.category)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
                  >
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                    <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className={`text-sm ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {task.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Request review */}
      {progress === 100 && (
        <Button variant="hero" onClick={handleRequestReview} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
          Prüfung durch Admin anfordern
        </Button>
      )}

      {progress < 100 && (
        <div className="ks-card p-4 bg-muted/50">
          <p className="text-sm text-muted-foreground">
            💡 Erledigen Sie alle Aufgaben oben und fordern Sie anschließend die Prüfung an. Nach Erteilung der Pflegeerlaubnis nach § 43 SGB VIII werden Sie automatisch ins vollständige Betreuungspersonen‑Dashboard überführt.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProspectDashboard;
