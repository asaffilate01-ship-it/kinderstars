import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  GraduationCap, BookOpen, Clock, Award, CheckCircle2, Plus, Loader2, ExternalLink,
  Trophy, Calendar, ChevronDown, ChevronUp, Star
} from "lucide-react";
import { format } from "date-fns";

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string;
  delivery_type: string;
  duration_hours: number | null;
  price_pence: number;
  is_cpd: boolean | null;
  cpd_hours: number | null;
  certificate_issued: boolean | null;
  stripe_price_id: string | null;
  provider: string | null;
  location: string | null;
}

interface CPDRecord {
  id: string;
  title: string;
  category: string;
  hours: number;
  completed_date: string;
  provider: string | null;
  verified: boolean | null;
  notes: string | null;
}

interface TrainingBooking {
  id: string;
  course_id: string | null;
  status: string;
  payment_status: string;
  booked_date: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  safeguarding: "bg-destructive/10 text-destructive",
  first_aid: "bg-success/10 text-success",
  childcare: "bg-secondary/10 text-secondary",
  management: "bg-primary/15 text-foreground",
  general: "bg-muted text-muted-foreground",
};

const TrainingPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [cpdRecords, setCpdRecords] = useState<CPDRecord[]>([]);
  const [bookings, setBookings] = useState<TrainingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"courses" | "cpd">("courses");
  const [showAddCPD, setShowAddCPD] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // CPD form state
  const [cpdForm, setCpdForm] = useState({
    title: "",
    category: "general",
    hours: "",
    completed_date: "",
    provider: "",
    notes: "",
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [coursesRes, cpdRes, bookingsRes] = await Promise.all([
      supabase.from("training_courses").select("*").eq("is_active", true).order("category"),
      supabase.from("cpd_records").select("*").eq("user_id", user.id).order("completed_date", { ascending: false }),
      supabase.from("training_bookings").select("*").eq("user_id", user.id),
    ]);
    setCourses((coursesRes.data ?? []) as Course[]);
    setCpdRecords((cpdRes.data ?? []) as CPDRecord[]);
    setBookings((bookingsRes.data ?? []) as TrainingBooking[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleBookCourse = async (course: Course) => {
    if (!user) return;
    setBookingId(course.id);
    try {
      if (course.price_pence > 0 && course.stripe_price_id) {
        // Paid course — go to Stripe
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: { price_id: course.stripe_price_id, mode: "payment" },
        });
        if (error) throw error;
        if (data?.url) window.open(data.url, "_blank");
      } else {
        // Free course — record booking directly
        const { error } = await supabase.from("training_bookings").insert({
          user_id: user.id,
          course_id: course.id,
          status: "confirmed",
          payment_status: "free",
          booked_date: new Date().toISOString().split("T")[0],
        });
        if (error) throw error;
        toast({ title: "Enrolled!", description: `You're enrolled in ${course.title}` });
        fetchData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error booking course";
      toast({ title: "Booking failed", description: msg, variant: "destructive" });
    } finally {
      setBookingId(null);
    }
  };

  const handleAddCPD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !cpdForm.title || !cpdForm.completed_date || !cpdForm.hours) return;
    setSubmitting(true);
    const { error } = await supabase.from("cpd_records").insert({
      user_id: user.id,
      title: cpdForm.title,
      category: cpdForm.category,
      hours: parseFloat(cpdForm.hours),
      completed_date: cpdForm.completed_date,
      provider: cpdForm.provider || null,
      notes: cpdForm.notes || null,
    });
    if (error) {
      toast({ title: "Error saving CPD record", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "CPD record added!" });
      setCpdForm({ title: "", category: "general", hours: "", completed_date: "", provider: "", notes: "" });
      setShowAddCPD(false);
      fetchData();
    }
    setSubmitting(false);
  };

  const bookedCourseIds = new Set(bookings.map(b => b.course_id));
  const totalCpdHours = cpdRecords.reduce((sum, r) => sum + (r.hours || 0), 0);

  if (loading) return (
    <div className="flex items-center gap-2 text-muted-foreground p-4">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading training…
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-secondary" /> {t('portal.training.title', 'Training & CPD')}
          </h1>
          <p className="text-muted-foreground text-sm">{t('portal.training.browseDesc', 'Browse courses and track your professional development.')}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="ks-card p-4 text-center">
          <Trophy className="w-5 h-5 mx-auto mb-1 text-primary" />
          <div className="text-xl font-bold">{totalCpdHours.toFixed(1)}</div>
          <div className="text-[11px] text-muted-foreground">{t('portal.training.cpdHours', 'CPD Hours')}</div>
        </div>
        <div className="ks-card p-4 text-center">
          <BookOpen className="w-5 h-5 mx-auto mb-1 text-secondary" />
          <div className="text-xl font-bold">{bookings.length}</div>
          <div className="text-[11px] text-muted-foreground">Enrolled</div>
        </div>
        <div className="ks-card p-4 text-center">
          <Award className="w-5 h-5 mx-auto mb-1 text-success" />
          <div className="text-xl font-bold">{cpdRecords.length}</div>
          <div className="text-[11px] text-muted-foreground">Records</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl">
        {(["courses", "cpd"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "courses" ? "Browse Courses" : "My CPD Records"}
          </button>
        ))}
      </div>

      {/* Courses tab */}
      {tab === "courses" && (
        <div className="space-y-3">
          {courses.length === 0 ? (
            <div className="ks-card p-10 text-center text-muted-foreground text-sm">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Noch keine Kurse verfügbar – schauen Sie bald wieder vorbei.
            </div>
          ) : courses.map(course => {
            const isBooked = bookedCourseIds.has(course.id);
            const isFree = course.price_pence === 0;
            const price = isFree ? "Kostenlos" : `€${(course.price_pence / 100).toFixed(2)}`;
            return (
              <div key={course.id} className={`ks-card p-4 ${isBooked ? "border-success/30 bg-success/5" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-sm leading-tight">{course.title}</h3>
                        {course.provider && (
                          <p className="text-[11px] text-muted-foreground">{course.provider}</p>
                        )}
                      </div>
                      <span className="text-sm font-bold text-secondary shrink-0">{price}</span>
                    </div>
                    {course.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[course.category] || CATEGORY_COLORS.general}`}>
                        {course.category.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {course.delivery_type}
                      </span>
                      {course.duration_hours && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> {course.duration_hours}h
                        </span>
                      )}
                      {course.is_cpd && course.cpd_hours && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-foreground flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5" /> {course.cpd_hours} CPD hrs
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  {isBooked ? (
                    <span className="flex items-center gap-1 text-xs text-success font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant={isFree ? "outline" : "default"}
                      className="gap-1.5 h-8 text-xs"
                      disabled={bookingId === course.id}
                      onClick={() => handleBookCourse(course)}
                    >
                      {bookingId === course.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isFree ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <ExternalLink className="w-3.5 h-3.5" />
                      )}
                      {isFree ? "Enrol Free" : `Pay ${price}`}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CPD Records tab */}
      {tab === "cpd" && (
        <div className="space-y-3">
          {/* Add CPD record */}
          <div className="ks-card overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 text-left"
              onClick={() => setShowAddCPD(!showAddCPD)}
            >
              <span className="flex items-center gap-2 font-bold text-sm">
                <Plus className="w-4 h-4 text-secondary" /> Log Manual CPD Record
              </span>
              {showAddCPD ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showAddCPD && (
              <form onSubmit={handleAddCPD} className="px-4 pb-4 space-y-3 border-t border-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Title *</label>
                    <input
                      required
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={cpdForm.title}
                      onChange={e => setCpdForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="z. B. Kinderschutz‑Auffrischung"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Category</label>
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={cpdForm.category}
                      onChange={e => setCpdForm(f => ({ ...f, category: e.target.value }))}
                    >
                      {["safeguarding", "first_aid", "childcare", "management", "general"].map(c => (
                        <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Hours *</label>
                    <input
                      required
                      type="number"
                      min="0.5"
                      step="0.5"
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={cpdForm.hours}
                      onChange={e => setCpdForm(f => ({ ...f, hours: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Completed Date *</label>
                    <input
                      required
                      type="date"
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={cpdForm.completed_date}
                      onChange={e => setCpdForm(f => ({ ...f, completed_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Provider</label>
                    <input
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={cpdForm.provider}
                      onChange={e => setCpdForm(f => ({ ...f, provider: e.target.value }))}
                      placeholder="z. B. IHK, DRK, Caritas"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Notes</label>
                    <input
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={cpdForm.notes}
                      onChange={e => setCpdForm(f => ({ ...f, notes: e.target.value }))}
                    />
                  </div>
                </div>
                <Button type="submit" size="sm" disabled={submitting} className="gap-1.5">
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Add Record
                </Button>
              </form>
            )}
          </div>

          {/* Records list */}
          {cpdRecords.length === 0 ? (
            <div className="ks-card p-10 text-center text-muted-foreground text-sm">
              <Award className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No CPD records yet — log your first one above.
            </div>
          ) : cpdRecords.map(record => (
            <div key={record.id} className="ks-card p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm">{record.title}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {record.provider && `${record.provider} · `}
                      {format(new Date(record.completed_date), "dd MMM yyyy")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold">{record.hours}h</div>
                    {record.verified && (
                      <span className="text-[10px] text-success flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${CATEGORY_COLORS[record.category] || CATEGORY_COLORS.general}`}>
                    {record.category.replace(/_/g, " ")}
                  </span>
                </div>
                {record.notes && (
                  <p className="text-xs text-muted-foreground mt-1 italic">{record.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainingPage;
