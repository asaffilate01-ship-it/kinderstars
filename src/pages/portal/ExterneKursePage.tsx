import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, GraduationCap, Info, Shield, Heart, Languages, FileText, Calculator, BookOpen } from "lucide-react";

interface PartnerCourse {
  id: string;
  slug: string;
  provider: string;
  title: string;
  description: string | null;
  category: string;
  price_label: string | null;
  duration_label: string | null;
  logo_url: string | null;
  referral_url: string;
  commission_label: string | null;
  sort_order: number;
}

const CATEGORY_META: Record<string, { label: string; Icon: React.ComponentType<{ className?: string }>; color: string }> = {
  first_aid: { label: "Erste Hilfe", Icon: Heart, color: "bg-destructive/10 text-destructive" },
  qhb: { label: "QHB / Grundqualifizierung", Icon: GraduationCap, color: "bg-primary/15 text-foreground" },
  language: { label: "Sprache", Icon: Languages, color: "bg-secondary/10 text-secondary" },
  translation: { label: "Übersetzung", Icon: FileText, color: "bg-muted text-muted-foreground" },
  tax: { label: "Steuern", Icon: Calculator, color: "bg-primary/10 text-primary" },
  insurance: { label: "Versicherung", Icon: Shield, color: "bg-success/10 text-success" },
  general: { label: "Allgemein", Icon: BookOpen, color: "bg-muted text-muted-foreground" },
};

const ExterneKursePage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<PartnerCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("partner_courses")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    setCourses((data ?? []) as PartnerCourse[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpen = async (course: PartnerCourse) => {
    if (user) {
      await supabase.from("partner_referrals").insert({
        user_id: user.id,
        partner_course_id: course.id,
      });
    }
    const url = new URL(course.referral_url);
    if (user) url.searchParams.set("ref", `ks_${user.id.slice(0, 8)}`);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  };

  const categories = ["all", ...Array.from(new Set(courses.map(c => c.category)))];
  const filtered = filter === "all" ? courses : courses.filter(c => c.category === filter);

  if (loading) return (
    <div className="flex items-center gap-2 text-muted-foreground p-4">
      <Loader2 className="w-4 h-4 animate-spin" /> Externe Kurse werden geladen…
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ExternalLink className="w-6 h-6 text-secondary" /> Externe Kurse & Partner
        </h1>
        <p className="text-muted-foreground text-sm">
          Anerkannte Präsenz- und Onlinekurse unserer Partner — Erste Hilfe, QHB, Sprache, Steuern.
        </p>
      </div>

      <div className="ks-card p-3 flex items-start gap-2 bg-primary/5 border-primary/20">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          KinderStars ist kein Anbieter dieser Kurse. Wir vermitteln zu geprüften Partnern und erhalten
          gegebenenfalls eine Empfehlungsprovision. Vertrag, Preis und Zertifikat kommen direkt vom Anbieter.
        </p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {categories.map(cat => {
          const meta = CATEGORY_META[cat];
          const label = cat === "all" ? "Alle" : (meta?.label ?? cat);
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === cat ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="ks-card p-10 text-center text-muted-foreground text-sm">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
            Keine Partner in dieser Kategorie.
          </div>
        ) : filtered.map(course => {
          const meta = CATEGORY_META[course.category] ?? CATEGORY_META.general;
          const { Icon } = meta;
          return (
            <div key={course.id} className="ks-card p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm leading-tight">{course.title}</h3>
                      <p className="text-[11px] text-muted-foreground">{course.provider}</p>
                    </div>
                    {course.price_label && (
                      <span className="text-sm font-bold text-secondary shrink-0">{course.price_label}</span>
                    )}
                  </div>
                  {course.description && (
                    <p className="text-xs text-muted-foreground mt-1">{course.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${meta.color}`}>
                      {meta.label}
                    </span>
                    {course.duration_label && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {course.duration_label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => handleOpen(course)}>
                  <ExternalLink className="w-3.5 h-3.5" /> Beim Anbieter buchen
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExterneKursePage;