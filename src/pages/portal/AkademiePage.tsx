import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { formatEUR } from "@/lib/pricing";
import { useSubscription } from "@/hooks/use-subscription";
import {
  GraduationCap, BookOpen, Clock, Award, CheckCircle2, Loader2, Package, Sparkles, Info
} from "lucide-react";

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  duration_minutes: number;
  price_cents: number;
  stripe_price_key: string | null;
  is_bundle: boolean;
  bundle_course_slugs: string[];
  included_in_professional: boolean;
  sort_order: number;
}

interface Enrollment {
  id: string;
  course_id: string;
  status: string;
  progress_percent: number;
  payment_status: string;
  completed_at: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  safeguarding: "Kinderschutz",
  compliance: "Recht & Compliance",
  health: "Gesundheit",
  pedagogy: "Pädagogik",
  business: "Selbstständigkeit",
  general: "Allgemein",
};

const CATEGORY_COLORS: Record<string, string> = {
  safeguarding: "bg-destructive/10 text-destructive",
  compliance: "bg-primary/15 text-foreground",
  health: "bg-success/10 text-success",
  pedagogy: "bg-secondary/10 text-secondary",
  business: "bg-primary/10 text-primary",
  general: "bg-muted text-muted-foreground",
};

const AkademiePage = () => {
  const { user } = useAuth();
  const { subscribed, plan } = useSubscription();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"courses" | "bundles" | "mine">("bundles");

  const isProfessional = subscribed && plan === "professional_compliance";

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [c, e] = await Promise.all([
      supabase.from("academy_courses").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("academy_enrollments").select("*").eq("user_id", user.id),
    ]);
    setCourses((c.data ?? []) as Course[]);
    setEnrollments((e.data ?? []) as Enrollment[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const enrolledIds = new Set(enrollments.map(e => e.course_id));
  const bySlug = new Map(courses.map(c => [c.slug, c]));

  const handleEnrol = async (course: Course) => {
    if (!user) return;
    setEnrollingId(course.id);
    try {
      const paid = !isProfessional && course.price_cents > 0;
      const rows = [{
        user_id: user.id,
        course_id: course.id,
        status: paid ? "pending_payment" : "enrolled",
        payment_status: paid ? "pending" : (isProfessional ? "included" : "free"),
      }];
      // Auto-enrol bundle children
      if (course.is_bundle) {
        for (const slug of course.bundle_course_slugs) {
          const child = bySlug.get(slug);
          if (child && !enrolledIds.has(child.id)) {
            rows.push({
              user_id: user.id,
              course_id: child.id,
              status: paid ? "pending_payment" : "enrolled",
              payment_status: paid ? "pending" : (isProfessional ? "included" : "free"),
            });
          }
        }
      }
      const { error } = await supabase.from("academy_enrollments").upsert(rows, { onConflict: "user_id,course_id" });
      if (error) throw error;
      toast({
        title: paid ? "Einschreibung reserviert" : "Eingeschrieben",
        description: paid
          ? `${course.title} — Zahlung wird nach Aktivierung von Stripe verarbeitet.`
          : `${course.title} wurde deiner Akademie hinzugefügt.`,
      });
      fetchData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Fehler beim Einschreiben";
      toast({ title: "Fehler", description: msg, variant: "destructive" });
    } finally {
      setEnrollingId(null);
    }
  };

  const bundles = courses.filter(c => c.is_bundle);
  const singles = courses.filter(c => !c.is_bundle);
  const mine = courses.filter(c => enrolledIds.has(c.id));

  const list = tab === "bundles" ? bundles : tab === "courses" ? singles : mine;

  if (loading) return (
    <div className="flex items-center gap-2 text-muted-foreground p-4">
      <Loader2 className="w-4 h-4 animate-spin" /> Akademie wird geladen…
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-secondary" /> KinderStars Akademie
        </h1>
        <p className="text-muted-foreground text-sm">
          Interne Kurse und Bundles — Zertifikate zur beruflichen Weiterbildung.
        </p>
      </div>

      <div className="ks-card p-3 flex items-start gap-2 bg-primary/5 border-primary/20">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Zertifikate der KinderStars Akademie sind Nachweise zur beruflichen Weiterbildung
          und <strong>keine staatlich anerkannte Qualifikation</strong> (z. B. QHB oder Erste-Hilfe-Kurs).
          Externe Kurse findest du unter Externe Kurse.
        </p>
      </div>

      {isProfessional && (
        <div className="ks-card p-3 flex items-center gap-2 bg-success/10 border-success/30">
          <Sparkles className="w-4 h-4 text-success" />
          <p className="text-sm text-success font-medium">
            Professional Compliance aktiv — alle Kurse und Bundles sind für dich inklusive.
          </p>
        </div>
      )}

      <div className="flex gap-1 p-1 bg-muted rounded-xl">
        {([
          { id: "bundles", label: `Bundles (${bundles.length})` },
          { id: "courses", label: `Einzelkurse (${singles.length})` },
          { id: "mine", label: `Meine (${mine.length})` },
        ] as const).map(x => (
          <button
            key={x.id}
            onClick={() => setTab(x.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              tab === x.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {list.length === 0 ? (
          <div className="ks-card p-10 text-center text-muted-foreground text-sm">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
            {tab === "mine" ? "Noch keine Einschreibungen." : "Keine Kurse in dieser Kategorie."}
          </div>
        ) : list.map(course => {
          const isEnrolled = enrolledIds.has(course.id);
          const enrolment = enrollments.find(e => e.course_id === course.id);
          const priceLabel = isProfessional
            ? "Inklusive"
            : course.price_cents === 0
            ? "Kostenlos"
            : formatEUR(course.price_cents);
          return (
            <div key={course.id} className={`ks-card p-4 ${isEnrolled ? "border-success/30 bg-success/5" : ""}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                  {course.is_bundle ? <Package className="w-5 h-5 text-secondary" /> : <BookOpen className="w-5 h-5 text-secondary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm leading-tight">{course.title}</h3>
                    <span className="text-sm font-bold text-secondary shrink-0">{priceLabel}</span>
                  </div>
                  {course.description && (
                    <p className="text-xs text-muted-foreground mt-1">{course.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[course.category] || CATEGORY_COLORS.general}`}>
                      {CATEGORY_LABELS[course.category] || course.category}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> {Math.round(course.duration_minutes / 60 * 10) / 10}h
                    </span>
                    {course.is_bundle && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-foreground">
                        {course.bundle_course_slugs.length} Kurse
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                {isEnrolled ? (
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-success font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Eingeschrieben
                    </span>
                    {enrolment && enrolment.progress_percent > 0 && (
                      <span className="text-muted-foreground">{enrolment.progress_percent}% Fortschritt</span>
                    )}
                    {enrolment?.completed_at && (
                      <span className="flex items-center gap-1 text-primary">
                        <Award className="w-3.5 h-3.5" /> Zertifikat verfügbar
                      </span>
                    )}
                  </div>
                ) : <span />}
                {!isEnrolled && (
                  <Button
                    size="sm"
                    className="gap-1.5 h-8 text-xs ml-auto"
                    disabled={enrollingId === course.id}
                    onClick={() => handleEnrol(course)}
                  >
                    {enrollingId === course.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
                    {isProfessional ? "Einschreiben" : (course.price_cents === 0 ? "Kostenlos starten" : `Buchen · ${priceLabel}`)}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AkademiePage;