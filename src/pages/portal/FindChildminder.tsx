import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Search, Shield, Award, Globe, Baby, Clock, MapPin, Star, CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isToday, parseISO } from "date-fns";

interface MinderResult {
  id: string;
  user_id: string;
  age_groups: string[] | null;
  languages: string[] | null;
  days: string[] | null;
  hours: string | null;
  experience_years: number | null;
  bio: string | null;
  postcode_district: string | null;
  town: string | null;
  ofsted_urn: string | null;
  ofsted_rating: string | null;
  dbs_number: string | null;
  max_children: number | null;
  onboarding_status: string;
  // Progressive reveal fields - only shown after booking
  has_booking?: boolean;
  has_arrived?: boolean;
  first_name?: string;
  avg_rating?: number | null;
  review_count?: number;
}

interface AvailabilitySlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const FindChildminder = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<MinderResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [filters, setFilters] = useState({
    postcode: "",
    ageGroup: "",
    language: "",
  });
  const [selectedMinder, setSelectedMinder] = useState<MinderResult | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [bookingForm, setBookingForm] = useState({ start_time: "08:00", end_time: "17:00", notes: "" });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!user) return;
    setLoading(true);
    setSearched(true);

    let query = supabase
      .from("childminder_public_profiles" as any)
      .select("id, user_id, age_groups, languages, days, hours, experience_years, bio, postcode_district, town, ofsted_rating, max_children, onboarding_status")
      .eq("onboarding_status", "verified");

    if (filters.postcode) {
      query = query.ilike("postcode_district", `${filters.postcode}%`);
    }
    if (filters.ageGroup) {
      query = query.contains("age_groups", [filters.ageGroup]);
    }
    if (filters.language) {
      query = query.contains("languages", [filters.language]);
    }

    const { data } = await query.limit(20);

    // Check if parent has any confirmed bookings with these childminders
    const minders = (data || []) as unknown as MinderResult[];
    if (minders.length > 0) {
      const cmIds = minders.map((m) => m.user_id);
      const { data: bookings } = await supabase
        .from("shifts")
        .select("childminder_id, status")
        .eq("parent_id", user.id)
        .in("childminder_id", cmIds)
        .in("status", ["accepted", "completed"]);

      const bookedIds = new Set((bookings || []).map((b) => b.childminder_id));
      const arrivedIds = new Set((bookings || []).filter((b) => b.status === "completed").map((b) => b.childminder_id));

      // Get names only for arrived bookings
      let nameMap: Record<string, string> = {};
      if (arrivedIds.size > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, first_name")
          .in("user_id", Array.from(arrivedIds));
        profiles?.forEach((p) => { nameMap[p.user_id] = p.first_name; });
      }

      minders.forEach((m) => {
        m.has_booking = bookedIds.has(m.user_id);
        m.has_arrived = arrivedIds.has(m.user_id);
        if (m.has_arrived && nameMap[m.user_id]) {
          m.first_name = nameMap[m.user_id];
        }
      });
    }

    setResults(minders);
    setLoading(false);
  };

  const fetchAvailability = useCallback(async (minderId: string) => {
    const { data } = await supabase.from("availability").select("*").eq("user_id", minderId);
    setAvailability((data ?? []) as AvailabilitySlot[]);
    // Fetch existing bookings for this minder
    const monthStart = startOfMonth(calMonth);
    const monthEnd = endOfMonth(calMonth);
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("childminder_id", minderId)
      .gte("booking_date", format(monthStart, "yyyy-MM-dd"))
      .lte("booking_date", format(monthEnd, "yyyy-MM-dd"));
    setExistingBookings(bookings || []);
  }, [calMonth]);

  const handleSelectMinder = (m: MinderResult) => {
    setSelectedMinder(m);
    setSelectedDate(null);
    fetchAvailability(m.user_id);
  };

  const isDateAvailable = (date: Date) => {
    const dayOfWeek = date.getDay();
    return availability.some(a => a.day_of_week === dayOfWeek && a.is_available);
  };

  const getAvailabilityForDay = (dayOfWeek: number) => {
    return availability.filter(a => a.day_of_week === dayOfWeek && a.is_available);
  };

  const handleBook = async () => {
    if (!user || !selectedMinder || !selectedDate) return;
    setBookingLoading(true);

    // Booking gate: minder must be at least "verified" to accept unsupervised care.
    const { data: v } = await supabase
      .from("minder_verification")
      .select("tier, verified_until")
      .eq("user_id", selectedMinder.user_id)
      .maybeSingle();
    const tier = v?.tier ?? "registered";
    const expired = v?.verified_until ? new Date(v.verified_until) < new Date() : false;
    if (tier === "registered" || expired) {
      toast({
        title: "Buchung nicht möglich",
        description:
          "Diese Betreuungsperson ist derzeit nicht KinderStars Verified. Unbeaufsichtigte Buchungen sind nur mit gültiger Verifizierung möglich.",
        variant: "destructive",
      });
      setBookingLoading(false);
      return;
    }

    const { error } = await supabase.from("bookings").insert({
      parent_id: user.id,
      childminder_id: selectedMinder.user_id,
      booking_date: format(selectedDate, "yyyy-MM-dd"),
      start_time: bookingForm.start_time,
      end_time: bookingForm.end_time,
      notes: bookingForm.notes || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Booking requested!", description: "The childminder will review your request." });
      supabase.functions.invoke("send-notification", {
        body: { type: "booking_request", booking_childminder_id: selectedMinder.user_id, parent_name: user.email },
      }).catch(() => {});
      setSelectedDate(null);
      setBookingForm({ start_time: "08:00", end_time: "17:00", notes: "" });
      fetchAvailability(selectedMinder.user_id);
    }
    setBookingLoading(false);
  };

  // Calendar helpers
  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Find a Childminder</h1>
        <p className="text-muted-foreground text-sm">Search verified childminders. Names are only revealed after arrival for your safety.</p>
      </div>

      {/* Filters */}
      <div className="ks-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="ks-field">
            <label>Postcode Area</label>
            <input
              placeholder="e.g. LU1"
              value={filters.postcode}
              onChange={(e) => setFilters({ ...filters, postcode: e.target.value })}
            />
          </div>
          <div className="ks-field">
            <label>Age Group</label>
            <select value={filters.ageGroup} onChange={(e) => setFilters({ ...filters, ageGroup: e.target.value })}>
              <option value="">Any</option>
              <option value="0-1">0-1</option>
              <option value="2-4">2-4</option>
              <option value="5-8">5-8</option>
              <option value="9-12">9-12</option>
            </select>
          </div>
          <div className="ks-field">
            <label>Language</label>
            <input
              placeholder="e.g. English"
              value={filters.language}
              onChange={(e) => setFilters({ ...filters, language: e.target.value })}
            />
          </div>
        </div>
        <Button variant="hero" onClick={handleSearch} disabled={loading} className="mt-3 gap-2">
          <Search className="w-4 h-4" />
          {loading ? "Searching…" : "Search"}
        </Button>
      </div>

      {/* Results */}
      {searched && results.length === 0 && !loading && (
        <div className="ks-card p-8 text-center text-muted-foreground text-sm">
          No verified childminders found matching your criteria.
        </div>
      )}

      <div className="space-y-3">
        {results.map((m) => (
          <div key={m.id} className="ks-card p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  {m.has_arrived && m.first_name ? (
                    <>{m.first_name}</>
                  ) : m.has_booking ? (
                    <span className="text-primary">Booking Confirmed — Name revealed on arrival</span>
                  ) : (
                    <span className="text-muted-foreground">Verified Childminder</span>
                  )}
                </h3>
                {m.town && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {m.town} area {m.postcode_district && `(${m.postcode_district})`}
                  </p>
                )}
              </div>
              <div className="flex gap-1.5 shrink-0">
                {m.dbs_number && (
                  <span className="ks-tag !bg-success/15 !border-success/30 !text-success text-[10px] flex items-center gap-1">
                    <Shield className="w-3 h-3" /> DBS ✓
                  </span>
                )}
                {m.ofsted_urn && (
                  <span className="ks-tag !bg-primary/15 !border-primary/30 !text-primary text-[10px] flex items-center gap-1">
                    <Award className="w-3 h-3" /> Ofsted ✓
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {m.experience_years != null && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Star className="w-3.5 h-3.5" /> {m.experience_years} years experience
                </div>
              )}
              {m.languages && m.languages.length > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Globe className="w-3.5 h-3.5" /> {m.languages.join(", ")}
                </div>
              )}
              {m.age_groups && m.age_groups.length > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Baby className="w-3.5 h-3.5" /> Ages: {m.age_groups.join(", ")}
                </div>
              )}
              {m.hours && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" /> {m.hours}
                </div>
              )}
            </div>

            {m.ofsted_rating && (
              <p className="text-xs text-muted-foreground mt-2">
                Ofsted: <span className="font-medium text-foreground">{m.ofsted_rating}</span>
              </p>
            )}

            {m.days && m.days.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {m.days.map((d) => (
                  <span key={d} className="ks-tag text-[10px]">{d}</span>
                ))}
              </div>
            )}

            {/* Show bio only after booking confirmed */}
            {m.has_booking && m.bio && (
              <p className="text-xs text-muted-foreground mt-2 italic">"{m.bio}"</p>
            )}

            <Button
              variant="warm"
              size="sm"
              className="mt-3 gap-1.5"
              onClick={() => handleSelectMinder(m)}
            >
              <CalendarDays className="w-4 h-4" /> View Availability & Book
            </Button>
          </div>
        ))}
      </div>

      {/* Booking Calendar Panel */}
      {selectedMinder && (
        <div className="ks-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              {selectedMinder.has_arrived && selectedMinder.first_name
                ? `Book ${selectedMinder.first_name}`
                : "Book Childminder"}
              {selectedMinder.town && <span className="text-xs text-muted-foreground font-normal">— {selectedMinder.town}</span>}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setSelectedMinder(null)}>Close</Button>
          </div>

          {/* Weekly availability summary */}
          {availability.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 0].map((dayNum) => {
                const slots = getAvailabilityForDay(dayNum);
                return (
                  <div key={dayNum} className={`text-center px-2 py-1 rounded-lg text-[10px] ${
                    slots.length > 0 ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                  }`}>
                    <div className="font-bold">{DAY_NAMES[dayNum]}</div>
                    {slots.length > 0 && <div>{slots[0].start_time.slice(0, 5)}–{slots[0].end_time.slice(0, 5)}</div>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Calendar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Button variant="ghost" size="sm" onClick={() => setCalMonth(subMonths(calMonth, 1))}><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-sm font-bold">{format(calMonth, "MMMM yyyy")}</span>
              <Button variant="ghost" size="sm" onClick={() => setCalMonth(addMonths(calMonth, 1))}><ChevronRight className="w-4 h-4" /></Button>
            </div>
            <div className="grid grid-cols-7 gap-px">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="text-center text-[10px] text-muted-foreground font-medium py-1">{d}</div>
              ))}
              {calDays.map((day) => {
                const available = isDateAvailable(day) && day >= new Date(new Date().setHours(0,0,0,0));
                const hasBooking = existingBookings.some(b => isSameDay(parseISO(b.booking_date), day));
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => available && !hasBooking ? setSelectedDate(isSelected ? null : day) : null}
                    disabled={!available || hasBooking || !isSameMonth(day, calMonth)}
                    className={`p-1.5 min-h-[40px] rounded-lg text-xs text-center transition-colors ${
                      !isSameMonth(day, calMonth) ? "text-muted-foreground/30" :
                      isSelected ? "bg-secondary text-secondary-foreground font-bold" :
                      hasBooking ? "bg-primary/10 text-primary/60" :
                      available ? "bg-success/10 hover:bg-success/20 cursor-pointer" :
                      isToday(day) ? "bg-muted" :
                      "text-muted-foreground/50"
                    }`}
                  >
                    {format(day, "d")}
                    {hasBooking && <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-0.5" />}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success/30" /> Available</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary/30" /> Booked</span>
            </div>
          </div>

          {/* Booking form */}
          {selectedDate && (
            <div className="pt-3 border-t border-border space-y-3">
              <h4 className="text-sm font-bold">{format(selectedDate, "EEEE, d MMMM yyyy")}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Start Time</label>
                  <input type="time" className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                    value={bookingForm.start_time} onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">End Time</label>
                  <input type="time" className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                    value={bookingForm.end_time} onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Notes (optional)</label>
                <textarea className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm" rows={2}
                  value={bookingForm.notes} onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })} placeholder="Any special requirements…" />
              </div>
              <Button variant="hero" size="sm" onClick={handleBook} disabled={bookingLoading} className="gap-1.5">
                {bookingLoading ? <Clock className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Request Booking
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FindChildminder;
