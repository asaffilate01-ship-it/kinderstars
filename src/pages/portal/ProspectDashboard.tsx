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

const REGULATOR_INFO: Record<Regulator, { name: string; fullName: string; region: string; icon: typeof Building2 }> = {
  ofsted: { name: "Ofsted", fullName: "Office for Standards in Education", region: "England", icon: Building2 },
  ciw: { name: "CIW", fullName: "Care Inspectorate Wales", region: "Wales", icon: Building2 },
  care_inspectorate: { name: "Care Inspectorate", fullName: "Care Inspectorate Scotland", region: "Scotland", icon: Building2 },
  rqia: { name: "RQIA", fullName: "Regulation and Quality Improvement Authority", region: "Northern Ireland", icon: Building2 },
};

interface TrainingTask {
  key: string;
  label: string;
  category: string;
  icon: typeof Shield;
}

const COMMON_TASKS: TrainingTask[] = [
  { key: "dbs_applied", label: "Apply for Enhanced DBS/PVG/AccessNI check", category: "safeguarding", icon: Shield },
  { key: "dbs_received", label: "DBS/PVG/AccessNI certificate received", category: "safeguarding", icon: Shield },
  { key: "first_aid_enrolled", label: "Enrol in Paediatric First Aid course (12 hours)", category: "training", icon: Heart },
  { key: "first_aid_completed", label: "Complete Paediatric First Aid certification", category: "training", icon: Heart },
  { key: "safeguarding_level2", label: "Complete Safeguarding Children Level 2 training", category: "training", icon: Shield },
  { key: "food_hygiene", label: "Complete Food Hygiene Level 2 certificate", category: "training", icon: Award },
  { key: "prevent_training", label: "Complete Prevent Duty awareness training", category: "training", icon: Shield },
  { key: "insurance_obtained", label: "Obtain Public Liability & Professional Indemnity insurance", category: "compliance", icon: FileText },
  { key: "premises_risk", label: "Complete home risk assessment for childminding premises", category: "compliance", icon: MapPin },
  { key: "policies_drafted", label: "Draft essential policies (safeguarding, behaviour, complaints, GDPR)", category: "compliance", icon: FileText },
  { key: "eyfs_training", label: "Complete EYFS (Early Years Foundation Stage) awareness course", category: "training", icon: BookOpen },
];

const REGULATOR_TASKS: Record<Regulator, TrainingTask[]> = {
  ofsted: [
    { key: "ofsted_application", label: "Submit Ofsted registration application (EY2)", category: "registration", icon: Building2 },
    { key: "ofsted_dbs_check", label: "Complete Ofsted DBS suitability check for all household members (16+)", category: "registration", icon: Shield },
    { key: "ofsted_health_dec", label: "Submit Health Declaration Booklet to Ofsted", category: "registration", icon: FileText },
    { key: "ofsted_intro_visit", label: "Receive Ofsted introductory visit", category: "registration", icon: Building2 },
    { key: "ofsted_urn_received", label: "Ofsted URN received — registration confirmed", category: "registration", icon: Award },
  ],
  ciw: [
    { key: "ciw_application", label: "Submit CIW registration application", category: "registration", icon: Building2 },
    { key: "ciw_statement", label: "Draft Statement of Purpose for CIW", category: "registration", icon: FileText },
    { key: "ciw_welsh_regs", label: "Complete Welsh regulatory framework awareness training", category: "training", icon: BookOpen },
    { key: "ciw_visit", label: "Receive CIW initial registration visit", category: "registration", icon: Building2 },
    { key: "ciw_registered", label: "CIW registration confirmed", category: "registration", icon: Award },
  ],
  care_inspectorate: [
    { key: "ci_application", label: "Submit Care Inspectorate registration application", category: "registration", icon: Building2 },
    { key: "ci_pvg", label: "Complete PVG scheme membership (Disclosure Scotland)", category: "safeguarding", icon: Shield },
    { key: "ci_scqf", label: "Enrol in SCQF Level 7 (or equivalent) early years qualification", category: "training", icon: GraduationCap },
    { key: "ci_visit", label: "Receive Care Inspectorate initial assessment visit", category: "registration", icon: Building2 },
    { key: "ci_registered", label: "Care Inspectorate registration confirmed", category: "registration", icon: Award },
  ],
  rqia: [
    { key: "rqia_application", label: "Submit RQIA registration application", category: "registration", icon: Building2 },
    { key: "rqia_access_ni", label: "Complete AccessNI Enhanced Disclosure", category: "safeguarding", icon: Shield },
    { key: "rqia_minimum_standards", label: "Review RQIA Minimum Standards for childminding", category: "training", icon: BookOpen },
    { key: "rqia_visit", label: "Receive RQIA pre-registration visit", category: "registration", icon: Building2 },
    { key: "rqia_registered", label: "RQIA registration confirmed", category: "registration", icon: Award },
  ],
};

const CATEGORIES = [
  { key: "safeguarding", label: "Safeguarding & DBS" },
  { key: "training", label: "Training & Qualifications" },
  { key: "compliance", label: "Compliance & Insurance" },
  { key: "registration", label: "Regulator Registration" },
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
      toast({ title: "Error", description: "Failed to save your selection.", variant: "destructive" });
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
    toast({ title: "Review requested!", description: "An admin will review your training progress and contact you about next steps." });
  };

  if (loading) return <div className="text-muted-foreground p-4">Loading training dashboard…</div>;

  // Step 1: Select regulator if not chosen
  if (!regulator) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Become a Childminder 🌟</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome to your journey to becoming a registered childminder! First, tell us which region you'll be working in.
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
        <h1 className="text-2xl font-bold tracking-tight">Trainee Dashboard 🎓</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your training pathway to {regulatorInfo.name} registration ({regulatorInfo.region})
        </p>
      </div>

      {/* Progress overview */}
      <div className="ks-card p-4">
        <div className="flex items-center gap-3 mb-3">
          <GraduationCap className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-sm">Training Progress</p>
            <p className="text-xs text-muted-foreground">{completedCount} of {allTasks.length} tasks completed</p>
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
          Request Admin Review
        </Button>
      )}

      {progress < 100 && (
        <div className="ks-card p-4 bg-muted/50">
          <p className="text-sm text-muted-foreground">
            💡 Complete all tasks above, then request an admin review. Once your {regulatorInfo.name} registration is confirmed, you'll be migrated to the full Childminder Dashboard.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProspectDashboard;
