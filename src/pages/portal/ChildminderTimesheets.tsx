import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Clock, Play, Square, Coffee, Send, Loader2, CheckCircle2, XCircle,
  AlertTriangle, Navigation, MapPin
} from "lucide-react";
import { format, differenceInMinutes, isBefore, parseISO } from "date-fns";

interface Timesheet {
  id: string;
  shift_id: string | null;
  clock_in: string | null;
  clock_out: string | null;
  break_minutes: number;
  total_hours: number | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface ShiftOption {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location_address: string | null;
  location_postcode: string | null;
  status: string;
}

const statusConfig: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", cls: "bg-muted text-muted-foreground", icon: <Clock className="w-3.5 h-3.5" /> },
  submitted: { label: "Submitted", cls: "bg-secondary/15 text-secondary border border-secondary/30", icon: <Send className="w-3.5 h-3.5" /> },
  approved: { label: "Approved", cls: "bg-success/15 text-success border border-success/30", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected: { label: "Rejected", cls: "bg-destructive/15 text-destructive border border-destructive/30", icon: <XCircle className="w-3.5 h-3.5" /> },
};

const ChildminderTimesheets = () => {
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [shifts, setShifts] = useState<ShiftOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTimer, setActiveTimer] = useState<Timesheet | null>(null);
  const [breakMin, setBreakMin] = useState(0);
  const [notes, setNotes] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(new Date());

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      fetchTimesheets();
      fetchShifts();
    }
  }, [user]);

  const fetchTimesheets = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("timesheets")
      .select("*")
      .eq("childminder_id", user.id)
      .order("created_at", { ascending: false });
    const list = (data ?? []) as Timesheet[];
    setTimesheets(list);
    const active = list.find((t) => t.clock_in && !t.clock_out && t.status === "draft");
    if (active) {
      setActiveTimer(active);
      setBreakMin(active.break_minutes ?? 0);
      setNotes(active.notes ?? "");
    } else {
      setActiveTimer(null);
    }
    setLoading(false);
  };

  const fetchShifts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("shifts")
      .select("id, title, start_time, end_time, location_address, location_postcode, status")
      .eq("childminder_id", user.id)
      .in("status", ["accepted", "in_progress"])
      .order("start_time", { ascending: true })
      .limit(20);
    setShifts((data ?? []) as ShiftOption[]);
  };

  // Check if late for the selected shift
  const linkedShift = useMemo(
    () => shifts.find((s) => s.id === (activeTimer?.shift_id ?? selectedShift)),
    [shifts, activeTimer, selectedShift]
  );

  const isLateForShift = useMemo(() => {
    if (!linkedShift) return false;
    const shiftStart = parseISO(linkedShift.start_time);
    if (activeTimer?.clock_in) {
      return isBefore(shiftStart, parseISO(activeTimer.clock_in));
    }
    return isBefore(shiftStart, now);
  }, [linkedShift, activeTimer, now]);

  const lateMinutes = useMemo(() => {
    if (!linkedShift || !isLateForShift) return 0;
    const shiftStart = parseISO(linkedShift.start_time);
    const ref = activeTimer?.clock_in ? parseISO(activeTimer.clock_in) : now;
    return Math.max(0, differenceInMinutes(ref, shiftStart));
  }, [linkedShift, isLateForShift, activeTimer, now]);

  const directionsUrl = useMemo(() => {
    const loc = linkedShift?.location_postcode || linkedShift?.location_address;
    if (!loc) return null;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(loc)}`;
  }, [linkedShift]);

  const hasActiveJob = !!activeTimer;

  const clockIn = async () => {
    if (!user) return;
    if (hasActiveJob) {
      toast({
        title: "Already clocked in",
        description: "You must clock out of your current job before clocking into a new one.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const clockInTime = new Date().toISOString();

    // Check lateness & create performance note
    const shiftForClockIn = shifts.find((s) => s.id === selectedShift);
    let perfNote = "";
    if (shiftForClockIn) {
      const shiftStart = parseISO(shiftForClockIn.start_time);
      if (isBefore(shiftStart, new Date(clockInTime))) {
        const mins = differenceInMinutes(new Date(clockInTime), shiftStart);
        perfNote = `⚠️ Late arrival: ${mins} min after scheduled start`;
      }
    }

    const { data, error } = await supabase
      .from("timesheets")
      .insert({
        childminder_id: user.id,
        clock_in: clockInTime,
        shift_id: selectedShift || null,
        break_minutes: 0,
        status: "draft",
        notes: perfNote || null,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const msg = perfNote
        ? `Clocked in at ${format(new Date(clockInTime), "HH:mm")} — ${perfNote}`
        : `Clocked in at ${format(new Date(clockInTime), "HH:mm:ss")}`;
      toast({ title: "Clocked in", description: msg, variant: perfNote ? "destructive" : "default" });
      setActiveTimer(data as Timesheet);
      setBreakMin(0);
      setNotes(perfNote);
      fetchTimesheets();
    }
  };

  const clockOut = async () => {
    if (!activeTimer) return;
    setSaving(true);
    const clockOutTime = new Date().toISOString();
    const totalMin = differenceInMinutes(new Date(clockOutTime), new Date(activeTimer.clock_in!)) - breakMin;
    const totalHours = Math.max(0, Math.round((totalMin / 60) * 100) / 100);

    const { error } = await supabase
      .from("timesheets")
      .update({
        clock_out: clockOutTime,
        break_minutes: breakMin,
        total_hours: totalHours,
        notes: notes || null,
      })
      .eq("id", activeTimer.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Clocked out", description: `${totalHours}h logged` });
      setActiveTimer(null);
      setSelectedShift("");
      fetchTimesheets();
    }
  };

  const submitForApproval = async (id: string) => {
    const { error } = await supabase.from("timesheets").update({ status: "submitted" }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Submitted for approval" });
      fetchTimesheets();
    }
  };

  const elapsed = activeTimer?.clock_in
    ? Math.max(0, differenceInMinutes(now, new Date(activeTimer.clock_in)) - breakMin)
    : 0;
  const elapsedH = Math.floor(elapsed / 60);
  const elapsedM = elapsed % 60;

  if (loading) return <div className="text-muted-foreground">Loading timesheets…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Timesheets</h1>
        <p className="text-muted-foreground text-sm">Clock in/out, track breaks, and submit hours for approval.</p>
      </div>

      {/* Active timer / Clock in */}
      <div className="ks-card p-5">
        {activeTimer ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
              <h2 className="font-bold text-sm">Currently Clocked In</h2>
            </div>

            {/* Late alert */}
            {isLateForShift && lateMinutes > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="font-medium">Late by {lateMinutes} minute{lateMinutes !== 1 ? "s" : ""}</span>
              </div>
            )}

            {/* Directions button */}
            {directionsUrl && (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 transition-colors"
              >
                <Navigation className="w-4 h-4" />
                Get Directions
                {linkedShift?.location_postcode && (
                  <span className="text-xs text-muted-foreground ml-1">({linkedShift.location_postcode})</span>
                )}
              </a>
            )}

            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <p className="text-xs text-muted-foreground">Clock in</p>
                <p className="font-mono font-bold">{format(new Date(activeTimer.clock_in!), "HH:mm:ss")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Elapsed (excl. breaks)</p>
                <p className="font-mono font-bold text-2xl text-secondary">
                  {String(elapsedH).padStart(2, "0")}:{String(elapsedM).padStart(2, "0")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="ks-field">
                <label>Break (minutes)</label>
                <input
                  type="number"
                  min={0}
                  max={480}
                  value={breakMin}
                  onChange={(e) => setBreakMin(Math.max(0, Number(e.target.value)))}
                  className="w-24"
                />
              </div>
              <div className="ks-field flex-1 min-w-[200px]">
                <label>Notes</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes…"
                />
              </div>
            </div>
            <Button variant="destructive" className="gap-2" onClick={clockOut} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
              Clock Out
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="font-bold text-sm">Clock In</h2>

            {/* Show next shift info with directions */}
            {selectedShift && linkedShift && (
              <div className="p-3 rounded-xl bg-muted/50 border border-border text-sm space-y-2">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  {format(parseISO(linkedShift.start_time), "dd MMM HH:mm")} – {format(parseISO(linkedShift.end_time), "HH:mm")}
                </div>
                {(linkedShift.location_postcode || linkedShift.location_address) && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    {linkedShift.location_address || linkedShift.location_postcode}
                  </div>
                )}
                {directionsUrl && (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-secondary text-xs font-medium hover:underline"
                  >
                    <Navigation className="w-3.5 h-3.5" /> Get Directions
                  </a>
                )}
                {isLateForShift && (
                  <div className="flex items-center gap-1.5 text-destructive text-xs font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Shift started {lateMinutes} min ago — clock in now
                  </div>
                )}
              </div>
            )}

            <div className="flex items-end gap-3 flex-wrap">
              <div className="ks-field">
                <label>Link to Shift (optional)</label>
                <select value={selectedShift} onChange={(e) => setSelectedShift(e.target.value)}>
                  <option value="">No shift</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} — {format(parseISO(s.start_time), "dd MMM HH:mm")}
                    </option>
                  ))}
                </select>
              </div>
              <Button variant="hero" className="gap-2" onClick={clockIn} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Clock In
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Active job warning */}
      {hasActiveJob && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 text-sm">
          <AlertTriangle className="w-4 h-4 text-primary shrink-0" />
          <span>You must <strong>clock out</strong> of your current job before you can clock in to another.</span>
        </div>
      )}

      {/* Timesheet history */}
      <div>
        <h2 className="font-bold text-sm mb-3">Timesheet History</h2>
        {timesheets.length === 0 ? (
          <div className="ks-card p-8 text-center text-muted-foreground text-sm">No timesheets yet.</div>
        ) : (
          <div className="space-y-2">
            {timesheets.map((ts) => {
              const cfg = statusConfig[ts.status] || statusConfig.draft;
              const hasLateNote = ts.notes?.includes("⚠️ Late");
              return (
                <div key={ts.id} className="ks-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`ks-tag text-[11px] flex items-center gap-1 ${cfg.cls}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      {ts.total_hours != null && (
                        <span className="font-mono font-bold text-sm">{ts.total_hours}h</span>
                      )}
                      {hasLateNote && (
                        <span className="ks-tag text-[11px] flex items-center gap-1 bg-destructive/10 text-destructive border-destructive/20">
                          <AlertTriangle className="w-3 h-3" /> Late
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                      {ts.clock_in && (
                        <span>In: {format(new Date(ts.clock_in), "dd MMM HH:mm")}</span>
                      )}
                      {ts.clock_out && (
                        <span>Out: {format(new Date(ts.clock_out), "HH:mm")}</span>
                      )}
                      {ts.break_minutes > 0 && (
                        <span className="flex items-center gap-1"><Coffee className="w-3 h-3" /> {ts.break_minutes}min break</span>
                      )}
                    </div>
                    {ts.notes && <p className="text-xs text-muted-foreground mt-1">{ts.notes}</p>}
                  </div>
                  {ts.status === "draft" && ts.clock_out && (
                    <Button size="sm" variant="secondary" className="gap-1 shrink-0" onClick={() => submitForApproval(ts.id)}>
                      <Send className="w-3.5 h-3.5" /> Submit
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChildminderTimesheets;
