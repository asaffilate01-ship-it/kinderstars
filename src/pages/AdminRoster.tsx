import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/kinderstars-logo.png";
import {
  Plus, Download, Upload, ChevronLeft, ChevronRight, Calendar, Users, LogOut,
  GripVertical, Filter, ArrowUpDown, AlertTriangle, X, CalendarDays, LayoutGrid, Clock, User
} from "lucide-react";
import {
  format, startOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, subWeeks, addMonths, subMonths,
  isSameDay, parseISO, eachDayOfInterval, differenceInMinutes
} from "date-fns";

interface Shift {
  id: string;
  title: string;
  status: string;
  start_time: string;
  end_time: string;
  childminder_id: string | null;
  parent_id: string | null;
  location_address: string | null;
  location_postcode: string | null;
  notes: string | null;
}

interface Booking {
  id: string;
  parent_id: string;
  childminder_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
}

interface PersonOption {
  user_id: string;
  name: string;
  postcode?: string | null;
  town?: string | null;
  city?: string | null;
}

interface Conflict {
  childminderId: string;
  childminderName: string;
  shifts: Shift[];
  message: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground border-border",
  offered: "bg-primary/15 border-primary/30 text-foreground",
  accepted: "bg-success/15 border-success/30 text-success",
  in_progress: "bg-secondary/15 border-secondary/30 text-secondary",
  completed: "bg-success/10 border-success/20 opacity-60",
  declined: "bg-destructive/10 border-destructive/20 opacity-60",
  cancelled: "bg-muted opacity-50",
};

const bookingStatusColors: Record<string, string> = {
  pending: "bg-primary/20 border-primary/40 text-primary",
  accepted: "bg-success/20 border-success/40 text-success",
  declined: "bg-destructive/15 border-destructive/30 text-destructive",
  cancelled: "bg-muted opacity-50 border-border",
  completed: "bg-secondary/15 border-secondary/30 text-secondary",
};

type ViewMode = "day" | "week" | "month";
type SortField = "start_time" | "title" | "status" | "childminder";
type ScheduleTab = "shifts" | "bookings";

