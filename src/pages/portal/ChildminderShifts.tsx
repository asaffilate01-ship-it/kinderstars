import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Check, X, Clock, MapPin, Play, CheckCircle2, Loader2, Navigation } from "lucide-react";
import { format } from "date-fns";

type ShiftStatus = "pending" | "offered" | "accepted" | "declined" | "in_progress" | "completed" | "cancelled";

interface Shift {
  id: string;
  title: string;
  status: ShiftStatus;
  start_time: string;
  end_time: string;
  location_address: string | null;
  location_postcode: string | null;
  notes: string | null;
  parent_id: string | null;
}

const statusColors: Record<ShiftStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  offered: "bg-primary/15 text-primary-foreground border-primary/30",
  accepted: "bg-success/15 text-success border-success/30",
  declined: "bg-destructive/15 text-destructive border-destructive/30",
  in_progress: "bg-secondary/15 text-secondary border-secondary/30",
  completed: "bg-success/15 text-success border-success/30",
  cancelled: "bg-muted text-muted-foreground",
};

const statusLabels: Record<ShiftStatus, string> = {
  pending: "Pending", offered: "Offered", accepted: "Accepted",
  declined: "Declined", in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled",
};

type Tab = "upcoming" | "history";

const ChildminderShifts = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("upcoming");

  useEffect(() => {
    if (user) fetchShifts();
  }, [user]);

  const fetchShifts = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .eq("childminder_id", user.id)
      .order("start_time", { ascending: false });
    if (error) {
      toast({ title: "Error loading shifts", description: error.message, variant: "destructive" });
    }
    setShifts((data ?? []) as Shift[]);
    setLoading(false);
  };

  const updateStatus = async (shiftId: string, newStatus: ShiftStatus) => {
    setUpdating(shiftId);
    const { error } = await supabase.from("shifts").update({ status: newStatus }).eq("id", shiftId);
    setUpdating(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Shift ${statusLabels[newStatus].toLowerCase()}` });
      fetchShifts();
    }
  };

  const now = new Date().toISOString();
  const upcoming = shifts.filter((s) => s.end_time >= now && !["completed", "cancelled", "declined"].includes(s.status));
  const history = shifts.filter((s) => s.end_time < now || ["completed", "cancelled", "declined"].includes(s.status));
  const displayed = tab === "upcoming" ? upcoming : history;

  if (loading) return <div className="text-muted-foreground">Loading shifts…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shifts</h1>
        <p className="text-muted-foreground text-sm">View shift offers, accept or decline, and track live shifts.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        {(["upcoming", "history"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? "border-secondary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "upcoming" ? `Upcoming (${upcoming.length})` : `History (${history.length})`}
          </button>
        ))}
      </div>

      {/* Shifts list */}
      {displayed.length === 0 ? (
        <div className="ks-card p-8 text-center">
          <p className="text-muted-foreground text-sm">{tab === "upcoming" ? "No upcoming shifts." : "No shift history."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((shift) => (
            <div key={shift.id} className="ks-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-sm truncate">{shift.title}</h3>
                  <span className={`ks-tag text-[11px] ${statusColors[shift.status as ShiftStatus]}`}>
                    {statusLabels[shift.status as ShiftStatus]}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {format(new Date(shift.start_time), "dd MMM HH:mm")} – {format(new Date(shift.end_time), "HH:mm")}
                  </span>
                  {shift.location_postcode && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {shift.location_postcode}
                    </span>
                  )}
                </div>
                {(shift.location_postcode || shift.location_address) && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(shift.location_postcode || shift.location_address || "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-secondary text-xs font-medium hover:underline mt-1"
                  >
                    <Navigation className="w-3 h-3" /> Get Directions
                  </a>
                )}
                {shift.notes && <p className="text-xs text-muted-foreground mt-1">{shift.notes}</p>}
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                {(shift.status === "offered" || shift.status === "pending") && (
                  <>
                    <Button size="sm" variant="default" className="gap-1 bg-success hover:bg-success/90 text-success-foreground"
                      disabled={updating === shift.id} onClick={() => updateStatus(shift.id, "accepted")}>
                      {updating === shift.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Accept
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1"
                      disabled={updating === shift.id} onClick={() => updateStatus(shift.id, "declined")}>
                      <X className="w-3.5 h-3.5" /> Decline
                    </Button>
                  </>
                )}
                {shift.status === "accepted" && (
                  <Button size="sm" variant="secondary" className="gap-1"
                    disabled={updating === shift.id} onClick={() => updateStatus(shift.id, "in_progress")}>
                    <Play className="w-3.5 h-3.5" /> Start Shift
                  </Button>
                )}
                {shift.status === "in_progress" && (
                  <Button size="sm" variant="default" className="gap-1 bg-success hover:bg-success/90 text-success-foreground"
                    disabled={updating === shift.id} onClick={() => updateStatus(shift.id, "completed")}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChildminderShifts;
