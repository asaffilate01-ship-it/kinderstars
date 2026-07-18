import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Calendar, Check, X, Clock, CalendarDays, ChevronLeft, ChevronRight, Plus, MessageSquare } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, parseISO, isToday } from "date-fns";
import { useTranslation } from "react-i18next";

interface Booking {
  id: string;
  parent_id: string;
  childminder_id: string;
  status: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  decline_reason: string | null;
  created_at: string;
}

interface Profile {
  user_id: string;
  first_name: string;
  last_name: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-primary/15 text-foreground border-primary/30",
  accepted: "bg-success/15 text-success border-success/30",
  declined: "bg-destructive/15 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground border-border",
  completed: "bg-secondary/15 text-secondary border-secondary/30",
};

const BookingsPage = () => {
  const { user, userRole } = useAuth();
  const { t } = useTranslation();
  const isChildminder = userRole === "childminder";
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newBooking, setNewBooking] = useState({ childminder_id: "", booking_date: "", start_time: "08:00", end_time: "17:00", notes: "" });
  const [minders, setMinders] = useState<Profile[]>([]);
  const [view, setView] = useState<"calendar" | "list">("calendar");

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const col = isChildminder ? "childminder_id" : "parent_id";
    const { data } = await supabase.from("bookings").select("*").eq(col, user.id).order("booking_date", { ascending: false });
    setBookings((data ?? []) as Booking[]);

    // Fetch profiles for display
    const ids = [...new Set((data ?? []).flatMap((b: any) => [b.parent_id, b.childminder_id]))];
    if (ids.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", ids);
      setProfiles((profs ?? []) as Profile[]);
    }
    setLoading(false);
  }, [user, isChildminder]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const col = isChildminder ? "childminder_id" : "parent_id";
    const channel = supabase.channel("bookings-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `${col}=eq.${user.id}` }, () => fetchBookings())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, isChildminder, fetchBookings]);

  // Fetch available childminders for new booking
  useEffect(() => {
    if (!showNew) return;
    supabase.from("profiles").select("user_id, first_name, last_name").eq("role", "childminder").then(({ data }) => {
      setMinders((data ?? []) as Profile[]);
    });
  }, [showNew]);

  const getName = (userId: string) => {
    const p = profiles.find((pr) => pr.user_id === userId);
    return p ? `${p.first_name} ${p.last_name}` : userId.slice(0, 8);
  };

  const handleCreate = async () => {
    if (!user || !newBooking.childminder_id || !newBooking.booking_date) return;
    const { error } = await supabase.from("bookings").insert({
      parent_id: user.id,
      childminder_id: newBooking.childminder_id,
      booking_date: newBooking.booking_date,
      start_time: newBooking.start_time,
      end_time: newBooking.end_time,
      notes: newBooking.notes || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Booking requested!" });
      setShowNew(false);
      setNewBooking({ childminder_id: "", booking_date: "", start_time: "08:00", end_time: "17:00", notes: "" });
      // Send notification via edge function
      supabase.functions.invoke("send-notification", {
        body: { type: "booking_request", booking_childminder_id: newBooking.childminder_id, parent_name: user.email },
      }).catch(() => {});
      fetchBookings();
    }
  };

  const handleResponse = async (bookingId: string, status: "accepted" | "declined", reason?: string) => {
    const update: any = { status };
    if (reason) update.decline_reason = reason;
    const { error } = await supabase.from("bookings").update(update).eq("id", bookingId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: status === "accepted" ? "Booking accepted!" : "Booking declined" });
      // Notify parent
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        supabase.functions.invoke("send-notification", {
          body: { type: `booking_${status}`, booking_parent_id: booking.parent_id, childminder_name: user?.email },
        }).catch(() => {});
      }
      fetchBookings();
    }
  };

  const handleCancel = async (bookingId: string) => {
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
    toast({ title: "Booking cancelled" });
    fetchBookings();
  };

  // Calendar
  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const getBookingsForDate = (date: Date) => bookings.filter((b) => isSameDay(parseISO(b.booking_date), date));
  const filteredBookings = selectedDate ? getBookingsForDate(selectedDate) : bookings;

  if (loading) return <div className="text-muted-foreground p-4">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground text-sm">
            {isChildminder ? "Manage booking requests from parents" : "Request and manage childcare bookings"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "calendar" ? "warm" : "ghost"} size="sm" onClick={() => setView("calendar")} className="gap-1">
            <CalendarDays className="w-4 h-4" /> Calendar
          </Button>
          <Button variant={view === "list" ? "warm" : "ghost"} size="sm" onClick={() => setView("list")} className="gap-1">
            <Clock className="w-4 h-4" /> List
          </Button>
          {!isChildminder && (
            <Button variant="warm" size="sm" onClick={() => setShowNew(true)} className="gap-1">
              <Plus className="w-4 h-4" /> New Booking
            </Button>
          )}
        </div>
      </div>

      {/* New Booking Form */}
      {showNew && (
        <div className="ks-card p-4 space-y-3">
          <h3 className="font-bold text-sm">Request a Booking</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Childminder</label>
              <select className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm" value={newBooking.childminder_id} onChange={(e) => setNewBooking({ ...newBooking, childminder_id: e.target.value })}>
                <option value="">Select…</option>
                {minders.map((m) => <option key={m.user_id} value={m.user_id}>{m.first_name} {m.last_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Date</label>
              <input type="date" className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm" value={newBooking.booking_date} onChange={(e) => setNewBooking({ ...newBooking, booking_date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Start Time</label>
              <input type="time" className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm" value={newBooking.start_time} onChange={(e) => setNewBooking({ ...newBooking, start_time: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">End Time</label>
              <input type="time" className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm" value={newBooking.end_time} onChange={(e) => setNewBooking({ ...newBooking, end_time: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Notes (optional)</label>
            <textarea className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm" rows={2} value={newBooking.notes} onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })} placeholder="Any special requirements…" />
          </div>
          <div className="flex gap-2">
            <Button variant="warm" size="sm" onClick={handleCreate}>Send Request</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {view === "calendar" && (
        <div className="ks-card p-4">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="sm" onClick={() => setCalMonth(subMonths(calMonth, 1))}><ChevronLeft className="w-4 h-4" /></Button>
            <h3 className="font-bold text-sm">{format(calMonth, "MMMM yyyy")}</h3>
            <Button variant="ghost" size="sm" onClick={() => setCalMonth(addMonths(calMonth, 1))}><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-7 gap-px">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="text-center text-[10px] text-muted-foreground font-medium py-1">{d}</div>
            ))}
            {calDays.map((day) => {
              const dayBookings = getBookingsForDate(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(isSelected ? null : day)}
                  className={`p-1 min-h-[48px] rounded-lg text-xs text-center transition-colors relative ${
                    !isSameMonth(day, calMonth) ? "text-muted-foreground/40" :
                    isSelected ? "bg-secondary text-secondary-foreground" :
                    isToday(day) ? "bg-primary/10" : "hover:bg-muted"
                  }`}
                >
                  <span className="block">{format(day, "d")}</span>
                  {dayBookings.length > 0 && (
                    <div className="flex gap-0.5 justify-center mt-0.5">
                      {dayBookings.slice(0, 3).map((b) => (
                        <span key={b.id} className={`w-1.5 h-1.5 rounded-full ${
                          b.status === "accepted" ? "bg-success" :
                          b.status === "pending" ? "bg-primary" :
                          b.status === "declined" ? "bg-destructive" : "bg-muted-foreground"
                        }`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {selectedDate && (
            <div className="mt-3 pt-3 border-t border-border">
              <h4 className="text-xs font-bold mb-2">{format(selectedDate, "EEEE, d MMMM yyyy")}</h4>
              {getBookingsForDate(selectedDate).length === 0 ? (
                <p className="text-xs text-muted-foreground">No bookings</p>
              ) : getBookingsForDate(selectedDate).map((b) => (
                <BookingCard key={b.id} booking={b} getName={getName} isChildminder={isChildminder} onRespond={handleResponse} onCancel={handleCancel} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="space-y-2">
          {bookings.length === 0 ? (
            <div className="ks-card p-8 text-center text-muted-foreground text-sm">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
              {t("portal.bookings.noBookings")}
            </div>
          ) : bookings.map((b) => (
            <BookingCard key={b.id} booking={b} getName={getName} isChildminder={isChildminder} onRespond={handleResponse} onCancel={handleCancel} />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-3 text-[10px] text-muted-foreground flex-wrap">
        {Object.entries(STATUS_COLORS).map(([status, cls]) => (
          <span key={status} className={`px-2 py-0.5 rounded-full border ${cls} capitalize`}>{status}</span>
        ))}
      </div>
    </div>
  );
};

const BookingCard = ({ booking, getName, isChildminder, onRespond, onCancel }: {
  booking: Booking; getName: (id: string) => string; isChildminder: boolean;
  onRespond: (id: string, status: "accepted" | "declined", reason?: string) => void;
  onCancel: (id: string) => void;
}) => {
  return (
    <div className={`ks-card p-3 border-l-4 ${STATUS_COLORS[booking.status] || "border-border"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold capitalize ${STATUS_COLORS[booking.status]}`}>
              {booking.status}
            </span>
            <span className="text-xs text-muted-foreground">{format(parseISO(booking.booking_date), "EEE d MMM yyyy")}</span>
          </div>
          <div className="text-sm font-medium">
            {isChildminder ? `Parent: ${getName(booking.parent_id)}` : `Childminder: ${getName(booking.childminder_id)}`}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {booking.start_time.slice(0, 5)} – {booking.end_time.slice(0, 5)}
          </div>
          {booking.notes && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {booking.notes}</p>}
          {booking.decline_reason && <p className="text-xs text-destructive mt-1">Reason: {booking.decline_reason}</p>}
        </div>
        <div className="flex gap-1 shrink-0">
          {isChildminder && booking.status === "pending" && (
            <>
              <Button variant="success" size="sm" className="gap-1 h-8" onClick={() => onRespond(booking.id, "accepted")}>
                <Check className="w-3.5 h-3.5" /> Accept
              </Button>
              <Button variant="destructive" size="sm" className="gap-1 h-8" onClick={() => {
                const reason = prompt("Decline reason (optional):");
                onRespond(booking.id, "declined", reason || undefined);
              }}>
                <X className="w-3.5 h-3.5" /> Decline
              </Button>
            </>
          )}
          {!isChildminder && booking.status === "pending" && (
            <Button variant="ghost" size="sm" className="h-8" onClick={() => onCancel(booking.id)}>Cancel</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingsPage;