const AdminRoster = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [childminders, setChildminders] = useState<PersonOption[]>([]);
  const [parents, setParents] = useState<PersonOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleTab, setScheduleTab] = useState<ScheduleTab>("shifts");

  // Filters
  const [filterMinder, setFilterMinder] = useState("");
  const [filterParent, setFilterParent] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Sort
  const [sortField, setSortField] = useState<SortField>("start_time");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // New shift form
  const [showForm, setShowForm] = useState(false);
  const [newShift, setNewShift] = useState({
    title: "", childminder_id: "", start_time: "", end_time: "",
    location_address: "", location_postcode: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  // Conflicts
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [showConflicts, setShowConflicts] = useState(false);

  // Drag state — supports dragging shifts OR people
  const dragRef = useRef<{
    type: "shift" | "childminder" | "parent";
    id: string; // shift id or person user_id
    originalCmId?: string | null;
  } | null>(null);

  // Drop zone highlighting
  const [dropTarget, setDropTarget] = useState<string | null>(null); // "unassigned" | cm user_id | shift id

  // People sidebar search
  const [minderSearch, setMinderSearch] = useState("");
  const [parentSearch, setParentSearch] = useState("");

  // Subscriptions for gating
  const [cmSubscriptions, setCmSubscriptions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/admin/login");
  }, [authLoading, user, isAdmin, navigate]);

  const dateRange = useMemo(() => {
    if (viewMode === "day") {
      return { start: currentDate, end: currentDate };
    } else if (viewMode === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      return { start: ws, end: addDays(ws, 6) };
    } else {
      return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
    }
  }, [viewMode, currentDate]);

  const days = useMemo(() => eachDayOfInterval(dateRange), [dateRange]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const fetchEnd = addDays(dateRange.end, 1);
    const [shiftsRes, bookingsRes, cmRes, parentRes, subsRes] = await Promise.all([
      supabase.from("shifts").select("*")
        .gte("start_time", dateRange.start.toISOString())
        .lt("start_time", fetchEnd.toISOString())
        .order("start_time"),
      supabase.from("bookings").select("*")
        .gte("booking_date", format(dateRange.start, "yyyy-MM-dd"))
        .lte("booking_date", format(dateRange.end, "yyyy-MM-dd"))
        .order("booking_date"),
      supabase.from("childminder_profiles").select("user_id, town, postcode_district"),
      supabase.from("parent_profiles").select("user_id, city"),
      supabase.from("subscriptions").select("user_id, status, plan, trial_ends_at"),
    ]);

    const cmData = cmRes.data ?? [];
    const parentData = parentRes.data ?? [];
    const allIds = [...cmData.map(c => c.user_id), ...parentData.map(p => p.user_id)];
    const profileNames: Record<string, string> = {};
    if (allIds.length > 0) {
      const { data: pData } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", allIds);
      (pData ?? []).forEach(p => {
        profileNames[p.user_id] = `${p.first_name} ${p.last_name}`.trim() || p.user_id.slice(0, 8);
      });
    }

    // Build subscription map
    const subMap: Record<string, boolean> = {};
    (subsRes.data ?? []).forEach(s => {
      const isActive = s.status === "active" || (s.plan === "free_trial" && new Date(s.trial_ends_at) > new Date());
      subMap[s.user_id] = isActive;
    });
    setCmSubscriptions(subMap);

    setChildminders(cmData.map(c => ({
      user_id: c.user_id, name: profileNames[c.user_id] || c.user_id.slice(0, 8),
      postcode: c.postcode_district, town: c.town,
    })));
    setParents(parentData.map(p => ({
      user_id: p.user_id, name: profileNames[p.user_id] || p.user_id.slice(0, 8),
      city: p.city,
    })));
    setShifts((shiftsRes.data ?? []) as Shift[]);
    setBookings((bookingsRes.data ?? []) as Booking[]);
    setLoading(false);
  }, [dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Detect conflicts
  useEffect(() => {
    const conflictList: Conflict[] = [];
    const cmShifts: Record<string, Shift[]> = {};
    shifts.forEach(s => {
      if (s.childminder_id) {
        if (!cmShifts[s.childminder_id]) cmShifts[s.childminder_id] = [];
        cmShifts[s.childminder_id].push(s);
      }
    });
    Object.entries(cmShifts).forEach(([cmId, list]) => {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i], b = list[j];
          const aS = parseISO(a.start_time), aE = parseISO(a.end_time);
          const bS = parseISO(b.start_time), bE = parseISO(b.end_time);
          if (aS < bE && bS < aE) {
            const cm = childminders.find(c => c.user_id === cmId);
            conflictList.push({
              childminderId: cmId, childminderName: cm?.name || cmId.slice(0, 8),
              shifts: [a, b], message: `${a.title} overlaps with ${b.title} on ${format(aS, "dd MMM")}`,
            });
          }
        }
      }
    });
    setConflicts(conflictList);
  }, [shifts, childminders]);

  // Filtered shifts
  const filteredShifts = useMemo(() => {
    let result = [...shifts];
    if (filterMinder) result = result.filter(s => s.childminder_id === filterMinder);
    if (filterStatus) result = result.filter(s => s.status === filterStatus);
    if (filterArea) {
      const area = filterArea.toLowerCase();
      result = result.filter(s => s.location_postcode?.toLowerCase().includes(area));
    }
    const getCmName = (id: string | null) => childminders.find(c => c.user_id === id)?.name || "";
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "start_time") cmp = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      else if (sortField === "title") cmp = a.title.localeCompare(b.title);
      else if (sortField === "status") cmp = a.status.localeCompare(b.status);
      else if (sortField === "childminder") cmp = getCmName(a.childminder_id).localeCompare(getCmName(b.childminder_id));
      return sortDir === "desc" ? -cmp : cmp;
    });
    return result;
  }, [shifts, filterMinder, filterStatus, filterArea, sortField, sortDir, childminders]);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    let result = [...bookings];
    if (filterMinder) result = result.filter(b => b.childminder_id === filterMinder);
    if (filterParent) result = result.filter(b => b.parent_id === filterParent);
    if (filterStatus) result = result.filter(b => b.status === filterStatus);
    return result;
  }, [bookings, filterMinder, filterParent, filterStatus]);

  const areas = useMemo(() => {
    const set = new Set<string>();
    childminders.forEach(c => { if (c.postcode) set.add(c.postcode); if (c.town) set.add(c.town); });
    return Array.from(set).sort();
  }, [childminders]);

  const filteredMinders = useMemo(() => {
    if (!minderSearch) return childminders;
    const q = minderSearch.toLowerCase();
    return childminders.filter(c => c.name.toLowerCase().includes(q) || c.postcode?.toLowerCase().includes(q) || c.town?.toLowerCase().includes(q));
  }, [childminders, minderSearch]);

  const filteredParentsList = useMemo(() => {
    if (!parentSearch) return parents;
    const q = parentSearch.toLowerCase();
    return parents.filter(p => p.name.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q));
  }, [parents, parentSearch]);

  const navigate_ = (dir: 1 | -1) => {
    if (viewMode === "day") setCurrentDate(d => addDays(d, dir));
    else if (viewMode === "week") setCurrentDate(d => dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1));
    else setCurrentDate(d => dir === 1 ? addMonths(d, 1) : subMonths(d, 1));
  };

  const handleCreateShift = async () => {
    if (!newShift.title || !newShift.start_time || !newShift.end_time) {
      toast({ title: "Pflichtfelder fehlen", description: "Titel, Start- und Endzeit erforderlich", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("shifts").insert({
      title: newShift.title, childminder_id: newShift.childminder_id || null,
      start_time: newShift.start_time, end_time: newShift.end_time,
      location_address: newShift.location_address || null, location_postcode: newShift.location_postcode || null,
      notes: newShift.notes || null, status: newShift.childminder_id ? "offered" : "pending", created_by: user?.id,
    });
    setSaving(false);
    if (error) toast({ title: "Fehler", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Einsatz erstellt" });
      setShowForm(false);
      setNewShift({ title: "", childminder_id: "", start_time: "", end_time: "", location_address: "", location_postcode: "", notes: "" });
      fetchData();
    }
  };

  const handleDragStartShift = (shiftId: string, cmId: string | null) => {
    dragRef.current = { type: "shift", id: shiftId, originalCmId: cmId };
  };

  const handleDropOnCm = async (targetCmId: string) => {
    setDropTarget(null);
    if (!dragRef.current) return;
    const drag = dragRef.current;
    dragRef.current = null;

    if (drag.type === "shift") {
      // Check subscription before assigning
      if (!cmSubscriptions[targetCmId]) {
        toast({ title: "Kein aktives Abonnement", description: "Diese Betreuungsperson benötigt ein Abonnement, bevor sie Einsätze erhalten kann.", variant: "destructive" });
        return;
      }
      const { error } = await supabase.from("shifts").update({ childminder_id: targetCmId, status: "offered" }).eq("id", drag.id);
      if (error) toast({ title: "Fehler", description: error.message, variant: "destructive" });
      else { toast({ title: "Einsatz zugewiesen" }); fetchData(); }
    } else if (drag.type === "childminder") {
      toast({ title: "Ziehen Sie eine Betreuungsperson auf eine bestimmte Einsatzkarte oder einen Einsatz auf eine Betreuungspersonen-Zeile", variant: "destructive" });
    }
  };

  const handleDropOnUnassigned = async () => {
    setDropTarget(null);
    if (!dragRef.current) return;
    const drag = dragRef.current;
    dragRef.current = null;

    if (drag.type === "shift") {
      const { error } = await supabase.from("shifts").update({ childminder_id: null, status: "pending" }).eq("id", drag.id);
      if (error) toast({ title: "Fehler", description: error.message, variant: "destructive" });
      else { toast({ title: "Zuweisung entfernt" }); fetchData(); }
    }
  };

  const handleDropOnShift = async (shiftId: string) => {
    setDropTarget(null);
    if (!dragRef.current) return;
    const drag = dragRef.current;
    dragRef.current = null;

    if (drag.type === "childminder") {
      // Check subscription before assigning
      if (!cmSubscriptions[drag.id]) {
        toast({ title: "Kein aktives Abonnement", description: "Diese Betreuungsperson benötigt ein Abonnement, bevor sie Einsätze erhalten kann.", variant: "destructive" });
        return;
      }
      const { error } = await supabase.from("shifts").update({ childminder_id: drag.id, status: "offered" }).eq("id", shiftId);
      if (error) toast({ title: "Fehler", description: error.message, variant: "destructive" });
      else { toast({ title: "Betreuungsperson zugewiesen" }); fetchData(); }
    } else if (drag.type === "parent") {
      const { error } = await supabase.from("shifts").update({ parent_id: drag.id }).eq("id", shiftId);
      if (error) toast({ title: "Fehler", description: error.message, variant: "destructive" });
      else { toast({ title: "Familie zugewiesen" }); fetchData(); }
    }
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDropTarget(targetId);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const exportCSV = () => {
    const headers = "Title,Status,Start,End,Childminder,Location,Notes";
    const rows = filteredShifts.map(s => {
      const cm = childminders.find(c => c.user_id === s.childminder_id)?.name || "";
      return `"${s.title}","${s.status}","${s.start_time}","${s.end_time}","${cm}","${s.location_postcode || ""}","${(s.notes || "").replace(/"/g, '""')}"`;
    });
    const blob = new Blob([headers + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `roster-${format(currentDate, "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").slice(1).filter(Boolean);
      const rows = lines.map(line => {
        const cols = line.split(",").map(c => c.replace(/^"|"$/g, "").trim());
        return {
          title: cols[0] || "Imported Shift", status: "pending" as const,
          start_time: cols[2] || new Date().toISOString(), end_time: cols[3] || new Date().toISOString(),
          location_postcode: cols[5] || null, notes: cols[6] || null, created_by: user?.id,
        };
      });
      if (rows.length > 0) {
        const { error } = await supabase.from("shifts").insert(rows);
        if (error) toast({ title: "Import-Fehler", description: error.message, variant: "destructive" });
        else { toast({ title: `${rows.length} Einsätze importiert` }); fetchData(); }
      }
    };
    reader.readAsText(file); e.target.value = "";
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const getName = (id: string) => {
    const cm = childminders.find(c => c.user_id === id);
    if (cm) return cm.name;
    const p = parents.find(p => p.user_id === id);
    return p ? p.name : id.slice(0, 8);
  };

  if (authLoading || !isAdmin) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  const dateLabel = viewMode === "day"
    ? format(currentDate, "EEEE, dd MMMM yyyy")
    : viewMode === "week"
    ? `${format(dateRange.start, "dd MMM")} – ${format(dateRange.end, "dd MMM yyyy")}`
    : format(currentDate, "MMMM yyyy");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-border" style={{ background: "hsla(36,100%,97%,0.82)" }}>
        <div className="max-w-[1800px] mx-auto px-4 py-2.5 flex items-center justify-between">
          <a href="/"><img src={logo} alt="KinderStars" className="w-[120px]" /></a>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" asChild><a href="/admin/dashboard">← Dashboard</a></Button>
            <span className="text-xs text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto px-4 py-4 flex gap-4">
        {/* Left sidebar — People lists */}
        <aside className="hidden lg:flex flex-col w-[220px] shrink-0 space-y-3">
          {/* Childminders list */}
          <div className="ks-card p-3 space-y-2">
            <h3 className="text-xs font-bold flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-primary" /> Childminders ({childminders.length})</h3>
            <Input className="h-7 text-xs" placeholder="Search…" value={minderSearch} onChange={e => setMinderSearch(e.target.value)} />
            <div className="space-y-1 max-h-[280px] overflow-y-auto">
              {filteredMinders.map(cm => (
                <div key={cm.user_id}
                  draggable
                  onDragStart={() => {
                    dragRef.current = { type: "childminder", id: cm.user_id };
                  }}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs cursor-grab active:cursor-grabbing hover:bg-muted transition-colors border border-transparent hover:border-border group"
                >
                  <GripVertical className="w-3 h-3 opacity-30 group-hover:opacity-60 shrink-0" />
                  <User className="w-3.5 h-3.5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{cm.name}</div>
                    {(cm.town || cm.postcode) && (
                      <div className="text-[10px] text-muted-foreground truncate">{cm.town}{cm.town && cm.postcode ? " · " : ""}{cm.postcode}</div>
                    )}
                  </div>
                </div>
              ))}
              {filteredMinders.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2">No childminders found</p>}
            </div>
          </div>

          {/* Parents list */}
          <div className="ks-card p-3 space-y-2">
            <h3 className="text-xs font-bold flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-secondary" /> Parents ({parents.length})</h3>
            <Input className="h-7 text-xs" placeholder="Search…" value={parentSearch} onChange={e => setParentSearch(e.target.value)} />
            <div className="space-y-1 max-h-[280px] overflow-y-auto">
              {filteredParentsList.map(p => (
                <div key={p.user_id}
                  draggable
                  onDragStart={() => {
                    dragRef.current = { type: "parent", id: p.user_id };
                  }}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs cursor-grab active:cursor-grabbing hover:bg-muted transition-colors border border-transparent hover:border-border group"
                >
                  <GripVertical className="w-3 h-3 opacity-30 group-hover:opacity-60 shrink-0" />
                  <User className="w-3.5 h-3.5 text-secondary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    {p.city && <div className="text-[10px] text-muted-foreground truncate">{p.city}</div>}
                  </div>
                </div>
              ))}
              {filteredParentsList.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2">No parents found</p>}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 space-y-4 min-w-0">
          {/* Controls bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1 bg-muted rounded-xl p-0.5">
              {(["day", "week", "month"] as ViewMode[]).map(v => (
                <button key={v} onClick={() => setViewMode(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewMode === v ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {v === "day" ? <><CalendarDays className="w-3.5 h-3.5 inline mr-1" />Day</> :
                   v === "week" ? <><LayoutGrid className="w-3.5 h-3.5 inline mr-1" />Week</> :
                   <><Calendar className="w-3.5 h-3.5 inline mr-1" />Month</>}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate_(-1)}><ChevronLeft className="w-4 h-4" /></Button>
              <h2 className="font-bold text-sm whitespace-nowrap min-w-[160px] text-center">{dateLabel}</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate_(1)}><ChevronRight className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
            </div>

            <div className="flex items-center gap-1.5">
              {conflicts.length > 0 && (
                <Button variant="destructive" size="sm" className="gap-1" onClick={() => setShowConflicts(!showConflicts)}>
                  <AlertTriangle className="w-3.5 h-3.5" /> {conflicts.length}
                </Button>
              )}
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-3.5 h-3.5" /> Filters
              </Button>
              <Button variant="ghost" size="sm" className="gap-1" onClick={exportCSV}><Download className="w-3.5 h-3.5" /></Button>
              <label className="cursor-pointer">
                <Button variant="ghost" size="sm" className="gap-1 pointer-events-none"><Upload className="w-3.5 h-3.5" /></Button>
                <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
              </label>
              <Button variant="hero" size="sm" className="gap-1" onClick={() => setShowForm(true)}>
                <Plus className="w-3.5 h-3.5" /> New Shift
              </Button>
            </div>
          </div>

          {/* Conflict alert */}
          {showConflicts && conflicts.length > 0 && (
            <div className="ks-card p-4 border-l-4 border-destructive space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-destructive flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Allocation Conflicts</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowConflicts(false)}><X className="w-4 h-4" /></Button>
              </div>
              {conflicts.map((c, i) => (
                <div key={i} className="text-xs bg-destructive/5 rounded-lg p-2.5 flex items-center gap-2">
                  <span className="font-medium">{c.childminderName}:</span>
                  <span className="text-muted-foreground">{c.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          {showFilters && (
            <div className="ks-card p-4 flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Childminder</label>
                <select className="h-9 rounded-lg border border-input bg-background px-2 text-xs"
                  value={filterMinder} onChange={(e) => setFilterMinder(e.target.value)}>
                  <option value="">All</option>
                  {childminders.map(c => <option key={c.user_id} value={c.user_id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Parent</label>
                <select className="h-9 rounded-lg border border-input bg-background px-2 text-xs"
                  value={filterParent} onChange={(e) => setFilterParent(e.target.value)}>
                  <option value="">All</option>
                  {parents.map(p => <option key={p.user_id} value={p.user_id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                <select className="h-9 rounded-lg border border-input bg-background px-2 text-xs"
                  value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">All</option>
                  {["pending", "offered", "accepted", "in_progress", "completed", "declined", "cancelled"].map(s =>
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Gebiet / PLZ</label>
                <Input className="h-9 text-xs w-32" placeholder="e.g. LU1" value={filterArea} onChange={(e) => setFilterArea(e.target.value)} />
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setFilterMinder(""); setFilterParent(""); setFilterStatus(""); setFilterArea(""); }}>
                Clear
              </Button>
              <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowUpDown className="w-3.5 h-3.5" />
                {(["start_time", "title", "status", "childminder"] as SortField[]).map(f => (
                  <button key={f} className={`px-2 py-1 rounded ${sortField === f ? "bg-muted font-medium" : ""}`} onClick={() => toggleSort(f)}>
                    {f === "start_time" ? "Time" : f === "childminder" ? "Minder" : f.charAt(0).toUpperCase() + f.slice(1)}
                    {sortField === f && (sortDir === "asc" ? " ↑" : " ↓")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* New shift form */}
          {showForm && (
            <div className="ks-card p-5">
              <h3 className="font-bold text-sm mb-3">Create Shift</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="ks-field"><label>Title</label><input value={newShift.title} onChange={(e) => setNewShift({ ...newShift, title: e.target.value })} /></div>
                <div className="ks-field"><label>Assign Childminder</label>
                  <select value={newShift.childminder_id} onChange={(e) => setNewShift({ ...newShift, childminder_id: e.target.value })}>
                    <option value="">Unassigned</option>
                    {childminders.map(c => <option key={c.user_id} value={c.user_id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="ks-field"><label>Start</label><input type="datetime-local" value={newShift.start_time} onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value })} /></div>
                <div className="ks-field"><label>End</label><input type="datetime-local" value={newShift.end_time} onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value })} /></div>
                <div className="ks-field"><label>Location</label><input value={newShift.location_address} onChange={(e) => setNewShift({ ...newShift, location_address: e.target.value })} /></div>
                <div className="ks-field"><label>PLZ</label><input value={newShift.location_postcode} onChange={(e) => setNewShift({ ...newShift, location_postcode: e.target.value })} /></div>
                <div className="ks-field col-span-2"><label>Notes</label><input value={newShift.notes} onChange={(e) => setNewShift({ ...newShift, notes: e.target.value })} /></div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="hero" size="sm" onClick={handleCreateShift} disabled={saving}>{saving ? "Creating…" : "Create Shift"}</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Stats bar */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="ks-card px-3 py-1.5"><strong>{filteredShifts.length}</strong> shifts</span>
            <span className="ks-card px-3 py-1.5"><strong>{filteredBookings.length}</strong> bookings</span>
            <span className="ks-card px-3 py-1.5"><strong>{filteredShifts.filter(s => !s.childminder_id).length}</strong> unassigned</span>
            <span className="ks-card px-3 py-1.5"><strong>{childminders.length}</strong> childminders</span>
            <span className="ks-card px-3 py-1.5"><strong>{parents.length}</strong> parents</span>
            {conflicts.length > 0 && <span className="px-3 py-1.5 bg-destructive/10 rounded-xl text-destructive font-bold"><strong>{conflicts.length}</strong> conflicts</span>}
          </div>

          {/* Schedule tab toggle: Shifts vs Bookings */}
          <div className="flex items-center gap-1 bg-muted rounded-xl p-0.5 w-fit">
            <button onClick={() => setScheduleTab("shifts")}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${scheduleTab === "shifts" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <Clock className="w-3.5 h-3.5 inline mr-1" />Shifts ({filteredShifts.length})
            </button>
            <button onClick={() => setScheduleTab("bookings")}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${scheduleTab === "bookings" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <Calendar className="w-3.5 h-3.5 inline mr-1" />Bookings ({filteredBookings.length})
            </button>
          </div>

          {/* Schedule grid */}
          {loading ? (
            <div className="text-muted-foreground text-sm py-8 text-center">Loading roster…</div>
          ) : scheduleTab === "shifts" ? (
            <ShiftsGrid
              days={days} viewMode={viewMode} childminders={childminders}
              shifts={filteredShifts} conflicts={conflicts}
              onDragStart={handleDragStartShift} onDrop={handleDropOnCm}
              onDropOnShift={handleDropOnShift} onDropOnUnassigned={handleDropOnUnassigned}
              dropTarget={dropTarget} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
              currentDate={currentDate} cmSubscriptions={cmSubscriptions}
            />
          ) : (
            <BookingsGantt
              days={days} viewMode={viewMode} childminders={childminders} parents={parents}
              bookings={filteredBookings} getName={getName} currentDate={currentDate}
            />
          )}
        </main>
      </div>
    </div>
  );
};

/* ─── Shifts Grid ─── */
const ShiftsGrid = ({ days, viewMode, childminders, shifts, conflicts, onDragStart, onDrop, onDropOnShift, onDropOnUnassigned, dropTarget, onDragOver, onDragLeave, currentDate, cmSubscriptions }: {
  days: Date[]; viewMode: ViewMode; childminders: PersonOption[]; shifts: Shift[];
  conflicts: Conflict[];
  onDragStart: (id: string, cmId: string | null) => void;
  onDrop: (cmId: string) => Promise<void>;
  onDropOnShift: (shiftId: string) => Promise<void>;
  onDropOnUnassigned: () => Promise<void>;
  dropTarget: string | null;
  onDragOver: (e: React.DragEvent, targetId: string) => void;
  onDragLeave: () => void;
  currentDate: Date;
  cmSubscriptions: Record<string, boolean>;
}) => (
  <>
    <div className="overflow-x-auto">
      <div className={`grid min-w-[900px] gap-px bg-border rounded-xl overflow-hidden border border-border ${
        viewMode === "day" ? "grid-cols-[160px_1fr]" : "grid-cols-[160px_repeat(7,1fr)]"
      }`}>
        <div className="bg-muted p-3 font-bold text-xs text-muted-foreground">Childminder</div>
        {viewMode === "month" ? (
          ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
            <div key={d} className="bg-muted p-2 text-center text-xs font-bold text-muted-foreground">{d}</div>
          ))
        ) : (
          days.map(day => (
            <div key={day.toISOString()} className={`bg-muted p-2 text-center text-xs font-bold ${isSameDay(day, new Date()) ? "text-secondary" : "text-muted-foreground"}`}>
              <div>{format(day, "EEE")}</div><div className="text-lg">{format(day, "d")}</div>
            </div>
          ))
        )}

        {/* Unassigned row */}
        <div className={`bg-card p-2 text-xs font-medium border-t border-border transition-colors ${dropTarget === "unassigned" ? "text-primary font-bold bg-primary/10" : "text-muted-foreground"}`}>
          ↩ Unassigned
        </div>
        {viewMode === "month" ? (
          [1, 2, 3, 4, 5, 6, 0].map(dow => {
            const dayShifts = shifts.filter(s => !s.childminder_id && parseISO(s.start_time).getDay() === dow);
            return (
              <div key={dow} className={`p-1 min-h-[40px] border-t border-border transition-colors ${dropTarget === "unassigned" ? "bg-primary/5 ring-2 ring-inset ring-primary/30" : "bg-card"}`}
                onDragOver={e => onDragOver(e, "unassigned")} onDragLeave={onDragLeave} onDrop={() => onDropOnUnassigned()}>
                {dayShifts.slice(0, 3).map(s => (
                  <div key={s.id} className={`text-[10px] p-1 rounded border mb-0.5 truncate ${statusColors[s.status] || statusColors.pending}`}>{s.title}</div>
                ))}
                {dayShifts.length > 3 && <div className="text-[9px] text-muted-foreground">+{dayShifts.length - 3} more</div>}
              </div>
            );
          })
        ) : (
          days.map(day => {
            const dayShifts = shifts.filter(s => !s.childminder_id && isSameDay(parseISO(s.start_time), day));
            return (
              <div key={day.toISOString()}
                className={`p-1.5 min-h-[50px] border-t border-border transition-colors ${dropTarget === "unassigned" ? "bg-primary/5 ring-2 ring-inset ring-primary/30" : "bg-card"}`}
                onDragOver={e => onDragOver(e, "unassigned")} onDragLeave={onDragLeave} onDrop={() => onDropOnUnassigned()}>
                {dayShifts.map(s => <ShiftCard key={s.id} shift={s} onDragStart={onDragStart} onDropOnShift={onDropOnShift} dropTarget={dropTarget} onDragOver={onDragOver} onDragLeave={onDragLeave} />)}
              </div>
            );
          })
        )}

        {/* Childminder rows */}
        {childminders.map(cm => (
          <RosterRow key={cm.user_id} cm={cm} days={days} shifts={shifts} viewMode={viewMode}
            onDragStart={onDragStart} onDrop={onDrop} onDropOnShift={onDropOnShift}
            hasConflict={conflicts.some(c => c.childminderId === cm.user_id)}
            dropTarget={dropTarget} onDragOver={onDragOver} onDragLeave={onDragLeave}
            hasSubscription={!!cmSubscriptions[cm.user_id]} />
        ))}
      </div>
    </div>

    {/* Day view timeline */}
    {viewMode === "day" && shifts.length > 0 && (
      <GanttTimeline
        rows={[
          ...childminders.map(cm => ({
            id: cm.user_id, label: cm.name,
            items: shifts.filter(s => s.childminder_id === cm.user_id && isSameDay(parseISO(s.start_time), currentDate))
              .map(s => ({ id: s.id, label: s.title, start: parseISO(s.start_time), end: parseISO(s.end_time), colorClass: statusColors[s.status] })),
          })),
          {
            id: "unassigned", label: "Unassigned",
            items: shifts.filter(s => !s.childminder_id && isSameDay(parseISO(s.start_time), currentDate))
              .map(s => ({ id: s.id, label: s.title, start: parseISO(s.start_time), end: parseISO(s.end_time), colorClass: statusColors[s.status] })),
          },
        ].filter(r => r.items.length > 0)}
        title="Shifts Timeline"
      />
    )}
  </>
);

/* ─── Bookings Gantt ─── */
const BookingsGantt = ({ days, viewMode, childminders, parents, bookings, getName, currentDate }: {
  days: Date[]; viewMode: ViewMode; childminders: PersonOption[]; parents: PersonOption[];
  bookings: Booking[]; getName: (id: string) => string; currentDate: Date;
}) => {
  // For day view, build Gantt timeline rows
  if (viewMode === "day") {
    const rows = childminders.map(cm => {
      const cmBookings = bookings.filter(b => b.childminder_id === cm.user_id && b.booking_date === format(currentDate, "yyyy-MM-dd"));
      return {
        id: cm.user_id, label: cm.name,
        items: cmBookings.map(b => {
          const [sh, sm] = b.start_time.split(":").map(Number);
          const [eh, em] = b.end_time.split(":").map(Number);
          const start = new Date(currentDate); start.setHours(sh, sm, 0);
          const end = new Date(currentDate); end.setHours(eh, em, 0);
          return { id: b.id, label: `${getName(b.parent_id)}`, start, end, colorClass: bookingStatusColors[b.status] || bookingStatusColors.pending };
        }),
      };
    }).filter(r => r.items.length > 0);

    return <GanttTimeline rows={rows} title="Bookings Timeline" />;
  }

  // Week / month: grid view (childminders as rows, days as columns)
  return (
    <div className="overflow-x-auto">
      <div className={`grid min-w-[900px] gap-px bg-border rounded-xl overflow-hidden border border-border ${
        viewMode === "week" ? "grid-cols-[160px_repeat(7,1fr)]" : "grid-cols-[160px_repeat(7,1fr)]"
      }`}>
        <div className="bg-muted p-3 font-bold text-xs text-muted-foreground">Childminder</div>
        {viewMode === "month" ? (
          ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
            <div key={d} className="bg-muted p-2 text-center text-xs font-bold text-muted-foreground">{d}</div>
          ))
        ) : (
          days.map(day => (
            <div key={day.toISOString()} className={`bg-muted p-2 text-center text-xs font-bold ${isSameDay(day, new Date()) ? "text-secondary" : "text-muted-foreground"}`}>
              <div>{format(day, "EEE")}</div><div className="text-lg">{format(day, "d")}</div>
            </div>
          ))
        )}

        {childminders.map(cm => (
          <BookingRow key={cm.user_id} cm={cm} days={days} bookings={bookings} viewMode={viewMode} getName={getName} />
        ))}

        {/* Show bookings without matching childminder as "Other" */}
        {bookings.filter(b => !childminders.some(c => c.user_id === b.childminder_id)).length > 0 && (
          <>
            <div className="bg-card p-2 text-xs font-medium text-muted-foreground border-t border-border">Other</div>
            {viewMode === "month" ? (
              [1, 2, 3, 4, 5, 6, 0].map(dow => {
                const dayBookings = bookings.filter(b => !childminders.some(c => c.user_id === b.childminder_id) && parseISO(b.booking_date).getDay() === dow);
                return (
                  <div key={dow} className="bg-card p-1 min-h-[40px] border-t border-border">
                    {dayBookings.slice(0, 3).map(b => (
                      <div key={b.id} className={`text-[10px] p-1 rounded border mb-0.5 truncate ${bookingStatusColors[b.status]}`}>
                        {getName(b.parent_id)} {b.start_time.slice(0, 5)}
                      </div>
                    ))}
                  </div>
                );
              })
            ) : (
              days.map(day => {
                const dayBookings = bookings.filter(b => !childminders.some(c => c.user_id === b.childminder_id) && isSameDay(parseISO(b.booking_date), day));
                return (
                  <div key={day.toISOString()} className="bg-card p-1.5 min-h-[50px] border-t border-border">
                    {dayBookings.map(b => (
                      <div key={b.id} className={`text-[10px] p-1.5 rounded-lg border mb-1 ${bookingStatusColors[b.status]}`}>
                        <div className="font-medium truncate">{getName(b.parent_id)}</div>
                        <div className="text-[9px] opacity-70">{b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}</div>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
};

/* ─── Booking Row ─── */
const BookingRow = ({ cm, days, bookings, viewMode, getName }: {
  cm: PersonOption; days: Date[]; bookings: Booking[]; viewMode: ViewMode; getName: (id: string) => string;
}) => (
  <>
    <div className="bg-card p-2 text-xs font-medium border-t border-border flex items-center gap-1">
      <span className="truncate">{cm.name}</span>
      {cm.postcode && <span className="text-[9px] text-muted-foreground">({cm.postcode})</span>}
    </div>
    {viewMode === "month" ? (
      [1, 2, 3, 4, 5, 6, 0].map(dow => {
        const dayBookings = bookings.filter(b => b.childminder_id === cm.user_id && parseISO(b.booking_date).getDay() === dow);
        return (
          <div key={dow} className="bg-card p-1 min-h-[40px] border-t border-border">
            {dayBookings.slice(0, 2).map(b => (
              <div key={b.id} className={`text-[10px] p-1 rounded border mb-0.5 truncate ${bookingStatusColors[b.status]}`}>
                {getName(b.parent_id)}
              </div>
            ))}
            {dayBookings.length > 2 && <div className="text-[9px] text-muted-foreground">+{dayBookings.length - 2}</div>}
          </div>
        );
      })
    ) : (
      days.map(day => {
        const dayBookings = bookings.filter(b => b.childminder_id === cm.user_id && isSameDay(parseISO(b.booking_date), day));
        return (
          <div key={`${cm.user_id}-${day.toISOString()}`} className="bg-card p-1.5 min-h-[50px] border-t border-border">
            {dayBookings.map(b => (
              <div key={b.id} className={`text-[10px] p-1.5 rounded-lg border mb-1 ${bookingStatusColors[b.status]}`}>
                <div className="font-medium truncate">{getName(b.parent_id)}</div>
                <div className="text-[9px] opacity-70">{b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}</div>
              </div>
            ))}
          </div>
        );
      })
    )}
  </>
);

/* ─── Gantt Timeline (reusable for day view) ─── */
const GanttTimeline = ({ rows, title }: {
  rows: { id: string; label: string; items: { id: string; label: string; start: Date; end: Date; colorClass: string }[] }[];
  title: string;
}) => (
  <div className="ks-card p-4 space-y-2">
    <h3 className="font-bold text-sm">{title}</h3>
    <div className="relative">
      <div className="flex border-b border-border mb-2">
        {Array.from({ length: 14 }, (_, i) => i + 6).map(h => (
          <div key={h} className="flex-1 text-[10px] text-muted-foreground border-l border-border pl-0.5">{h}:00</div>
        ))}
      </div>
      {rows.map(row => (
        <div key={row.id} className="flex items-center gap-2 mb-1.5">
          <div className="w-24 text-xs font-medium truncate shrink-0">{row.label}</div>
          <div className="flex-1 relative h-6 bg-muted/50 rounded">
            {row.items.map(item => {
              const startHour = item.start.getHours() + item.start.getMinutes() / 60 - 6;
              const duration = differenceInMinutes(item.end, item.start) / 60;
              const left = Math.max(0, (startHour / 14) * 100);
              const width = Math.min((duration / 14) * 100, 100 - left);
              return (
                <div key={item.id} className={`absolute top-0.5 bottom-0.5 rounded text-[9px] flex items-center px-1 truncate ${item.colorClass}`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`${item.label}: ${format(item.start, "HH:mm")}–${format(item.end, "HH:mm")}`}>
                  {item.label}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ─── Sub-components ─── */
const ShiftCard = ({ shift, onDragStart, onDropOnShift, dropTarget, onDragOver, onDragLeave }: {
  shift: Shift;
  onDragStart: (id: string, cmId: string | null) => void;
  onDropOnShift?: (shiftId: string) => Promise<void>;
  dropTarget?: string | null;
  onDragOver?: (e: React.DragEvent, targetId: string) => void;
  onDragLeave?: () => void;
}) => {
  const isDropTarget = dropTarget === `shift-${shift.id}`;
  return (
    <div draggable onDragStart={() => onDragStart(shift.id, shift.childminder_id)}
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); onDragOver?.(e, `shift-${shift.id}`); }}
      onDragLeave={e => { e.stopPropagation(); onDragLeave?.(); }}
      onDrop={e => { e.stopPropagation(); onDropOnShift?.(shift.id); }}
      className={`text-[11px] p-1.5 rounded-lg border mb-1 cursor-grab active:cursor-grabbing transition-all ${
        isDropTarget ? "ring-2 ring-primary/50 scale-[1.02] shadow-md" : ""
      } ${statusColors[shift.status] || statusColors.pending}`}>
      <div className="flex items-center gap-1">
        <GripVertical className="w-3 h-3 opacity-40 shrink-0" />
        <span className="font-medium truncate">{shift.title}</span>
      </div>
      <div className="text-[10px] opacity-70">{format(parseISO(shift.start_time), "HH:mm")}–{format(parseISO(shift.end_time), "HH:mm")}</div>
      {shift.location_postcode && <div className="text-[9px] opacity-50">{shift.location_postcode}</div>}
    </div>
  );
};

const RosterRow = ({ cm, days, shifts, viewMode, onDragStart, onDrop, onDropOnShift, hasConflict, dropTarget, onDragOver, onDragLeave, hasSubscription }: {
  cm: PersonOption; days: Date[]; shifts: Shift[]; viewMode: ViewMode;
  onDragStart: (id: string, cmId: string | null) => void;
  onDrop: (cmId: string) => Promise<void>;
  onDropOnShift: (shiftId: string) => Promise<void>;
  hasConflict: boolean;
  dropTarget?: string | null;
  onDragOver?: (e: React.DragEvent, targetId: string) => void;
  onDragLeave?: () => void;
  hasSubscription?: boolean;
}) => {
  const isDropTarget = dropTarget === cm.user_id;
  return (
    <>
      <div className={`bg-card p-2 text-xs font-medium border-t border-border flex items-center gap-1 transition-colors ${
        isDropTarget ? "bg-primary/10 text-primary font-bold" : hasConflict ? "text-destructive" : ""
      }`}>
        {hasConflict && <AlertTriangle className="w-3 h-3 shrink-0" />}
        <span className="truncate">{cm.name}</span>
        {cm.postcode && <span className="text-[9px] text-muted-foreground">({cm.postcode})</span>}
        {hasSubscription === false && <span className="text-[8px] px-1 py-0.5 rounded bg-destructive/10 text-destructive font-bold ml-1">No Sub</span>}
      </div>
      {viewMode === "month" ? (
        [1, 2, 3, 4, 5, 6, 0].map(dow => {
          const dayShifts = shifts.filter(s => s.childminder_id === cm.user_id && parseISO(s.start_time).getDay() === dow);
          return (
            <div key={dow} className={`p-1 min-h-[40px] border-t border-border transition-colors ${isDropTarget ? "bg-primary/5 ring-2 ring-inset ring-primary/30" : "bg-card"}`}
              onDragOver={e => onDragOver?.(e, cm.user_id)} onDragLeave={onDragLeave} onDrop={() => onDrop(cm.user_id)}>
              {dayShifts.slice(0, 2).map(s => (
                <div key={s.id} className={`text-[10px] p-1 rounded border mb-0.5 truncate ${statusColors[s.status]}`}>{s.title}</div>
              ))}
              {dayShifts.length > 2 && <div className="text-[9px] text-muted-foreground">+{dayShifts.length - 2}</div>}
            </div>
          );
        })
      ) : (
        days.map(day => {
          const dayShifts = shifts.filter(s => s.childminder_id === cm.user_id && isSameDay(parseISO(s.start_time), day));
          return (
            <div key={`${cm.user_id}-${day.toISOString()}`}
              className={`p-1.5 min-h-[50px] border-t border-border transition-colors ${isDropTarget ? "bg-primary/5 ring-2 ring-inset ring-primary/30" : "bg-card"}`}
              onDragOver={e => onDragOver?.(e, cm.user_id)} onDragLeave={onDragLeave} onDrop={() => onDrop(cm.user_id)}>
              {dayShifts.map(s => <ShiftCard key={s.id} shift={s} onDragStart={onDragStart} onDropOnShift={onDropOnShift} dropTarget={dropTarget} onDragOver={onDragOver} onDragLeave={onDragLeave} />)}
            </div>
          );
        })
      )}
    </>
  );
};

export default AdminRoster;
