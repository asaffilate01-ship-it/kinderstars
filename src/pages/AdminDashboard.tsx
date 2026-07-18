import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/kinderstars-logo.png";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import AutocompleteInput from "@/components/AutocompleteInput";
import {
  Users, ClipboardList, CalendarClock, CreditCard, ShieldCheck, LogOut, Search,
  CheckCircle2, XCircle, AlertTriangle, Baby, MapPin, ChevronLeft, ChevronRight,
  Calendar, FileText, BarChart3, RefreshCw, PoundSterling, TrendingUp, Plus, Trash2,
  Menu, Sparkles, ClipboardCheck, Bot, X, Mail, CalendarDays, LayoutGrid, GripVertical,
  ArrowUpDown, Filter as FilterIcon, Download, Printer, Pencil, Key, Save, Loader2, Video, UserPlus
} from "lucide-react";
import {
  format, startOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, subWeeks, addMonths, subMonths,
  isSameDay, parseISO, eachDayOfInterval, differenceInMinutes, subDays
} from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";

type Tab = "overview" | "users" | "parents" | "children" | "minders" | "onboarding" | "subscriptions" | "verification" | "roster" | "contracts" | "expenses" | "finance" | "documents" | "ai-scheduler" | "ofsted" | "safeguarding" | "incidents" | "gdpr" | "mfa" | "create-user" | "meetings" | "interviews" | "audit-log" | "analytics";

const EXPENSE_CATEGORIES = [
  "Fuel", "Rent", "Salaries", "Mobile", "Leaflets", "Marketing", "Insurance",
  "Training", "Equipment", "Software", "Utilities", "Office Supplies", "Travel",
  "Uniforms", "Food & Drink", "Childcare Resources", "Cleaning", "Repairs",
  "Subscriptions", "Legal & Professional", "Bank Charges", "Postage", "Miscellaneous",
];

interface Expense {
  id: string;
  created_by: string;
  category: string;
  description: string | null;
  amount: number;
  expense_date: string;
  allocated_to: string | null;
  notes: string | null;
  created_at: string;
  paid_to: string | null;
  is_paid: boolean;
  paid_by: string | null;
  reimbursed: boolean;
}

interface Profile {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  created_at: string;
  phone: string | null;
}

interface ChildminderProfile {
  id: string;
  user_id: string;
  onboarding_status: string;
  town: string | null;
  postcode_district: string | null;
  dbs_number: string | null;
  ofsted_urn: string | null;
  ofsted_rating: string | null;
  experience_years: number | null;
  is_live: boolean | null;
  is_available: boolean | null;
  created_at: string;
  first_aid_expiry: string | null;
  insurance_expiry: string | null;
}

interface ParentProfileRow {
  user_id: string;
  city: string | null;
  postcode: string | null;
  funding_type: string | null;
  has_pets: boolean | null;
  property_type: string | null;
}

interface ChildRow {
  id: string;
  parent_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string | null;
  allergies: string | null;
  special_needs: string | null;
  health_issues: string | null;
}

interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  trial_ends_at: string;
  price_monthly: number;
}

interface Shift {
  id: string;
  title: string;
  status: string;
  start_time: string;
  end_time: string;
  childminder_id: string | null;
  parent_id: string | null;
  location_postcode: string | null;
}

const sidebarItems: { key: Tab; icon: any; label: string; group: string }[] = [
  { key: "overview", icon: BarChart3, label: "Overview", group: "Dashboard" },
  { key: "analytics", icon: TrendingUp, label: "Analytics", group: "Dashboard" },
  { key: "users", icon: Users, label: "All Users", group: "People" },
  { key: "parents", icon: Users, label: "Parents", group: "People" },
  { key: "children", icon: Baby, label: "Children", group: "People" },
  { key: "minders", icon: ShieldCheck, label: "Childminders", group: "People" },
  { key: "onboarding", icon: ClipboardList, label: "Onboarding", group: "Operations" },
  { key: "verification", icon: ShieldCheck, label: "Verification", group: "Operations" },
  { key: "subscriptions", icon: CreditCard, label: "Subscriptions", group: "Operations" },
  { key: "roster", icon: Calendar, label: "Roster", group: "Operations" },
  { key: "ai-scheduler", icon: Bot, label: "AI Scheduler", group: "Operations" },
  { key: "meetings", icon: CalendarDays, label: "Meetings", group: "Operations" },
  { key: "interviews", icon: Video, label: "Interviews", group: "Operations" },
  { key: "contracts", icon: FileText, label: "Contracts", group: "Finance" },
  { key: "documents", icon: FileText, label: "Documents", group: "Finance" },
  { key: "expenses", icon: PoundSterling, label: "Expenses", group: "Finance" },
  { key: "finance", icon: TrendingUp, label: "Finance Pulse", group: "Finance" },
  { key: "ofsted", icon: ClipboardCheck, label: "Ofsted Tools", group: "Compliance" },
  { key: "safeguarding", icon: ShieldCheck, label: "Safeguarding", group: "Compliance" },
  { key: "incidents", icon: AlertTriangle, label: "Incident Log", group: "Compliance" },
  { key: "gdpr", icon: FileText, label: "GDPR", group: "Compliance" },
  { key: "mfa", icon: ShieldCheck, label: "MFA Management", group: "Security" },
  { key: "create-user", icon: Plus, label: "Create User", group: "Security" },
  { key: "audit-log", icon: ClipboardList, label: "Audit Log", group: "Security" },
];

const PAGE_SIZE = 50;

// ─── OFSTED CHECKLIST DATA ───
const OFSTED_AREAS = [
  {
    area: "Leadership & Management",
    weight: 25,
    items: [
      { key: "safeguarding_policy", label: "Safeguarding policy up to date" },
      { key: "staff_dbs", label: "All staff DBS checked" },
      { key: "staff_training", label: "Staff training records current" },
      { key: "complaints_log", label: "Complaints log maintained" },
      { key: "risk_assessments", label: "Risk assessments completed" },
      { key: "supervision_records", label: "Staff supervision records" },
    ],
  },
  {
    area: "Quality of Teaching, Learning & Assessment",
    weight: 25,
    items: [
      { key: "learning_plans", label: "Individual learning plans in place" },
      { key: "observations", label: "Regular child observations recorded" },
      { key: "parent_engagement", label: "Parent engagement documented" },
      { key: "eyfs_tracking", label: "EYFS progress tracking" },
      { key: "activity_planning", label: "Activity planning documented" },
    ],
  },
  {
    area: "Personal Development, Behaviour & Welfare",
    weight: 25,
    items: [
      { key: "first_aid", label: "First aid certificates valid" },
      { key: "food_hygiene", label: "Food hygiene standards met" },
      { key: "accident_records", label: "Accident/incident records maintained" },
      { key: "medication_records", label: "Medication records up to date" },
      { key: "behaviour_policy", label: "Behaviour management policy" },
      { key: "inclusion_policy", label: "Inclusion & equality policy" },
    ],
  },
  {
    area: "Outcomes for Children",
    weight: 25,
    items: [
      { key: "progress_reports", label: "Progress reports generated" },
      { key: "school_readiness", label: "School readiness tracking" },
      { key: "sen_support", label: "SEN support documented" },
      { key: "parent_feedback", label: "Parent feedback collected" },
    ],
  },
];

const AdminDashboard = () => {
  const { user, isAdmin, userRole, loading: authLoading, signOut } = useAuth();
  const isOwner = userRole === "owner";
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [cmProfiles, setCmProfiles] = useState<ChildminderProfile[]>([]);
  const [parentProfiles, setParentProfiles] = useState<ParentProfileRow[]>([]);
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [contractSearch, setContractSearch] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseForm, setExpenseForm] = useState({ category: "Fuel", description: "", amount: "", expense_date: format(new Date(), "yyyy-MM-dd"), allocated_to: "", notes: "", paid_to: "", is_paid: false, paid_by: "", reimbursed: false });
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [expensePeriod, setExpensePeriod] = useState<"day" | "month" | "year" | "all" | "custom">("month");
  const [expenseMonth, setExpenseMonth] = useState(format(new Date(), "yyyy-MM"));
  const [expenseDay, setExpenseDay] = useState(format(new Date(), "yyyy-MM-dd"));
  const [expenseYear, setExpenseYear] = useState(format(new Date(), "yyyy"));
  const [expenseFrom, setExpenseFrom] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [expenseTo, setExpenseTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const paidToSuggestions = useMemo(() => [...new Set(expenses.map(e => e.paid_to).filter(Boolean) as string[])], [expenses]);
  const paidBySuggestions = useMemo(() => [...new Set(expenses.map(e => e.paid_by).filter(Boolean) as string[])], [expenses]);
  const allocatedToSuggestions = useMemo(() => [...new Set(expenses.map(e => e.allocated_to).filter(Boolean) as string[])], [expenses]);
  const [reimbursedFilter, setReimbursedFilter] = useState<"all" | "yes" | "no">("all");
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseSortCol, setExpenseSortCol] = useState<"expense_date" | "amount" | "category" | "paid_to" | "paid_by" | "allocated_to">("expense_date");
  const [expenseSortAsc, setExpenseSortAsc] = useState(false);
  const filteredExpenses = useMemo(() => {
    let list = [...expenses];
    if (reimbursedFilter === "yes") list = list.filter(e => e.reimbursed);
    if (reimbursedFilter === "no") list = list.filter(e => !e.reimbursed);
    if (expenseSearch.trim()) {
      const q = expenseSearch.toLowerCase();
      list = list.filter(e =>
        (e.description || "").toLowerCase().includes(q) ||
        (e.category || "").toLowerCase().includes(q) ||
        (e.paid_to || "").toLowerCase().includes(q) ||
        (e.paid_by || "").toLowerCase().includes(q) ||
        (e.allocated_to || "").toLowerCase().includes(q) ||
        (e.notes || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (expenseSortCol === "amount") cmp = Number(a.amount) - Number(b.amount);
      else {
        const aVal = (a[expenseSortCol] || "").toString().toLowerCase();
        const bVal = (b[expenseSortCol] || "").toString().toLowerCase();
        cmp = aVal.localeCompare(bVal);
      }
      return expenseSortAsc ? cmp : -cmp;
    });
    return list;
  }, [expenses, reimbursedFilter, expenseSearch, expenseSortCol, expenseSortAsc]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [complianceDocs, setComplianceDocs] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [gdprRequests, setGdprRequests] = useState<any[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [incidentForm, setIncidentForm] = useState({ incident_type: "general", description: "", persons_involved: "", actions_taken: "" });
  const [gdprForm, setGdprForm] = useState({ user_id: "", request_type: "access", notes: "" });
  const [createUserForm, setCreateUserForm] = useState({ email: "", password: "", first_name: "", last_name: "", role: "parent" as string });

  // User management
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", email: "", phone: "", role: "" });
  const [resetPwUser, setResetPwUser] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [userActionLoading, setUserActionLoading] = useState(false);

  // Meetings
  const [meetings, setMeetings] = useState<any[]>([]);
  const [meetingForm, setMeetingForm] = useState({ title: "", description: "", meeting_date: format(new Date(), "yyyy-MM-dd"), start_time: "09:00", end_time: "10:00", location: "", organizer_id: "", attendee_ids: [] as string[] });
  const [meetingSaving, setMeetingSaving] = useState(false);

  // Interview Slots
  const [interviewSlots, setInterviewSlots] = useState<any[]>([]);
  const [interviewForm, setInterviewForm] = useState({ slot_date: format(new Date(), "yyyy-MM-dd"), start_time: "10:00", end_time: "10:30", meeting_link: "", role_target: "childminder", assign_to: "" });
  const [interviewSaving, setInterviewSaving] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any | null>(null);

  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"" | "delete" | "role">("");
  const [bulkRole, setBulkRole] = useState("parent");
  const [bulkLoading, setBulkLoading] = useState(false);

  // Audit log
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Parent onboarding submissions
  const [parentOnboardingData, setParentOnboardingData] = useState<Array<{ user_id: string; submitted: boolean; verified: boolean; rejected: boolean }>>([]);

  // Pagination
  const [profilePage, setProfilePage] = useState(0);
  const [parentPage, setParentPage] = useState(0);
  const [childPage, setChildPage] = useState(0);
  const [minderPage, setMinderPage] = useState(0);

  // Counts
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [totalParents, setTotalParents] = useState(0);
  const [totalChildren, setTotalChildren] = useState(0);
  const [totalMinders, setTotalMinders] = useState(0);
  const [totalChildmindersDir, setTotalChildmindersDir] = useState(0);

  // Roster
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  // AI Scheduler
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // AI Scheduler Gantt
  type GanttView = "day" | "week" | "month";
  const [ganttView, setGanttView] = useState<GanttView>("week");
  const [ganttDate, setGanttDate] = useState(new Date());
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [ganttFilterMinder, setGanttFilterMinder] = useState("");
  const [ganttFilterStatus, setGanttFilterStatus] = useState("");
  const [showGanttFilters, setShowGanttFilters] = useState(false);
  const ganttDragRef = useRef<{ shiftId: string; originalCmId: string | null } | null>(null);

  // Compliance check
  const [complianceLoading, setComplianceLoading] = useState(false);

  // Ofsted
  const [ofstedChecks, setOfstedChecks] = useState<Record<string, boolean>>({});
  const [mockAuditMode, setMockAuditMode] = useState(false);
  const [mockAuditScore, setMockAuditScore] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/admin/login");
  }, [authLoading, user, isAdmin, navigate]);

  const fetchCounts = useCallback(async () => {
    const [p, pp, ch, cm, cmDir] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("parent_profiles").select("*", { count: "exact", head: true }),
      supabase.from("children").select("*", { count: "exact", head: true }),
      supabase.from("childminder_profiles").select("*", { count: "exact", head: true }),
      supabase.from("childminders").select("*", { count: "exact", head: true }),
    ]);
    setTotalProfiles(p.count ?? 0);
    setTotalParents(pp.count ?? 0);
    setTotalChildren(ch.count ?? 0);
    setTotalMinders(cm.count ?? 0);
    setTotalChildmindersDir(cmDir.count ?? 0);
  }, []);

  const fetchProfiles = useCallback(async (page: number) => {
    const from = page * PAGE_SIZE;
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
    setProfiles((data ?? []) as Profile[]);
  }, []);

  const fetchParents = useCallback(async (page: number) => {
    const from = page * PAGE_SIZE;
    const { data } = await supabase.from("parent_profiles").select("*").order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
    setParentProfiles((data ?? []) as ParentProfileRow[]);
  }, []);

  const fetchChildren = useCallback(async (page: number) => {
    const from = page * PAGE_SIZE;
    const { data } = await supabase.from("children").select("*").order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
    setChildren((data ?? []) as ChildRow[]);
  }, []);

  const fetchMinders = useCallback(async (page: number) => {
    const from = page * PAGE_SIZE;
    const { data } = await supabase.from("childminder_profiles").select("*").order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
    setCmProfiles((data ?? []) as ChildminderProfile[]);
  }, []);

  const fetchSubs = useCallback(async () => {
    const { data } = await supabase.from("subscriptions").select("*").order("created_at", { ascending: false });
    setSubscriptions((data ?? []) as Subscription[]);
  }, []);

  const fetchShifts = useCallback(async () => {
    const weekEnd = addDays(weekStart, 7);
    const { data } = await supabase.from("shifts").select("*")
      .gte("start_time", weekStart.toISOString())
      .lt("start_time", weekEnd.toISOString())
      .order("start_time");
    setShifts((data ?? []) as Shift[]);
  }, [weekStart]);

  const fetchAllExpenses = useCallback(async () => {
    const { data } = await supabase.from("expenses").select("*").order("expense_date", { ascending: false });
    setExpenses((data ?? []) as Expense[]);
  }, []);

  const fetchUnreadMessages = useCallback(async () => {
    const { count } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("read", false);
    setUnreadMessageCount(count ?? 0);
  }, []);

  const fetchIncidents = useCallback(async () => {
    const { data } = await supabase.from("incidents").select("*").order("incident_date", { ascending: false });
    setIncidents(data || []);
  }, []);

  const fetchGdpr = useCallback(async () => {
    const { data } = await supabase.from("gdpr_requests").select("*").order("created_at", { ascending: false });
    setGdprRequests(data || []);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    setDataLoading(true);
    Promise.all([fetchCounts(), fetchProfiles(0), fetchSubs(), fetchAllExpenses(), fetchUnreadMessages(), fetchIncidents(), fetchGdpr()]).then(() => setDataLoading(false));
  }, [isAdmin]);

  // Realtime subscriptions for sidebar badge counts
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel("admin-badge-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "childminder_profiles" }, () => fetchMinders(minderPage))
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, () => fetchIncidents())
      .on("postgres_changes", { event: "*", schema: "public", table: "gdpr_requests" }, () => fetchGdpr())
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => fetchUnreadMessages())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, minderPage]);

  useEffect(() => { fetchProfiles(profilePage); }, [profilePage]);
  useEffect(() => { if (tab === "parents") fetchParents(parentPage); }, [tab, parentPage]);
  useEffect(() => { if (tab === "children") fetchChildren(childPage); }, [tab, childPage]);
  useEffect(() => { if (tab === "minders" || tab === "onboarding" || tab === "verification") fetchMinders(minderPage); }, [tab, minderPage]);
  useEffect(() => { if (tab === "onboarding" || tab === "verification") fetchParentOnboarding(); }, [tab]);
  useEffect(() => { if (tab === "roster") fetchShifts(); }, [tab, weekStart]);
  useEffect(() => {
    if (tab === "contracts" && isAdmin) {
      supabase.from("contracts").select("*").order("created_at", { ascending: false }).then(({ data }) => setContracts(data || []));
    }
  }, [tab, isAdmin]);

  const fetchExpenses = useCallback(async () => {
    let query = supabase.from("expenses").select("*").order("expense_date", { ascending: false });
    if (expensePeriod === "day") {
      query = query.eq("expense_date", expenseDay);
    } else if (expensePeriod === "month") {
      const startDate = `${expenseMonth}-01`;
      const endMonth = new Date(startDate);
      endMonth.setMonth(endMonth.getMonth() + 1);
      query = query.gte("expense_date", startDate).lt("expense_date", format(endMonth, "yyyy-MM-dd"));
    } else if (expensePeriod === "year") {
      query = query.gte("expense_date", `${expenseYear}-01-01`).lt("expense_date", `${Number(expenseYear) + 1}-01-01`);
    } else if (expensePeriod === "custom") {
      query = query.gte("expense_date", expenseFrom).lte("expense_date", expenseTo);
    }
    // "all" — no date filter
    const { data } = await query;
    setExpenses((data ?? []) as Expense[]);
  }, [expensePeriod, expenseMonth, expenseDay, expenseYear, expenseFrom, expenseTo]);

  useEffect(() => { if (tab === "expenses" && isAdmin) fetchExpenses(); }, [tab, isAdmin, fetchExpenses]);
  useEffect(() => {
    if (tab === "finance" && isAdmin) {
      fetchExpenses();
      supabase.from("invoices").select("*").order("created_at", { ascending: false }).then(({ data }) => setInvoices(data || []));
      supabase.from("contracts").select("*").order("created_at", { ascending: false }).then(({ data }) => setContracts(data || []));
    }
  }, [tab, isAdmin]);

  useEffect(() => {
    if ((tab === "documents" || tab === "verification" || tab === "onboarding") && isAdmin) {
      supabase.from("compliance_documents").select("*").order("created_at", { ascending: false }).then(({ data }) => setComplianceDocs(data || []));
    }
  }, [tab, isAdmin]);

  useEffect(() => {
    if (tab === "incidents" && isAdmin) fetchIncidents();
  }, [tab, isAdmin]);

  useEffect(() => {
    if (tab === "gdpr" && isAdmin) fetchGdpr();
  }, [tab, isAdmin]);

  const fetchMeetings = useCallback(async () => {
    const { data } = await supabase.from("meetings").select("*").order("meeting_date", { ascending: true }).order("start_time", { ascending: true });
    setMeetings(data || []);
  }, []);

  useEffect(() => {
    if (tab === "meetings" && isAdmin) fetchMeetings();
  }, [tab, isAdmin]);

  const fetchInterviewSlots = useCallback(async () => {
    const { data } = await supabase.from("interview_slots").select("*").order("slot_date", { ascending: true }).order("start_time", { ascending: true });
    setInterviewSlots(data || []);
  }, []);

  useEffect(() => {
    if (tab === "interviews" && isAdmin) fetchInterviewSlots();
  }, [tab, isAdmin]);

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    const { data } = await supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(200);
    setAuditLogs(data || []);
    setAuditLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "audit-log" && isAdmin) fetchAuditLogs();
  }, [tab, isAdmin]);

  // AI Scheduler - fetch all shifts + childminders + availability
  const ganttDateRange = useMemo(() => {
    if (ganttView === "day") return { start: ganttDate, end: ganttDate };
    if (ganttView === "week") {
      const ws = startOfWeek(ganttDate, { weekStartsOn: 1 });
      return { start: ws, end: addDays(ws, 6) };
    }
    return { start: startOfMonth(ganttDate), end: endOfMonth(ganttDate) };
  }, [ganttView, ganttDate]);

  const ganttDays = useMemo(() => eachDayOfInterval(ganttDateRange), [ganttDateRange]);

  const fetchAllShifts = useCallback(async () => {
    const fetchEnd = addDays(ganttDateRange.end, 1);
    const { data } = await supabase.from("shifts").select("*")
      .gte("start_time", ganttDateRange.start.toISOString())
      .lt("start_time", fetchEnd.toISOString())
      .order("start_time");
    setAllShifts((data ?? []) as Shift[]);
  }, [ganttDateRange]);

  useEffect(() => {
    if (tab === "ai-scheduler" && isAdmin) {
      fetchMinders(0);
      fetchAllShifts();
    }
  }, [tab, isAdmin, ganttDateRange]);

  // Gantt conflicts
  const ganttConflicts = useMemo(() => {
    const conflicts: Array<{ cmId: string; cmName: string; shifts: Shift[]; message: string }> = [];
    const cmShifts: Record<string, Shift[]> = {};
    allShifts.forEach(s => {
      if (s.childminder_id) {
        if (!cmShifts[s.childminder_id]) cmShifts[s.childminder_id] = [];
        cmShifts[s.childminder_id].push(s);
      }
    });
    Object.entries(cmShifts).forEach(([cmId, list]) => {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const aS = parseISO(list[i].start_time), aE = parseISO(list[i].end_time);
          const bS = parseISO(list[j].start_time), bE = parseISO(list[j].end_time);
          if (aS < bE && bS < aE) {
            const cm = cmProfiles.find(c => c.user_id === cmId);
            conflicts.push({ cmId, cmName: getProfileName(cmId), shifts: [list[i], list[j]], message: `${list[i].title} overlaps ${list[j].title}` });
          }
        }
      }
    });
    return conflicts;
  }, [allShifts, cmProfiles]);

  // Gantt filtered shifts
  const ganttFilteredShifts = useMemo(() => {
    let result = [...allShifts];
    if (ganttFilterMinder) result = result.filter(s => s.childminder_id === ganttFilterMinder);
    if (ganttFilterStatus) result = result.filter(s => s.status === ganttFilterStatus);
    return result;
  }, [allShifts, ganttFilterMinder, ganttFilterStatus]);

  const ganttGetCmName = (id: string | null) => id ? getProfileName(id) : "Unassigned";

  const handleGanttDragStart = (shiftId: string, cmId: string | null) => {
    ganttDragRef.current = { shiftId, originalCmId: cmId };
  };

  const handleGanttDrop = async (targetCmId: string) => {
    if (!ganttDragRef.current) return;
    const { shiftId } = ganttDragRef.current;
    const { error } = await supabase.from("shifts").update({ childminder_id: targetCmId, status: "offered" }).eq("id", shiftId);
    ganttDragRef.current = null;
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Shift reassigned" }); fetchAllShifts(); }
  };

  const navigateGantt = (dir: 1 | -1) => {
    if (ganttView === "day") setGanttDate(d => addDays(d, dir));
    else if (ganttView === "week") setGanttDate(d => dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1));
    else setGanttDate(d => dir === 1 ? addMonths(d, 1) : subMonths(d, 1));
  };

  const runComplianceCheck = async () => {
    setComplianceLoading(true);
    try {
      const res = await supabase.functions.invoke("check-compliance-expiry", {
        body: { warning_days: 30, critical_days: 7 },
      });
      if (res.error) throw new Error(res.error.message);
      const data = res.data;
      toast({ title: `Compliance check complete`, description: `${data.total_alerts} alerts, ${data.emails_sent} emails sent` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setComplianceLoading(false);
  };

  const reviewDocument = async (docId: string, status: string, notes?: string) => {
    await supabase.from("compliance_documents").update({ status, review_notes: notes || null, reviewed_by: user!.id }).eq("id", docId);
    toast({ title: `Document ${status}` });
    supabase.from("compliance_documents").select("*").order("created_at", { ascending: false }).then(({ data }) => setComplianceDocs(data || []));

    // Send email notification to the document owner
    const doc = complianceDocs.find(d => d.id === docId);
    if (doc) {
      const ownerProfile = profiles.find(p => p.user_id === doc.user_id);
      if (ownerProfile?.email) {
        const statusLabel = status === "approved" ? "✅ Approved" : status === "rejected" ? "❌ Rejected" : status;
        const docType = (doc.document_type || "document").replace(/_/g, " ");
        supabase.functions.invoke("send-email", {
          body: {
            to: ownerProfile.email,
            subject: `KinderStars: Your ${docType} has been ${status}`,
            html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:20px;">
              <h2 style="color:#2563eb;">KinderStars Document Review</h2>
              <p>Hi ${ownerProfile.first_name || "there"},</p>
              <p>Your <strong>${docType}</strong> has been reviewed.</p>
              <p style="font-size:18px;font-weight:bold;">${statusLabel}</p>
              ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
              ${status === "rejected" ? "<p>Please re-upload the document via your portal.</p>" : "<p>No further action is needed.</p>"}
              <p style="margin-top:20px;color:#888;font-size:12px;">KinderStars Team</p>
            </div>`,
          },
        }).catch(() => {});
      }
    }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.amount || !expenseForm.category) {
      toast({ title: "Please fill category and amount", variant: "destructive" });
      return;
    }
    setExpenseSaving(true);
    const { error } = await supabase.from("expenses").insert({
      created_by: user!.id,
      category: expenseForm.category,
      description: expenseForm.description || null,
      amount: parseFloat(expenseForm.amount),
      expense_date: expenseForm.expense_date,
      allocated_to: expenseForm.allocated_to || null,
      notes: expenseForm.notes || null,
      paid_to: expenseForm.paid_to || null,
      is_paid: false, // Always pending — only Owner can approve
      paid_by: expenseForm.paid_by || null,
      reimbursed: expenseForm.reimbursed,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Expense added!" });
      setExpenseForm({ category: "Fuel", description: "", amount: "", expense_date: format(new Date(), "yyyy-MM-dd"), allocated_to: "", notes: "", paid_to: "", is_paid: false, paid_by: "", reimbursed: false });
      fetchExpenses();
    }
    setExpenseSaving(false);
  };

  const deleteExpense = async (id: string) => {
    await supabase.from("expenses").delete().eq("id", id);
    toast({ title: "Expense deleted" });
    fetchExpenses();
  };

  const toggleExpensePaid = async (id: string, current: boolean) => {
    if (!isOwner) {
      toast({ title: "Only the Owner can approve expenses", variant: "destructive" });
      return;
    }
    await supabase.from("expenses").update({ is_paid: !current }).eq("id", id);
    toast({ title: !current ? "Expense approved ✅" : "Expense unapproved" });
    fetchExpenses();
  };

  const getProfileName = (userId: string) => {
    const p = profiles.find((pr) => pr.user_id === userId);
    return p ? `${p.first_name} ${p.last_name}`.trim() || p.email : userId.slice(0, 8);
  };

  const REQUIRED_DOCS_BY_ROLE: Record<string, { type: string; label: string }[]> = {
    childminder: [
      { type: "dbs_certificate", label: "DBS Certificate" },
      { type: "first_aid_cert", label: "First Aid Certificate" },
      { type: "insurance", label: "Insurance Document" },
      { type: "ofsted_registration", label: "Ofsted Registration" },
    ],
    parent: [
      { type: "other", label: "Proof of Identity (Passport or Driving Licence)" },
      { type: "proof_of_address", label: "Proof of Address (Utility Bill or Bank Statement)" },
    ],
  };

  const checkUserDocuments = async (userId: string, role?: string): Promise<{ total: number; approved: number; pending: number; rejected: number; allApproved: boolean; missingRequired: string[] }> => {
    const { data: docs } = await supabase.from("compliance_documents").select("document_type, status").eq("user_id", userId);
    const total = docs?.length ?? 0;
    const approved = docs?.filter(d => d.status === "approved").length ?? 0;
    const pending = docs?.filter(d => d.status === "pending").length ?? 0;
    const rejected = docs?.filter(d => d.status === "rejected").length ?? 0;

    // Check role-specific required documents are uploaded AND approved
    const required = REQUIRED_DOCS_BY_ROLE[role || ""] || [];
    const missingRequired = required
      .filter(req => !docs?.some(d => d.document_type === req.type && d.status === "approved"))
      .map(req => req.label);

    const allApproved = total > 0 && approved === total && missingRequired.length === 0;
    return { total, approved, pending, rejected, allApproved, missingRequired };
  };

  const updateOnboardingStatus = async (userId: string, status: string) => {
    // Block verification if documents aren't all approved
    if (status === "verified" || status === "interview_passed") {
      const docCheck = await checkUserDocuments(userId, "childminder");
      if (docCheck.missingRequired.length > 0) {
        toast({ title: "Missing required documents", description: `The following must be uploaded and approved: ${docCheck.missingRequired.join(", ")}`, variant: "destructive" });
        return;
      }
      if (docCheck.total === 0) {
        toast({ title: "Cannot proceed", description: "No documents uploaded. The user must upload required documents first.", variant: "destructive" });
        return;
      }
      if (!docCheck.allApproved) {
        toast({ title: "Cannot proceed", description: `${docCheck.pending} pending, ${docCheck.rejected} rejected document(s). All documents must be approved before ${status === "verified" ? "verification" : "passing interview"}.`, variant: "destructive" });
        return;
      }
    }

    const updateData: Record<string, unknown> = { onboarding_status: status };
    if (status === "verified") {
      updateData.prospect_stage = "migrated";
    }
    const { error } = await supabase.from("childminder_profiles").update(updateData).eq("user_id", userId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `Status → ${status}` }); fetchMinders(minderPage); }
  };

  const toggleLive = async (userId: string, current: boolean) => {
    // Block going live if documents aren't all approved
    if (!current) {
      const docCheck = await checkUserDocuments(userId, "childminder");
      if (docCheck.missingRequired.length > 0) {
        toast({ title: "Missing required documents", description: `The following must be uploaded and approved: ${docCheck.missingRequired.join(", ")}`, variant: "destructive" });
        return;
      }
      if (!docCheck.allApproved) {
        toast({ title: "Cannot go live", description: `${docCheck.total === 0 ? "No documents uploaded" : `${docCheck.pending} pending, ${docCheck.rejected} rejected document(s)`}. All documents must be approved first.`, variant: "destructive" });
        return;
      }
    }
    await supabase.from("childminder_profiles").update({ is_live: !current }).eq("user_id", userId);
    toast({ title: !current ? "Now live" : "Set offline" });
    fetchMinders(minderPage);
  };

  const fetchParentOnboarding = useCallback(async () => {
    const { data: pProfiles } = await supabase.from("parent_profiles").select("user_id");
    if (!pProfiles || pProfiles.length === 0) { setParentOnboardingData([]); return; }
    const parentUserIds = pProfiles.map(p => p.user_id);
    const { data: tasks } = await supabase.from("onboarding_tasks").select("user_id, task_key, completed")
      .in("user_id", parentUserIds)
      .in("task_key", ["parent_submitted", "parent_verified", "parent_rejected"]);
    const result = parentUserIds.map(uid => {
      const userTasks = tasks?.filter(t => t.user_id === uid) || [];
      return {
        user_id: uid,
        submitted: userTasks.some(t => t.task_key === "parent_submitted" && t.completed),
        verified: userTasks.some(t => t.task_key === "parent_verified" && t.completed),
        rejected: userTasks.some(t => t.task_key === "parent_rejected" && t.completed),
      };
    });
    setParentOnboardingData(result);
  }, []);

  const verifyParent = async (userId: string) => {
    // Check parent documents are all approved
    const docCheck = await checkUserDocuments(userId, "parent");
    if (docCheck.missingRequired.length > 0) {
      toast({ title: "Missing required documents", description: `The following must be uploaded and approved: ${docCheck.missingRequired.join(", ")}`, variant: "destructive" });
      return;
    }
    if (docCheck.total > 0 && !docCheck.allApproved) {
      toast({ title: "Cannot verify", description: `${docCheck.pending} pending, ${docCheck.rejected} rejected document(s). All documents must be approved before verification.`, variant: "destructive" });
      return;
    }

    await supabase.from("onboarding_tasks").upsert(
      { user_id: userId, task_key: "parent_verified", task_label: "Parent verified by admin", completed: true, completed_at: new Date().toISOString() },
      { onConflict: "user_id,task_key" }
    );
    await supabase.from("onboarding_tasks").upsert(
      { user_id: userId, task_key: "parent_rejected", task_label: "Parent rejected", completed: false, completed_at: null },
      { onConflict: "user_id,task_key" }
    );
    toast({ title: "Parent verified ✅" });
    fetchParentOnboarding();
  };

  const rejectParent = async (userId: string) => {
    await supabase.from("onboarding_tasks").upsert(
      { user_id: userId, task_key: "parent_rejected", task_label: "Parent rejected by admin", completed: true, completed_at: new Date().toISOString() },
      { onConflict: "user_id,task_key" }
    );
    await supabase.from("onboarding_tasks").upsert(
      { user_id: userId, task_key: "parent_verified", task_label: "Parent verified by admin", completed: false, completed_at: null },
      { onConflict: "user_id,task_key" }
    );
    toast({ title: "Parent rejected", variant: "destructive" });
    fetchParentOnboarding();
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await supabase.functions.invoke("seed-demo-data");
      if (res.error) throw new Error(res.error.message);
      toast({ title: "Demo data seeded!", description: JSON.stringify(res.data?.results?.slice(0, 3)) });
      fetchCounts();
      fetchProfiles(0);
    } catch (err: any) {
      toast({ title: "Seed error", description: err.message, variant: "destructive" });
    }
    setSeeding(false);
  };

  // AI Scheduler
  const runAiScheduler = async () => {
    setAiLoading(true);
    setAiResult(null);
    try {
      // Fetch unassigned shifts
      const { data: unassigned } = await supabase.from("shifts").select("*").is("childminder_id", null).eq("status", "pending");
      const { data: cmData } = await supabase.from("childminder_profiles").select("*");
      const { data: availData } = await supabase.from("availability").select("*");

      if (!unassigned?.length) {
        toast({ title: "No unassigned shifts", description: "All shifts already have childminders assigned.", variant: "destructive" });
        setAiLoading(false);
        return;
      }

      // Get profile names for childminders
      const cmIds = (cmData ?? []).map(c => c.user_id);
      let names: Record<string, string> = {};
      if (cmIds.length) {
        const { data: pData } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", cmIds);
        (pData ?? []).forEach(p => { names[p.user_id] = `${p.first_name} ${p.last_name}`.trim(); });
      }

      const cmWithNames = (cmData ?? []).map(c => ({ ...c, name: names[c.user_id] || c.user_id.slice(0, 8) }));

      const res = await supabase.functions.invoke("ai-scheduler", {
        body: { shifts: unassigned, childminders: cmWithNames, availability: availData ?? [] },
      });

      if (res.error) throw new Error(res.error.message);
      setAiResult(res.data);
      toast({ title: "AI scheduling complete!" });
    } catch (err: any) {
      toast({ title: "AI Scheduler Error", description: err.message, variant: "destructive" });
    }
    setAiLoading(false);
  };

  const applyAiAssignments = async () => {
    if (!aiResult?.assignments?.length) return;
    let success = 0;
    for (const a of aiResult.assignments) {
      const { error } = await supabase.from("shifts").update({ childminder_id: a.childminder_id, status: "offered" }).eq("id", a.shift_id);
      if (!error) success++;
    }
    toast({ title: `${success} shifts assigned!` });
    setAiResult(null);
    fetchShifts();
  };

  // Ofsted score calculation
  const ofstedScore = useMemo(() => {
    let totalChecked = 0;
    let totalItems = 0;
    const areaScores = OFSTED_AREAS.map(area => {
      const checked = area.items.filter(i => ofstedChecks[i.key]).length;
      totalChecked += checked;
      totalItems += area.items.length;
      const pct = area.items.length > 0 ? (checked / area.items.length) * 100 : 0;
      return { area: area.area, score: pct, checked, total: area.items.length };
    });
    const overall = totalItems > 0 ? (totalChecked / totalItems) * 100 : 0;
    let grade: string;
    if (overall >= 90) grade = "Outstanding";
    else if (overall >= 70) grade = "Good";
    else if (overall >= 50) grade = "Requires Improvement";
    else grade = "Inadequate";
    return { overall, grade, areaScores };
  }, [ofstedChecks]);

  const runMockAudit = () => {
    setMockAuditMode(true);
    // Simulate pulling real data from DB
    const dbChecks: Record<string, boolean> = {};
    // Auto-check items based on DB state
    const hasStaffDbs = cmProfiles.some(c => c.dbs_number);
    dbChecks["staff_dbs"] = hasStaffDbs;
    const hasFirstAid = cmProfiles.some(c => c.first_aid_expiry && new Date(c.first_aid_expiry) > new Date());
    dbChecks["first_aid"] = hasFirstAid;
    const hasDocs = complianceDocs.filter(d => d.status === "approved").length > 0;
    dbChecks["safeguarding_policy"] = hasDocs;
    dbChecks["risk_assessments"] = hasDocs;

    setOfstedChecks(prev => ({ ...prev, ...dbChecks }));

    const totalItems = OFSTED_AREAS.reduce((s, a) => s + a.items.length, 0);
    const checked = Object.values({ ...ofstedChecks, ...dbChecks }).filter(Boolean).length;
    const pct = totalItems > 0 ? (checked / totalItems) * 100 : 0;
    let grade: string;
    if (pct >= 90) grade = "Outstanding";
    else if (pct >= 70) grade = "Good";
    else if (pct >= 50) grade = "Requires Improvement";
    else grade = "Inadequate";

    const gaps = OFSTED_AREAS.flatMap(a =>
      a.items.filter(i => !ofstedChecks[i.key] && !dbChecks[i.key]).map(i => ({ area: a.area, item: i.label }))
    );

    setMockAuditScore({ grade, pct, gaps, timestamp: new Date().toISOString() });
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-muted text-muted-foreground", submitted: "bg-primary/15 text-foreground",
      interview_scheduled: "bg-secondary/15 text-secondary", interview_passed: "bg-success/15 text-success",
      verified: "bg-success/20 text-success", rejected: "bg-destructive/15 text-destructive",
      active: "bg-success/15 text-success", free_trial: "bg-primary/15 text-foreground",
      admin: "bg-destructive/10 text-destructive", childminder: "bg-secondary/10 text-secondary",
      parent: "bg-primary/10 text-foreground", user: "bg-muted text-muted-foreground",
      prospect: "bg-amber-500/15 text-amber-700", trainee: "bg-blue-500/15 text-blue-700",
      ready_for_review: "bg-violet-500/15 text-violet-700", migrated: "bg-success/15 text-success",
    };
    return <span className={`text-[11px] px-2 py-1 rounded-full font-bold whitespace-nowrap ${colors[status] || colors.pending}`}>{status.replace(/_/g, " ")}</span>;
  };

  const Paginator = ({ page, setPage, total }: { page: number; setPage: (p: number) => void; total: number }) => {
    const maxPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
    return (
      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" disabled={page >= maxPage} onClick={() => setPage(page + 1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>
    );
  };

  if (authLoading || !isAdmin) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const groups = [...new Set(sidebarItems.map(i => i.group))];

  // Badge counts for sidebar
  const pendingVerifications = cmProfiles.filter(c => c.onboarding_status !== "verified").length;
  const pendingOnboarding = cmProfiles.filter(c => c.onboarding_status === "pending" || c.onboarding_status === "submitted").length;
  const openIncidents = incidents.filter(i => i.status === "open").length;
  const pendingGdpr = gdprRequests.filter(g => g.status === "pending").length;
  const sidebarBadges: Partial<Record<Tab, number>> = {
    verification: pendingVerifications,
    onboarding: pendingOnboarding,
    incidents: openIncidents,
    gdpr: pendingGdpr,
  };
  if (unreadMessageCount > 0) {
    // No messages tab in admin but keep for future use
  }
  return (
    <div className="min-h-screen bg-background flex">
      {/* ═══ SIDEBAR ═══ */}
      <aside className={`${sidebarOpen ? "w-56" : "w-0 overflow-hidden"} shrink-0 border-r border-border bg-card transition-all duration-200 flex flex-col sticky top-0 h-screen`}>
        <div className="p-3 border-b border-border flex items-center gap-2">
          <a href="/"><img src={logo} alt="KinderStars" className="w-[100px]" /></a>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {groups.map(group => (
            <div key={group} className="mb-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{group}</div>
              {sidebarItems.filter(i => i.group === group).map(item => {
                const badge = sidebarBadges[item.key] || 0;
                return (
                <button key={item.key} onClick={() => setTab(item.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                    tab === item.key ? "bg-secondary/15 text-secondary font-medium border-r-2 border-secondary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}>
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate flex-1 text-left">{item.label}</span>
                  {badge > 0 && (
                    <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{badge}</span>
                  )}
                </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-border space-y-1.5">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" className="w-full justify-start text-xs gap-1.5" asChild><a href="/admin/create-user"><Plus className="w-3.5 h-3.5" />New User</a></Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-xs gap-1.5" asChild><a href="/admin/roster"><Calendar className="w-3.5 h-3.5" />Full Roster</a></Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-xs gap-1.5" onClick={() => { signOut(); navigate("/"); }}>
            <LogOut className="w-3.5 h-3.5" />Sign Out
          </Button>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-40 backdrop-blur-md border-b border-border px-4 py-2.5 flex items-center gap-3 bg-background/82">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
          <h1 className="text-sm font-bold capitalize">{sidebarItems.find(i => i.key === tab)?.label || tab}</h1>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground hidden md:block">{user?.user_metadata?.first_name || user?.email}</span>
        </header>

        <main className="p-4 max-w-[1400px] mx-auto">
          {dataLoading ? (
            <div className="text-muted-foreground text-sm text-center py-10">Loading…</div>
          ) : (
            <>
              {/* ═══ OVERVIEW ═══ */}
              {tab === "overview" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Dashboard Overview</h2>
                    <Button variant="warm" size="sm" className="gap-1.5" onClick={handleSeed} disabled={seeding}>
                      <RefreshCw className={`w-4 h-4 ${seeding ? "animate-spin" : ""}`} />
                      {seeding ? "Seeding…" : "Seed Demo Data"}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { label: "Total Users", value: totalProfiles, onClick: () => setTab("users") },
                      { label: "Parents", value: totalParents, onClick: () => setTab("parents") },
                      { label: "Children", value: totalChildren, onClick: () => setTab("children") },
                      { label: "Registered Minders", value: totalMinders, onClick: () => setTab("minders") },
                      { label: "Directory Listings", value: totalChildmindersDir },
                    ].map((s) => (
                      <button key={s.label} onClick={s.onClick} className="ks-card p-4 text-center hover:shadow-lg transition-shadow">
                        <div className="text-2xl font-bold">{s.value.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="ks-card p-4">
                      <h3 className="font-bold text-sm mb-2">Onboarding Pipeline</h3>
                      {["pending","submitted","interview_scheduled","verified"].map((s) => {
                        const count = cmProfiles.filter((c) => c.onboarding_status === s).length;
                        return <div key={s} className="flex justify-between text-xs py-1 border-b border-border last:border-0">
                          <span>{statusBadge(s)}</span><span className="font-bold">{count}</span>
                        </div>;
                      })}
                    </div>
                    <div className="ks-card p-4">
                      <h3 className="font-bold text-sm mb-2">User Roles</h3>
                      {["admin","childminder","parent"].map((r) => (
                        <div key={r} className="flex justify-between text-xs py-1 border-b border-border last:border-0">
                          <span>{statusBadge(r)}</span>
                          <span className="font-bold">{profiles.filter((p) => p.role === r).length}</span>
                        </div>
                      ))}
                    </div>
                    <div className="ks-card p-4">
                      <h3 className="font-bold text-sm mb-2">Subscriptions</h3>
                      <div className="text-2xl font-bold">{subscriptions.filter((s) => s.status === "active").length}</div>
                      <div className="text-xs text-muted-foreground">Active subscriptions</div>
                      <div className="text-lg font-bold mt-2">{subscriptions.length}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                  </div>
                  {/* KPI Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* User Growth Chart */}
                    <div className="ks-card p-4">
                      <h3 className="font-bold text-sm mb-3">User Registrations (Last 30 Days)</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={(() => {
                          const days: { date: string; count: number }[] = [];
                          for (let i = 29; i >= 0; i--) {
                            const d = format(subDays(new Date(), i), "yyyy-MM-dd");
                            const count = profiles.filter(p => p.created_at && format(new Date(p.created_at), "yyyy-MM-dd") === d).length;
                            days.push({ date: format(subDays(new Date(), i), "dd/MM"), count });
                          }
                          return days;
                        })()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 91%)" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid hsl(220 20% 91%)" }} />
                          <Bar dataKey="count" fill="hsl(200 93% 23%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Role Distribution Pie */}
                    <div className="ks-card p-4">
                      <h3 className="font-bold text-sm mb-3">Role Distribution</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Parents", value: totalParents },
                              { name: "Childminders", value: totalMinders },
                              { name: "Admins", value: profiles.filter(p => p.role === "admin").length },
                            ].filter(d => d.value > 0)}
                            cx="50%" cy="50%" outerRadius={70} innerRadius={40}
                            paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}
                          >
                            <Cell fill="hsl(200 93% 23%)" />
                            <Cell fill="hsl(44 93% 57%)" />
                            <Cell fill="hsl(6 78% 42%)" />
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Revenue/Expenses Trend */}
                    <div className="ks-card p-4">
                      <h3 className="font-bold text-sm mb-3">Monthly Expense Trend</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={(() => {
                          const months: { month: string; total: number }[] = [];
                          for (let i = 5; i >= 0; i--) {
                            const d = subMonths(new Date(), i);
                            const m = format(d, "yyyy-MM");
                            const total = expenses.filter(e => e.expense_date.startsWith(m)).reduce((s, e) => s + Number(e.amount), 0);
                            months.push({ month: format(d, "MMM"), total });
                          }
                          return months;
                        })()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 91%)" />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} formatter={(v: number) => [`£${v.toFixed(2)}`, "Expenses"]} />
                          <Line type="monotone" dataKey="total" stroke="hsl(44 93% 57%)" strokeWidth={2} dot={{ fill: "hsl(44 93% 57%)", r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Subscription Status */}
                    <div className="ks-card p-4">
                      <h3 className="font-bold text-sm mb-3">Subscription Status</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={(() => {
                              const statuses = ["active", "free_trial", "cancelled", "expired"];
                              return statuses.map(s => ({ name: s.replace(/_/g, " "), value: subscriptions.filter(sub => sub.status === s).length })).filter(d => d.value > 0);
                            })()}
                            cx="50%" cy="50%" outerRadius={70} innerRadius={40}
                            paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}
                          >
                            <Cell fill="hsl(155 87% 24%)" />
                            <Cell fill="hsl(44 93% 57%)" />
                            <Cell fill="hsl(6 78% 42%)" />
                            <Cell fill="hsl(220 20% 60%)" />
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Ofsted Quick Score */}
                  <div className="ks-card p-4">
                    <h3 className="font-bold text-sm mb-2 flex items-center gap-1.5"><ClipboardCheck className="w-4 h-4" /> Ofsted Readiness</h3>
                    <div className="flex items-center gap-4">
                      <div className={`text-3xl font-bold ${ofstedScore.overall >= 70 ? "text-success" : ofstedScore.overall >= 50 ? "text-primary" : "text-destructive"}`}>
                        {ofstedScore.overall.toFixed(0)}%
                      </div>
                      <div>
                        <div className={`text-sm font-bold ${ofstedScore.grade === "Outstanding" ? "text-success" : ofstedScore.grade === "Good" ? "text-success" : "text-destructive"}`}>
                          {ofstedScore.grade}
                        </div>
                        <div className="text-xs text-muted-foreground">Estimated grade</div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setTab("ofsted")} className="ml-auto">View Details →</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ USERS ═══ */}
              {tab === "users" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold flex-1">All Users ({totalProfiles.toLocaleString()})</h2>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input className="pl-9 pr-3 py-2 rounded-xl border border-border text-sm bg-card w-48" placeholder="Search…"
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                  </div>

                  {/* Edit User Panel */}
                  {editingUser && (
                    <div className="ks-card p-5 space-y-3 border-2 border-secondary/30">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm flex items-center gap-1.5"><Pencil className="w-4 h-4" /> Edit: {editingUser.first_name} {editingUser.last_name}</h3>
                        <Button variant="ghost" size="sm" onClick={() => setEditingUser(null)}><X className="w-4 h-4" /></Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="ks-field"><label>First Name</label><input value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} /></div>
                        <div className="ks-field"><label>Last Name</label><input value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} /></div>
                        <div className="ks-field"><label>Email</label><input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} /></div>
                        <div className="ks-field"><label>Phone</label><input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} /></div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Role</label>
                          <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={editForm.role}
                            onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                            <option value="parent">Parent</option>
                            <option value="childminder">Childminder</option>
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="success" size="sm" className="gap-1.5" disabled={userActionLoading} onClick={async () => {
                          setUserActionLoading(true);
                          try {
                            const { data: profRes, error: profErr } = await supabase.functions.invoke("manage-user", {
                              body: { action: "update_profile", user_id: editingUser.user_id, first_name: editForm.first_name, last_name: editForm.last_name, email: editForm.email, phone: editForm.phone },
                            });
                            if (profErr || profRes?.error) throw new Error(profErr?.message || profRes?.error);
                            if (editForm.role !== editingUser.role) {
                              const { data: roleRes, error: roleErr } = await supabase.functions.invoke("manage-user", {
                                body: { action: "change_role", user_id: editingUser.user_id, role: editForm.role },
                              });
                              if (roleErr || roleRes?.error) throw new Error(roleErr?.message || roleRes?.error);
                            }
                            toast({ title: "User updated!" });
                            setEditingUser(null);
                            fetchProfiles(profilePage);
                            fetchCounts();
                          } catch (err: any) {
                            toast({ title: "Error", description: err.message, variant: "destructive" });
                          }
                          setUserActionLoading(false);
                        }}>
                          {userActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingUser(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  {/* Reset Password Panel */}
                  {resetPwUser && (
                    <div className="ks-card p-5 space-y-3 border-2 border-primary/30">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm flex items-center gap-1.5"><Key className="w-4 h-4" /> Reset Password: {resetPwUser.email}</h3>
                        <Button variant="ghost" size="sm" onClick={() => { setResetPwUser(null); setNewPassword(""); }}><X className="w-4 h-4" /></Button>
                      </div>
                      <div className="ks-field max-w-sm"><label>New Password (min 6 chars)</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password…" /></div>
                      <div className="flex gap-2">
                        <Button variant="warm" size="sm" className="gap-1.5" disabled={userActionLoading || newPassword.length < 6} onClick={async () => {
                          setUserActionLoading(true);
                          try {
                            const { data, error } = await supabase.functions.invoke("manage-user", {
                              body: { action: "reset_password", user_id: resetPwUser.user_id, new_password: newPassword },
                            });
                            if (error || data?.error) throw new Error(error?.message || data?.error);
                            toast({ title: "Password reset!", description: `New password set for ${resetPwUser.email}` });
                            setResetPwUser(null);
                            setNewPassword("");
                          } catch (err: any) {
                            toast({ title: "Error", description: err.message, variant: "destructive" });
                          }
                          setUserActionLoading(false);
                        }}>
                          {userActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />} Reset Password
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setResetPwUser(null); setNewPassword(""); }}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  {/* Bulk Actions Bar */}
                  {selectedUsers.size > 0 && (
                    <div className="ks-card p-3 flex items-center gap-3 border-2 border-primary/30">
                      <span className="text-sm font-bold">{selectedUsers.size} selected</span>
                      <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={bulkAction} onChange={e => setBulkAction(e.target.value as any)}>
                        <option value="">Choose action…</option>
                        <option value="delete">Delete Selected</option>
                        <option value="role">Change Role</option>
                      </select>
                      {bulkAction === "role" && (
                        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={bulkRole} onChange={e => setBulkRole(e.target.value)}>
                          <option value="parent">Parent</option>
                          <option value="childminder">Childminder</option>
                          <option value="admin">Admin</option>
                          <option value="user">User</option>
                        </select>
                      )}
                      <Button variant={bulkAction === "delete" ? "destructive" : "warm"} size="sm" disabled={!bulkAction || bulkLoading} onClick={async () => {
                        if (!bulkAction) return;
                        if (bulkAction === "delete" && !confirm(`Delete ${selectedUsers.size} users? This cannot be undone.`)) return;
                        if (bulkAction === "role" && !confirm(`Change role to "${bulkRole}" for ${selectedUsers.size} users?`)) return;
                        setBulkLoading(true);
                        try {
                          const userIds = Array.from(selectedUsers);
                          const { data, error } = await supabase.functions.invoke("manage-user", {
                            body: bulkAction === "delete"
                              ? { action: "bulk_delete", user_ids: userIds }
                              : { action: "bulk_change_role", user_ids: userIds, role: bulkRole },
                          });
                          if (error || data?.error) throw new Error(error?.message || data?.error);
                          toast({ title: bulkAction === "delete" ? "Users deleted" : "Roles updated", description: `${selectedUsers.size} users affected` });
                          setSelectedUsers(new Set());
                          setBulkAction("");
                          fetchProfiles(profilePage);
                          fetchCounts();
                        } catch (err: any) {
                          toast({ title: "Error", description: err.message, variant: "destructive" });
                        }
                        setBulkLoading(false);
                      }}>
                        {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Apply
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedUsers(new Set()); setBulkAction(""); }}>Clear</Button>
                    </div>
                  )}

                  <div className="ks-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border bg-muted/50">
                          <th className="p-3 w-10">
                            <input type="checkbox" className="rounded"
                              checked={profiles.length > 0 && profiles.every(p => selectedUsers.has(p.user_id))}
                              onChange={e => {
                                if (e.target.checked) setSelectedUsers(new Set(profiles.map(p => p.user_id)));
                                else setSelectedUsers(new Set());
                              }} />
                          </th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Name</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Email</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Role</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Joined</th>
                          <th className="p-3 text-xs text-muted-foreground font-medium text-right">Actions</th>
                        </tr></thead>
                        <tbody>
                          {profiles.filter((p) => {
                            const q = searchQuery.toLowerCase();
                            return !q || p.first_name.toLowerCase().includes(q) || p.last_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
                          }).map((p) => (
                            <tr key={p.user_id} className={`border-b border-border last:border-0 hover:bg-muted/30 ${selectedUsers.has(p.user_id) ? "bg-primary/5" : ""}`}>
                              <td className="p-3">
                                <input type="checkbox" className="rounded"
                                  checked={selectedUsers.has(p.user_id)}
                                  onChange={e => {
                                    const next = new Set(selectedUsers);
                                    if (e.target.checked) next.add(p.user_id); else next.delete(p.user_id);
                                    setSelectedUsers(next);
                                  }} />
                              </td>
                              <td className="p-3 font-medium">{p.first_name} {p.last_name}</td>
                              <td className="p-3 text-muted-foreground text-xs">{p.email}</td>
                              <td className="p-3">{statusBadge(p.role)}</td>
                              <td className="p-3 text-muted-foreground text-xs">{format(new Date(p.created_at), "dd MMM yyyy")}</td>
                              <td className="p-3">
                                <div className="flex gap-1 justify-end">
                                  <Button variant="ghost" size="sm" title="Edit user" onClick={() => {
                                    setEditingUser(p);
                                    setEditForm({ first_name: p.first_name, last_name: p.last_name, email: p.email, phone: p.phone || "", role: p.role });
                                    setResetPwUser(null);
                                  }}><Pencil className="w-3.5 h-3.5" /></Button>
                                  <Button variant="ghost" size="sm" title="Reset password" onClick={() => {
                                    setResetPwUser(p);
                                    setNewPassword("");
                                    setEditingUser(null);
                                  }}><Key className="w-3.5 h-3.5" /></Button>
                                  <Button variant="ghost" size="sm" title="Delete user" onClick={async () => {
                                    if (p.user_id === user?.id) { toast({ title: "Cannot delete your own account", variant: "destructive" }); return; }
                                    if (!confirm(`Delete ${p.first_name} ${p.last_name} (${p.email})? This cannot be undone.`)) return;
                                    setUserActionLoading(true);
                                    try {
                                      const { data, error } = await supabase.functions.invoke("manage-user", {
                                        body: { action: "delete_user", user_id: p.user_id },
                                      });
                                      if (error || data?.error) throw new Error(error?.message || data?.error);
                                      toast({ title: "User deleted", description: p.email });
                                      fetchProfiles(profilePage);
                                      fetchCounts();
                                    } catch (err: any) {
                                      toast({ title: "Error", description: err.message, variant: "destructive" });
                                    }
                                    setUserActionLoading(false);
                                  }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <Paginator page={profilePage} setPage={setProfilePage} total={totalProfiles} />
                </div>
              )}

              {/* ═══ PARENTS ═══ */}
              {tab === "parents" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Parents ({totalParents.toLocaleString()})</h2>
                  <div className="ks-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border bg-muted/50">
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">City</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Postcode</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Property</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Funding</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Pets</th>
                        </tr></thead>
                        <tbody>
                          {parentProfiles.map((p) => (
                            <tr key={p.user_id} className="border-b border-border last:border-0 hover:bg-muted/30">
                              <td className="p-3 font-medium">{p.city || "—"}</td>
                              <td className="p-3 text-xs">{p.postcode || "—"}</td>
                              <td className="p-3 text-xs">{p.property_type || "—"}</td>
                              <td className="p-3">{p.funding_type ? statusBadge(p.funding_type) : "—"}</td>
                              <td className="p-3 text-xs">{p.has_pets ? "Yes" : "No"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <Paginator page={parentPage} setPage={setParentPage} total={totalParents} />
                </div>
              )}

              {/* ═══ CHILDREN ═══ */}
              {tab === "children" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Children ({totalChildren.toLocaleString()})</h2>
                  <div className="ks-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border bg-muted/50">
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Name</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">DOB</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Gender</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Allergies</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">SEND</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Health</th>
                        </tr></thead>
                        <tbody>
                          {children.map((c) => (
                            <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                              <td className="p-3 font-medium">{c.first_name} {c.last_name}</td>
                              <td className="p-3 text-xs">{c.date_of_birth}</td>
                              <td className="p-3 text-xs capitalize">{c.gender || "—"}</td>
                              <td className="p-3 text-xs">{c.allergies ? <span className="text-destructive">⚠ {c.allergies}</span> : "—"}</td>
                              <td className="p-3 text-xs">{c.special_needs || "—"}</td>
                              <td className="p-3 text-xs">{c.health_issues || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <Paginator page={childPage} setPage={setChildPage} total={totalChildren} />
                </div>
              )}

              {/* ═══ MINDERS ═══ */}
              {tab === "minders" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Registered Childminders ({totalMinders.toLocaleString()})</h2>
                  <div className="ks-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border bg-muted/50">
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Location</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Status</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">DBS</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Ofsted</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Exp</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Live</th>
                        </tr></thead>
                        <tbody>
                          {cmProfiles.map((cm) => (
                            <tr key={cm.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                              <td className="p-3 font-medium text-xs">{cm.town || "—"}, {cm.postcode_district || "—"}</td>
                              <td className="p-3">{statusBadge(cm.onboarding_status)}</td>
                              <td className="p-3 text-xs">{cm.dbs_number ? <CheckCircle2 className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-destructive/50" />}</td>
                              <td className="p-3 text-xs">{cm.ofsted_urn ? <CheckCircle2 className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-destructive/50" />}</td>
                              <td className="p-3 text-xs">{cm.experience_years ?? "—"}y</td>
                              <td className="p-3">{cm.is_live ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-bold">LIVE</span> : <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">OFF</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <Paginator page={minderPage} setPage={setMinderPage} total={totalMinders} />
                </div>
              )}

              {/* ═══ ONBOARDING ═══ */}
              {tab === "onboarding" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold">Onboarding Pipeline</h2>

                  {/* Summary cards */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {["pending", "submitted", "interview_scheduled", "interview_passed", "verified"].map(s => {
                      const count = cmProfiles.filter(c => c.onboarding_status === s).length;
                      return (
                        <div key={s} className="ks-card p-3 text-center">
                          <div className="text-lg font-bold">{count}</div>
                          <div className="text-[10px]">{statusBadge(s)}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pipeline info */}
                  <div className="ks-card p-3 bg-primary/5 border-primary/20 text-xs text-muted-foreground space-y-1">
                    <p><strong className="text-foreground">Onboarding flow:</strong> Pending → Documents Submitted → Interview Scheduled → Interview Passed → <span className="text-success font-bold">Verified</span></p>
                    <p>Once verified, childminders with an <strong>active subscription</strong> will appear in the roster for job assignments. Those without a subscription will show as "No Sub" in the roster.</p>
                  </div>

                  {/* Childminder pipeline */}
                  <h3 className="font-bold text-sm">Childminders & Trainees</h3>
                  <div className="space-y-2">
                    {cmProfiles.length === 0 ? (
                      <p className="text-muted-foreground text-sm py-10 text-center">No childminder profiles.</p>
                    ) : cmProfiles.map((cm) => {
                      const sub = subscriptions.find(s => s.user_id === cm.user_id);
                      const hasActiveSub = sub && (sub.status === "active" || (sub.plan === "free_trial" && new Date(sub.trial_ends_at) > new Date()));
                      return (
                        <div key={cm.id} className="ks-card p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{getProfileName(cm.user_id)}</div>
                            <div className="text-xs text-muted-foreground">{cm.town || "—"}, {cm.postcode_district || "—"}</div>
                            <div className="flex gap-2 mt-1 flex-wrap items-center">
                              {statusBadge(cm.onboarding_status)}
                              {(cm as any).prospect_stage && statusBadge((cm as any).prospect_stage)}
                              {(cm as any).regulator && <span className="text-[11px] text-muted-foreground uppercase">{(cm as any).regulator}</span>}
                              {cm.dbs_number && <span className="text-[11px] text-muted-foreground">DBS ✓</span>}
                              {cm.ofsted_urn && <span className="text-[11px] text-muted-foreground">Ofsted ✓</span>}
                              {hasActiveSub ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-bold">Subscribed</span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-bold">No Subscription</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-wrap">
                            {cm.onboarding_status === "pending" && <Button variant="warm" size="sm" onClick={() => updateOnboardingStatus(cm.user_id, "submitted")}>→ Submitted</Button>}
                            {cm.onboarding_status === "submitted" && <Button variant="warm" size="sm" onClick={() => updateOnboardingStatus(cm.user_id, "interview_scheduled")}>→ Interview</Button>}
                            {cm.onboarding_status === "interview_scheduled" && (
                              <>
                                <Button variant="success" size="sm" onClick={() => updateOnboardingStatus(cm.user_id, "interview_passed")}><CheckCircle2 className="w-3.5 h-3.5" /> Pass</Button>
                                <Button variant="destructive" size="sm" onClick={() => updateOnboardingStatus(cm.user_id, "rejected")}><XCircle className="w-3.5 h-3.5" /> Fail</Button>
                              </>
                            )}
                            {cm.onboarding_status === "interview_passed" && <Button variant="success" size="sm" onClick={() => updateOnboardingStatus(cm.user_id, "verified")}><ShieldCheck className="w-3.5 h-3.5" /> Verify & Go Live</Button>}
                            {cm.onboarding_status === "verified" && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-success font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Verified</span>
                                <Button variant={cm.is_live ? "destructive" : "success"} size="sm" onClick={() => toggleLive(cm.user_id, !!cm.is_live)}>
                                  {cm.is_live ? "Set Offline" : "Go Live"}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Parent onboarding section */}
                  <h3 className="font-bold text-sm mt-6">Parent Verification</h3>
                  {(() => {
                    const submitted = parentOnboardingData.filter(p => p.submitted && !p.verified && !p.rejected);
                    const verified = parentOnboardingData.filter(p => p.verified);
                    const rejected = parentOnboardingData.filter(p => p.rejected);
                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="ks-card p-3 text-center"><div className="text-lg font-bold">{submitted.length}</div><div className="text-[10px] text-muted-foreground">Pending Review</div></div>
                          <div className="ks-card p-3 text-center"><div className="text-lg font-bold text-success">{verified.length}</div><div className="text-[10px] text-muted-foreground">Verified</div></div>
                          <div className="ks-card p-3 text-center"><div className="text-lg font-bold text-destructive">{rejected.length}</div><div className="text-[10px] text-muted-foreground">Rejected</div></div>
                        </div>
                        {submitted.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No pending parent submissions.</p>}
                        {submitted.map(p => (
                          <div key={p.user_id} className="ks-card p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{getProfileName(p.user_id)}</div>
                              <div className="text-xs text-muted-foreground">Onboarding submitted — awaiting admin review</div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="success" size="sm" onClick={() => verifyParent(p.user_id)}><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verify</Button>
                              <Button variant="destructive" size="sm" onClick={() => rejectParent(p.user_id)}><XCircle className="w-3.5 h-3.5 mr-1" /> Reject</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  <Paginator page={minderPage} setPage={setMinderPage} total={totalMinders} />
                </div>
              )}

              {/* ═══ SUBSCRIPTIONS ═══ */}
              {tab === "subscriptions" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Subscriptions</h2>
                  <div className="ks-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border bg-muted/50">
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">User</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Plan</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Status</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Trial Ends</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Price</th>
                        </tr></thead>
                        <tbody>
                          {subscriptions.length === 0 ? (
                            <tr><td colSpan={5} className="text-center p-6 text-muted-foreground">No subscriptions.</td></tr>
                          ) : subscriptions.map((s) => (
                            <tr key={s.id} className="border-b border-border last:border-0">
                              <td className="p-3 font-medium">{getProfileName(s.user_id)}</td>
                              <td className="p-3">{statusBadge(s.plan)}</td>
                              <td className="p-3">{statusBadge(s.status)}</td>
                              <td className="p-3 text-xs">{format(new Date(s.trial_ends_at), "dd MMM yyyy")}</td>
                              <td className="p-3 text-xs">£{s.price_monthly}/mo</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ VERIFICATION ═══ */}
              {tab === "verification" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Verification & Live Status</h2>

                  <div className="ks-card p-3 bg-primary/5 border-primary/20 text-xs text-muted-foreground space-y-1">
                    <p><strong className="text-foreground">⚠️ Document gate enforced:</strong> Users cannot be verified or go live unless <strong>all uploaded documents are approved</strong> by an admin. Review documents in the <button className="text-primary underline font-medium" onClick={() => setTab("documents")}>Documents tab</button> first.</p>
                  </div>

                  {/* Childminder Verification */}
                  <h3 className="font-bold text-sm">Childminders</h3>
                  <div className="space-y-2">
                    {cmProfiles.map((cm) => {
                      const cmDocs = complianceDocs.filter(d => d.user_id === cm.user_id);
                      const docsApproved = cmDocs.filter(d => d.status === "approved").length;
                      const docsPending = cmDocs.filter(d => d.status === "pending").length;
                      const docsRejected = cmDocs.filter(d => d.status === "rejected").length;
                      const allDocsOk = cmDocs.length > 0 && docsApproved === cmDocs.length;
                      return (
                        <div key={cm.id} className="ks-card p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{getProfileName(cm.user_id)}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <MapPin className="w-3.5 h-3.5" />
                              {cm.town || "—"}, {cm.postcode_district || "—"}
                              {cm.is_live ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-bold">LIVE</span> : <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">OFFLINE</span>}
                            </div>
                            <div className="flex gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                              <span>{cm.dbs_number ? "✅ DBS" : "❌ DBS"}</span>
                              <span>{cm.ofsted_urn ? "✅ Ofsted" : "❌ Ofsted"}</span>
                              <span>{statusBadge(cm.onboarding_status)}</span>
                            </div>
                            <div className="flex gap-2 mt-1 text-[11px] flex-wrap">
                              {cmDocs.length === 0 ? (
                                <span className="text-destructive font-bold">📄 No documents</span>
                              ) : (
                                <>
                                  <span className={allDocsOk ? "text-success font-bold" : "text-muted-foreground"}>📄 {docsApproved}/{cmDocs.length} approved</span>
                                  {docsPending > 0 && <span className="text-primary font-bold">{docsPending} pending</span>}
                                  {docsRejected > 0 && <span className="text-destructive font-bold">{docsRejected} rejected</span>}
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-wrap">
                            {cm.onboarding_status !== "verified" && (
                              <Button variant="success" size="sm" onClick={() => updateOnboardingStatus(cm.user_id, "verified")}><ShieldCheck className="w-3.5 h-3.5 mr-1" /> Verify</Button>
                            )}
                            {cm.onboarding_status !== "rejected" && cm.onboarding_status !== "verified" && (
                              <Button variant="destructive" size="sm" onClick={() => updateOnboardingStatus(cm.user_id, "rejected")}><XCircle className="w-3.5 h-3.5 mr-1" /> Reject</Button>
                            )}
                            <Button variant={cm.is_live ? "destructive" : "success"} size="sm" onClick={() => toggleLive(cm.user_id, !!cm.is_live)}>
                              {cm.is_live ? "Set Offline" : "Go Live"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Paginator page={minderPage} setPage={setMinderPage} total={totalMinders} />

                  {/* Parent Verification */}
                  <h3 className="font-bold text-sm mt-4">Parents</h3>
                  {(() => {
                    const submitted = parentOnboardingData.filter(p => p.submitted && !p.verified && !p.rejected);
                    const verified = parentOnboardingData.filter(p => p.verified);
                    const rejected = parentOnboardingData.filter(p => p.rejected);
                    const notSubmitted = parentOnboardingData.filter(p => !p.submitted && !p.verified && !p.rejected);
                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="ks-card p-3 text-center"><div className="text-lg font-bold">{notSubmitted.length}</div><div className="text-[10px] text-muted-foreground">Not Submitted</div></div>
                          <div className="ks-card p-3 text-center"><div className="text-lg font-bold text-primary">{submitted.length}</div><div className="text-[10px] text-muted-foreground">Pending Review</div></div>
                          <div className="ks-card p-3 text-center"><div className="text-lg font-bold text-success">{verified.length}</div><div className="text-[10px] text-muted-foreground">Verified</div></div>
                          <div className="ks-card p-3 text-center"><div className="text-lg font-bold text-destructive">{rejected.length}</div><div className="text-[10px] text-muted-foreground">Rejected</div></div>
                        </div>
                        {submitted.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No pending parent submissions.</p>}
                        {submitted.map(p => (
                          <div key={p.user_id} className="ks-card p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{getProfileName(p.user_id)}</div>
                              <div className="text-xs text-muted-foreground">Onboarding submitted — awaiting admin review</div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="success" size="sm" onClick={() => verifyParent(p.user_id)}><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verify</Button>
                              <Button variant="destructive" size="sm" onClick={() => rejectParent(p.user_id)}><XCircle className="w-3.5 h-3.5 mr-1" /> Reject</Button>
                            </div>
                          </div>
                        ))}
                        {verified.length > 0 && (
                          <>
                            <h4 className="text-xs font-bold text-muted-foreground mt-3">Verified Parents</h4>
                            {verified.map(p => (
                              <div key={p.user_id} className="ks-card p-3 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                                <span className="text-sm font-medium flex-1">{getProfileName(p.user_id)}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-bold">Verified</span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ═══ CONTRACTS ═══ */}
              {tab === "contracts" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold flex-1">Contracts</h2>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input className="pl-9 pr-3 py-2 rounded-xl border border-border text-sm bg-card w-48" placeholder="Search…"
                        value={contractSearch} onChange={(e) => setContractSearch(e.target.value)} />
                    </div>
                  </div>
                  {(() => {
                    const expiring = contracts.filter(c => c.expires_at && c.status === "active" && Math.ceil((new Date(c.expires_at).getTime() - Date.now()) / (1000*60*60*24)) <= 30);
                    return expiring.length > 0 ? (
                      <div className="ks-card p-3 border-l-4 border-destructive flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        <span className="text-xs font-medium">{expiring.length} contract{expiring.length > 1 ? "s" : ""} expiring within 30 days</span>
                      </div>
                    ) : null;
                  })()}
                  <div className="ks-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border bg-muted/50">
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Type</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Party</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Status</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Start</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Expires</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Actions</th>
                        </tr></thead>
                        <tbody>
                          {contracts.filter(c => {
                            const q = contractSearch.toLowerCase();
                            return !q || c.parent_name?.toLowerCase().includes(q) || c.contract_type?.toLowerCase().includes(q) || c.status?.toLowerCase().includes(q);
                          }).map((c) => {
                            const isExpiringSoon = c.expires_at && c.status === "active" && Math.ceil((new Date(c.expires_at).getTime() - Date.now()) / (1000*60*60*24)) <= 30;
                            return (
                              <tr key={c.id} className={`border-b border-border last:border-0 hover:bg-muted/30 ${isExpiringSoon ? "bg-destructive/5" : ""}`}>
                                <td className="p-3 text-xs font-medium">{c.contract_type?.replace(/_/g, " ")}</td>
                                <td className="p-3 font-medium">{c.parent_name || "—"}</td>
                                <td className="p-3">{statusBadge(c.status)}</td>
                                <td className="p-3 text-xs text-muted-foreground">{c.start_date ? format(new Date(c.start_date), "dd MMM yyyy") : "—"}</td>
                                <td className="p-3 text-xs text-muted-foreground">{c.expires_at ? format(new Date(c.expires_at), "dd MMM yyyy") : "—"}{isExpiringSoon && <AlertTriangle className="w-3 h-3 text-destructive inline ml-1" />}</td>
                                <td className="p-3">
                                  <div className="flex gap-1">
                                    {c.status === "draft" && (
                                      <Button variant="ghost" size="sm" onClick={async () => { await supabase.from("contracts").update({ status: "active" }).eq("id", c.id); supabase.from("contracts").select("*").order("created_at", { ascending: false }).then(({ data }) => setContracts(data || [])); }}><CheckCircle2 className="w-4 h-4 text-success" /></Button>
                                    )}
                                    {c.status === "active" && (
                                      <Button variant="ghost" size="sm" onClick={async () => { await supabase.from("contracts").update({ status: "expired" }).eq("id", c.id); supabase.from("contracts").select("*").order("created_at", { ascending: false }).then(({ data }) => setContracts(data || [])); }}><XCircle className="w-4 h-4 text-destructive" /></Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {contracts.length === 0 && <tr><td colSpan={6} className="text-center p-6 text-muted-foreground">No contracts yet.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ ROSTER ═══ */}
              {tab === "roster" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setWeekStart(subWeeks(weekStart, 1))}><ChevronLeft className="w-4 h-4" /></Button>
                      <h2 className="font-bold text-sm whitespace-nowrap">
                        {format(weekStart, "dd MMM")} – {format(addDays(weekStart, 6), "dd MMM yyyy")}
                      </h2>
                      <Button variant="ghost" size="sm" onClick={() => setWeekStart(addWeeks(weekStart, 1))}><ChevronRight className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Today</Button>
                    </div>
                    <Button variant="ghost" size="sm" asChild><a href="/admin/roster">Full Roster Manager →</a></Button>
                  </div>
                  <div className="ks-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border bg-muted/50">
                          {days.map((d) => (
                            <th key={d.toISOString()} className={`p-2 text-center text-xs font-medium ${isSameDay(d, new Date()) ? "text-secondary font-bold" : "text-muted-foreground"}`}>
                              {format(d, "EEE d")}
                            </th>
                          ))}
                        </tr></thead>
                        <tbody><tr>
                          {days.map((day) => {
                            const dayShifts = shifts.filter((s) => isSameDay(parseISO(s.start_time), day));
                            return (
                              <td key={day.toISOString()} className="p-2 align-top border-r border-border last:border-0 min-w-[120px]">
                                {dayShifts.length === 0 ? (
                                  <span className="text-[10px] text-muted-foreground">No shifts</span>
                                ) : dayShifts.map((s) => (
                                  <div key={s.id} className={`text-[11px] p-1.5 rounded-lg border mb-1 ${
                                    s.status === "completed" ? "bg-success/10 border-success/20" :
                                    s.status === "accepted" ? "bg-success/15 border-success/30" :
                                    s.status === "offered" ? "bg-primary/15 border-primary/30" :
                                    "bg-muted border-border"
                                  }`}>
                                    <div className="font-medium truncate">{s.title}</div>
                                    <div className="text-[10px] opacity-70">{format(parseISO(s.start_time), "HH:mm")}–{format(parseISO(s.end_time), "HH:mm")}</div>
                                  </div>
                                ))}
                              </td>
                            );
                          })}
                        </tr></tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ AI SCHEDULER ═══ */}
              {tab === "ai-scheduler" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Bot className="w-5 h-5" /> AI Shift Scheduler</h2>
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={runComplianceCheck} disabled={complianceLoading}>
                        <Mail className="w-4 h-4" /> {complianceLoading ? "Checking…" : "Check Expiry Alerts"}
                      </Button>
                      <Button variant="hero" size="sm" className="gap-1.5" onClick={runAiScheduler} disabled={aiLoading}>
                        {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {aiLoading ? "Analysing…" : "Auto-Schedule"}
                      </Button>
                    </div>
                  </div>

                  {/* Gantt Controls */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-1 bg-muted rounded-xl p-0.5">
                      {(["day", "week", "month"] as GanttView[]).map(v => (
                        <button key={v} onClick={() => setGanttView(v)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${ganttView === v ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                          {v === "day" ? <><CalendarDays className="w-3.5 h-3.5 inline mr-1" />Day</> :
                           v === "week" ? <><LayoutGrid className="w-3.5 h-3.5 inline mr-1" />Week</> :
                           <><Calendar className="w-3.5 h-3.5 inline mr-1" />Month</>}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => navigateGantt(-1)}><ChevronLeft className="w-4 h-4" /></Button>
                      <h3 className="font-bold text-sm whitespace-nowrap min-w-[160px] text-center">
                        {ganttView === "day" ? format(ganttDate, "EEEE, dd MMMM yyyy") :
                         ganttView === "week" ? `${format(ganttDateRange.start, "dd MMM")} – ${format(ganttDateRange.end, "dd MMM yyyy")}` :
                         format(ganttDate, "MMMM yyyy")}
                      </h3>
                      <Button variant="ghost" size="sm" onClick={() => navigateGantt(1)}><ChevronRight className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setGanttDate(new Date())}>Today</Button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {ganttConflicts.length > 0 && (
                        <span className="px-3 py-1.5 bg-destructive/10 rounded-xl text-destructive font-bold text-xs">
                          <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />{ganttConflicts.length} conflicts
                        </span>
                      )}
                      <Button variant="ghost" size="sm" className="gap-1" onClick={() => setShowGanttFilters(!showGanttFilters)}>
                        <FilterIcon className="w-3.5 h-3.5" /> Filters
                      </Button>
                    </div>
                  </div>

                  {/* Filters */}
                  {showGanttFilters && (
                    <div className="ks-card p-4 flex flex-wrap items-end gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Childminder</label>
                        <select className="h-9 rounded-lg border border-input bg-background px-2 text-xs"
                          value={ganttFilterMinder} onChange={(e) => setGanttFilterMinder(e.target.value)}>
                          <option value="">All</option>
                          {cmProfiles.map(c => <option key={c.user_id} value={c.user_id}>{getProfileName(c.user_id)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                        <select className="h-9 rounded-lg border border-input bg-background px-2 text-xs"
                          value={ganttFilterStatus} onChange={(e) => setGanttFilterStatus(e.target.value)}>
                          <option value="">All</option>
                          {["pending", "offered", "accepted", "in_progress", "completed", "declined"].map(s =>
                            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                          )}
                        </select>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => { setGanttFilterMinder(""); setGanttFilterStatus(""); }}>Clear</Button>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="ks-card px-3 py-1.5"><strong>{ganttFilteredShifts.length}</strong> shifts</span>
                    <span className="ks-card px-3 py-1.5"><strong>{ganttFilteredShifts.filter(s => !s.childminder_id).length}</strong> unassigned</span>
                    <span className="ks-card px-3 py-1.5"><strong>{cmProfiles.length}</strong> childminders</span>
                  </div>

                  {/* Conflict alerts */}
                  {ganttConflicts.length > 0 && (
                    <div className="ks-card p-4 border-l-4 border-destructive space-y-2">
                      <h3 className="font-bold text-sm text-destructive flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> Allocation Conflicts
                      </h3>
                      {ganttConflicts.map((c, i) => (
                        <div key={i} className="text-xs bg-destructive/5 rounded-lg p-2.5 flex items-center gap-2">
                          <span className="font-medium">{c.cmName}:</span>
                          <span className="text-muted-foreground">{c.message}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ═══ GANTT GRID ═══ */}
                  <div className="overflow-x-auto">
                    <div className={`grid min-w-[900px] gap-px bg-border rounded-xl overflow-hidden border border-border ${
                      ganttView === "day" ? "grid-cols-[160px_1fr]" : "grid-cols-[160px_repeat(7,1fr)]"
                    }`}>
                      {/* Header */}
                      <div className="bg-muted p-3 font-bold text-xs text-muted-foreground">Childminder</div>
                      {ganttView === "month" ? (
                        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                          <div key={d} className="bg-muted p-2 text-center text-xs font-bold text-muted-foreground">{d}</div>
                        ))
                      ) : (
                        ganttDays.slice(0, ganttView === "day" ? 1 : 7).map(day => (
                          <div key={day.toISOString()} className={`bg-muted p-2 text-center text-xs font-bold ${isSameDay(day, new Date()) ? "text-secondary" : "text-muted-foreground"}`}>
                            <div>{format(day, "EEE")}</div>
                            <div className="text-lg">{format(day, "d")}</div>
                          </div>
                        ))
                      )}

                      {/* Unassigned row */}
                      <div className="bg-card p-2 text-xs font-medium text-muted-foreground border-t border-border">Unassigned</div>
                      {(ganttView === "month" ? [0,1,2,3,4,5,6] : ganttDays.slice(0, ganttView === "day" ? 1 : 7)).map((dayOrIdx, idx) => {
                        const dayShifts = ganttView === "month"
                          ? ganttFilteredShifts.filter(s => !s.childminder_id && parseISO(s.start_time).getDay() === (idx + 1) % 7)
                          : ganttFilteredShifts.filter(s => !s.childminder_id && isSameDay(parseISO(s.start_time), dayOrIdx as Date));
                        return (
                          <div key={idx} className="bg-card p-1.5 min-h-[50px] border-t border-border" onDragOver={e => e.preventDefault()}>
                            {dayShifts.slice(0, 3).map(s => (
                              <div key={s.id} draggable onDragStart={() => handleGanttDragStart(s.id, s.childminder_id)}
                                className={`text-[11px] p-1.5 rounded-lg border mb-1 cursor-grab active:cursor-grabbing ${
                                  s.status === "accepted" ? "bg-success/15 border-success/30" :
                                  s.status === "offered" ? "bg-primary/15 border-primary/30" :
                                  "bg-muted border-border"
                                }`}>
                                <div className="flex items-center gap-1"><GripVertical className="w-3 h-3 opacity-40 shrink-0" /><span className="font-medium truncate">{s.title}</span></div>
                                <div className="text-[10px] opacity-70">{format(parseISO(s.start_time), "HH:mm")}–{format(parseISO(s.end_time), "HH:mm")}</div>
                              </div>
                            ))}
                            {dayShifts.length > 3 && <div className="text-[9px] text-muted-foreground">+{dayShifts.length - 3} more</div>}
                          </div>
                        );
                      })}

                      {/* Childminder rows */}
                      {cmProfiles.map(cm => {
                        const cmName = getProfileName(cm.user_id);
                        const hasConflict = ganttConflicts.some(c => c.cmId === cm.user_id);
                        return (
                          <React.Fragment key={cm.user_id}>
                            <div className={`bg-card p-2 text-xs font-medium border-t border-border flex items-center gap-1 ${hasConflict ? "text-destructive" : ""}`}>
                              {hasConflict && <AlertTriangle className="w-3 h-3 shrink-0" />}
                              <span className="truncate">{cmName}</span>
                              {cm.postcode_district && <span className="text-[9px] text-muted-foreground">({cm.postcode_district})</span>}
                            </div>
                            {(ganttView === "month" ? [0,1,2,3,4,5,6] : ganttDays.slice(0, ganttView === "day" ? 1 : 7)).map((dayOrIdx, idx) => {
                              const dayShifts = ganttView === "month"
                                ? ganttFilteredShifts.filter(s => s.childminder_id === cm.user_id && parseISO(s.start_time).getDay() === (idx + 1) % 7)
                                : ganttFilteredShifts.filter(s => s.childminder_id === cm.user_id && isSameDay(parseISO(s.start_time), dayOrIdx as Date));
                              return (
                                <div key={idx} className="bg-card p-1.5 min-h-[50px] border-t border-border"
                                  onDragOver={e => e.preventDefault()} onDrop={() => handleGanttDrop(cm.user_id)}>
                                  {dayShifts.map(s => (
                                    <div key={s.id} draggable onDragStart={() => handleGanttDragStart(s.id, s.childminder_id)}
                                      className={`text-[11px] p-1.5 rounded-lg border mb-1 cursor-grab active:cursor-grabbing ${
                                        s.status === "completed" ? "bg-success/10 border-success/20 opacity-60" :
                                        s.status === "accepted" ? "bg-success/15 border-success/30" :
                                        s.status === "offered" ? "bg-primary/15 border-primary/30" :
                                        s.status === "declined" ? "bg-destructive/10 border-destructive/20 opacity-60" :
                                        "bg-muted border-border"
                                      }`}>
                                      <div className="flex items-center gap-1"><GripVertical className="w-3 h-3 opacity-40 shrink-0" /><span className="font-medium truncate">{s.title}</span></div>
                                      <div className="text-[10px] opacity-70">{format(parseISO(s.start_time), "HH:mm")}–{format(parseISO(s.end_time), "HH:mm")}</div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* Gantt Timeline (day view) */}
                  {ganttView === "day" && ganttFilteredShifts.length > 0 && (
                    <div className="ks-card p-4 space-y-2">
                      <h3 className="font-bold text-sm">Timeline</h3>
                      <div className="relative">
                        <div className="flex border-b border-border mb-2">
                          {Array.from({ length: 14 }, (_, i) => i + 6).map(h => (
                            <div key={h} className="flex-1 text-[10px] text-muted-foreground border-l border-border pl-0.5">{h}:00</div>
                          ))}
                        </div>
                        {cmProfiles.map(cm => {
                          const cmShifts = ganttFilteredShifts.filter(s => s.childminder_id === cm.user_id && isSameDay(parseISO(s.start_time), ganttDate));
                          if (cmShifts.length === 0) return null;
                          return (
                            <div key={cm.user_id} className="flex items-center gap-2 mb-1.5">
                              <div className="w-24 text-xs font-medium truncate shrink-0">{getProfileName(cm.user_id)}</div>
                              <div className="flex-1 relative h-6 bg-muted/50 rounded">
                                {cmShifts.map(s => {
                                  const start = parseISO(s.start_time);
                                  const end = parseISO(s.end_time);
                                  const startHour = start.getHours() + start.getMinutes() / 60 - 6;
                                  const duration = differenceInMinutes(end, start) / 60;
                                  const left = Math.max(0, (startHour / 14) * 100);
                                  const width = Math.min((duration / 14) * 100, 100 - left);
                                  return (
                                    <div key={s.id} className={`absolute top-0.5 bottom-0.5 rounded text-[9px] flex items-center px-1 truncate ${
                                      s.status === "accepted" ? "bg-success/30" : s.status === "offered" ? "bg-primary/30" : "bg-muted"
                                    }`}
                                      style={{ left: `${left}%`, width: `${width}%` }}
                                      title={`${s.title}: ${format(start, "HH:mm")}–${format(end, "HH:mm")}`}>
                                      {s.title}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* AI Results */}
                  {aiResult && (
                    <div className="space-y-4">
                      <div className="ks-card p-4 border-l-4 border-secondary">
                        <h3 className="font-bold text-sm mb-1">AI Summary</h3>
                        <p className="text-xs text-muted-foreground">{aiResult.summary}</p>
                      </div>
                      {aiResult.assignments?.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="font-bold text-sm">Proposed Assignments ({aiResult.assignments.length})</h3>
                          {aiResult.assignments.map((a: any, i: number) => (
                            <div key={i} className="ks-card p-3 flex items-center gap-3">
                              <div className="flex-1">
                                <div className="text-xs font-medium">Shift: {a.shift_id.slice(0, 8)}…</div>
                                <div className="text-xs text-muted-foreground">→ {getProfileName(a.childminder_id)}</div>
                                <div className="text-[11px] text-muted-foreground italic mt-0.5">{a.reason}</div>
                              </div>
                              <div className={`text-xs font-bold px-2 py-1 rounded-full ${a.confidence >= 80 ? "bg-success/15 text-success" : a.confidence >= 50 ? "bg-primary/15 text-foreground" : "bg-destructive/15 text-destructive"}`}>
                                {a.confidence}%
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {aiResult.unassignable?.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="font-bold text-sm text-destructive">Unassignable ({aiResult.unassignable.length})</h3>
                          {aiResult.unassignable.map((u: any, i: number) => (
                            <div key={i} className="ks-card p-3 border-l-4 border-destructive">
                              <div className="text-xs font-medium">Shift: {u.shift_id.slice(0, 8)}…</div>
                              <div className="text-xs text-muted-foreground">{u.reason}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button variant="hero" size="sm" className="gap-1.5" onClick={() => { applyAiAssignments(); fetchAllShifts(); }}>
                          <CheckCircle2 className="w-4 h-4" /> Apply All Assignments
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setAiResult(null)}>Dismiss</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ DOCUMENTS REVIEW ═══ */}
              {tab === "documents" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Document Review</h2>
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-1 rounded-full bg-primary/15 font-bold">{complianceDocs.filter(d => d.status === "pending").length} pending</span>
                      <span className="px-2 py-1 rounded-full bg-success/15 text-success font-bold">{complianceDocs.filter(d => d.status === "approved").length} approved</span>
                    </div>
                  </div>
                  {complianceDocs.length === 0 ? (
                    <div className="ks-card p-8 text-center text-muted-foreground text-sm">No documents submitted.</div>
                  ) : complianceDocs.map((doc) => (
                    <div key={doc.id} className={`ks-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${doc.status === "pending" ? "border-l-4 border-primary" : ""}`}>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm capitalize">{doc.document_type.replace(/_/g, " ")}</div>
                        <div className="text-xs text-muted-foreground">
                          User: {doc.user_id.slice(0, 8)}… · {format(new Date(doc.created_at), "dd MMM yyyy")}
                          {doc.expires_at && ` · Expires ${format(new Date(doc.expires_at), "dd MMM yyyy")}`}
                        </div>
                        {doc.review_notes && <div className="text-xs italic mt-1">"{doc.review_notes}"</div>}
                      </div>
                      <span className={`text-[11px] px-2 py-1 rounded-full font-bold shrink-0 ${
                        doc.status === "approved" ? "bg-success/15 text-success" :
                        doc.status === "rejected" ? "bg-destructive/15 text-destructive" :
                        "bg-primary/15 text-foreground"
                      }`}>{doc.status || "pending"}</span>
                      <div className="flex gap-1 shrink-0">
                        {doc.document_url && (
                          <Button variant="ghost" size="sm" onClick={async () => {
                            const { data } = await supabase.storage.from("compliance-docs").createSignedUrl(doc.document_url, 300);
                            if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                          }}>View</Button>
                        )}
                        {doc.status === "pending" && (
                          <>
                            <Button variant="success" size="sm" onClick={() => reviewDocument(doc.id, "approved")}>
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => {
                              const notes = prompt("Rejection reason:");
                              if (notes !== null) reviewDocument(doc.id, "rejected", notes);
                            }}>
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ═══ EXPENSES ═══ */}
              {tab === "expenses" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold">Expenses</h2>

                  <div className="ks-card p-4 space-y-3">
                    <h3 className="font-bold text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add Expense</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Category *</label>
                        <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                          value={expenseForm.category} onChange={(e) => setExpenseForm(f => ({ ...f, category: e.target.value }))}>
                          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Amount (£) *</label>
                        <Input type="number" step="0.01" min="0" placeholder="0.00" value={expenseForm.amount}
                          onChange={(e) => setExpenseForm(f => ({ ...f, amount: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                        <Input type="date" value={expenseForm.expense_date}
                          onChange={(e) => setExpenseForm(f => ({ ...f, expense_date: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Paid To</label>
                        <AutocompleteInput placeholder="Recipient name…" value={expenseForm.paid_to}
                          suggestions={paidToSuggestions} onChange={(v) => setExpenseForm(f => ({ ...f, paid_to: v }))} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                        <Input placeholder="Brief description…" value={expenseForm.description}
                          onChange={(e) => setExpenseForm(f => ({ ...f, description: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Allocated To</label>
                        <AutocompleteInput placeholder="Person or department" value={expenseForm.allocated_to}
                          suggestions={allocatedToSuggestions} onChange={(v) => setExpenseForm(f => ({ ...f, allocated_to: v }))} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                        <Input placeholder="Optional notes…" value={expenseForm.notes}
                          onChange={(e) => setExpenseForm(f => ({ ...f, notes: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Paid By</label>
                        <AutocompleteInput placeholder="Who paid…" value={expenseForm.paid_by}
                          suggestions={paidBySuggestions} onChange={(v) => setExpenseForm(f => ({ ...f, paid_by: v }))} />
                      </div>
                      <div className="flex items-end gap-4">
                        <label className="flex items-center gap-2 text-sm cursor-not-allowed h-10 opacity-50" title="Expenses must be approved by the Owner after creation">
                          <input type="checkbox" checked={false} disabled
                            className="rounded border-input" />
                          <span className="text-xs">Pending approval</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer h-10">
                          <input type="checkbox" checked={expenseForm.reimbursed} onChange={(e) => setExpenseForm(f => ({ ...f, reimbursed: e.target.checked }))}
                            className="rounded border-input" />
                          <span className="text-xs">Reimbursed</span>
                        </label>
                      </div>
                    </div>
                    <Button variant="warm" size="sm" onClick={handleAddExpense} disabled={expenseSaving} className="gap-1.5">
                      {expenseSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Add Expense
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1">
                      {(["day", "month", "year", "all", "custom"] as const).map((p) => (
                        <button key={p} onClick={() => setExpensePeriod(p)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${expensePeriod === p ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                          {p === "day" ? "Day" : p === "month" ? "Month" : p === "year" ? "Year" : p === "all" ? "All" : "Custom"}
                        </button>
                      ))}
                    </div>
                    {expensePeriod === "day" && (
                      <Input type="date" className="w-auto" value={expenseDay} onChange={(e) => setExpenseDay(e.target.value)} />
                    )}
                    {expensePeriod === "month" && (
                      <Input type="month" className="w-auto" value={expenseMonth} onChange={(e) => setExpenseMonth(e.target.value)} />
                    )}
                    {expensePeriod === "year" && (
                      <Input type="number" className="w-24" min="2020" max="2099" value={expenseYear} onChange={(e) => setExpenseYear(e.target.value)} />
                    )}
                    {expensePeriod === "custom" && (
                      <div className="flex items-center gap-2">
                        <Input type="date" className="w-auto" value={expenseFrom} onChange={(e) => setExpenseFrom(e.target.value)} />
                        <span className="text-xs text-muted-foreground">to</span>
                        <Input type="date" className="w-auto" value={expenseTo} onChange={(e) => setExpenseTo(e.target.value)} />
                      </div>
                    )}
                    <div className="ks-card px-4 py-2 text-sm font-bold">
                      Total: £{expenses.reduce((sum, e) => sum + Number(e.amount), 0).toFixed(2)}
                    </div>
                    <div className="ks-card px-4 py-2 text-sm text-success font-bold">
                      Approved: £{expenses.filter(e => e.is_paid).reduce((sum, e) => sum + Number(e.amount), 0).toFixed(2)}
                    </div>
                    <div className="ks-card px-4 py-2 text-sm text-destructive font-bold">
                      Pending: £{expenses.filter(e => !e.is_paid).reduce((sum, e) => sum + Number(e.amount), 0).toFixed(2)}
                    </div>
                    <div className="ks-card px-4 py-2 text-sm text-primary font-bold">
                      Reimbursed: £{expenses.filter(e => e.reimbursed).reduce((sum, e) => sum + Number(e.amount), 0).toFixed(2)}
                    </div>
                    <div className="ks-card px-4 py-2 text-sm text-warning font-bold">
                      Unreimbursed: £{expenses.filter(e => !e.reimbursed).reduce((sum, e) => sum + Number(e.amount), 0).toFixed(2)}
                    </div>
                    <div className="ks-card px-4 py-2 text-sm text-muted-foreground">
                      {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {expenses.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(
                        expenses.reduce((acc, e) => {
                          acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
                          return acc;
                        }, {} as Record<string, number>)
                      ).sort((a, b) => b[1] - a[1]).map(([cat, total]) => (
                        <div key={cat} className="ks-card p-3 text-center">
                          <div className="text-xs text-muted-foreground">{cat}</div>
                          <div className="text-sm font-bold">£{total.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Search expenses…" value={expenseSearch} onChange={(e) => setExpenseSearch(e.target.value)}
                        className="pl-8 h-8 w-48 text-xs" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">Reimbursed:</span>
                    {(["all", "yes", "no"] as const).map((v) => (
                      <button key={v} onClick={() => setReimbursedFilter(v)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${reimbursedFilter === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                        {v === "all" ? "All" : v === "yes" ? "Reimbursed" : "Unreimbursed"}
                      </button>
                    ))}
                    <Button variant="outline" size="sm" className="ml-auto gap-1.5" disabled={filteredExpenses.length === 0}
                      onClick={() => {
                        const headers = ["Date","Category","Description","Paid To","Paid By","Allocated To","Status","Reimbursed","Amount"];
                        const rows = filteredExpenses.map(e => [
                          e.expense_date, e.category, e.description || "", e.paid_to || "", e.paid_by || "",
                          e.allocated_to || "", e.is_paid ? "Paid" : "Unpaid", e.reimbursed ? "Yes" : "No",
                          Number(e.amount).toFixed(2)
                        ]);
                        const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a"); a.href = url; a.download = `expenses-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
                        URL.revokeObjectURL(url);
                        toast({ title: `Exported ${filteredExpenses.length} expenses to CSV` });
                      }}>
                      <Download className="w-4 h-4" /> Export CSV
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" disabled={filteredExpenses.length === 0}
                      onClick={() => {
                        const printWin = window.open("", "_blank");
                        if (!printWin) return;
                        const total = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
                        const rows = filteredExpenses.map(e =>
                          `<tr><td>${e.expense_date}</td><td>${e.category}</td><td>${e.description || "—"}</td><td>${e.paid_to || "—"}</td><td>${e.paid_by || "—"}</td><td>${e.allocated_to || "—"}</td><td>${e.is_paid ? "Paid" : "Unpaid"}</td><td>${e.reimbursed ? "Yes" : "No"}</td><td style="text-align:right">£${Number(e.amount).toFixed(2)}</td></tr>`
                        ).join("");
                        printWin.document.write(`<!DOCTYPE html><html><head><title>KinderStars Expenses</title><style>body{font-family:Arial,sans-serif;padding:20px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ddd;padding:6px 8px;font-size:12px;text-align:left}th{background:#f5f5f5;font-weight:600}h1{font-size:18px;margin:0}h2{font-size:14px;color:#666;margin:4px 0 0}.total{font-weight:bold;font-size:14px;margin-top:12px}@media print{body{padding:0}}</style></head><body><h1>KinderStars Ltd — Expenses Report</h1><h2>${filteredExpenses.length} expense${filteredExpenses.length !== 1 ? "s" : ""}</h2><table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Paid To</th><th>Paid By</th><th>Allocated To</th><th>Status</th><th>Reimbursed</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody></table><p class="total">Total: £${total.toFixed(2)}</p></body></html>`);
                        printWin.document.close();
                        printWin.print();
                      }}>
                      <Printer className="w-4 h-4" /> Print / PDF
                    </Button>
                  </div>

                  <div className="ks-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border bg-muted/50">
                          {([
                            { key: "expense_date", label: "Date", align: "left" },
                            { key: "category", label: "Category", align: "left" },
                            { key: null, label: "Description", align: "left" },
                            { key: "paid_to", label: "Paid To", align: "left" },
                            { key: "paid_by", label: "Paid By", align: "left" },
                            { key: "allocated_to", label: "Allocated To", align: "left" },
                            { key: null, label: "Status", align: "left" },
                            { key: null, label: "Reimbursed", align: "left" },
                            { key: "amount", label: "Amount", align: "right" },
                          ] as { key: string | null; label: string; align: string }[]).map((col) => (
                            <th key={col.label} className={`${col.align === "right" ? "text-right" : "text-left"} p-3 text-xs text-muted-foreground font-medium ${col.key ? "cursor-pointer select-none hover:text-foreground" : ""}`}
                              onClick={() => {
                                if (!col.key) return;
                                if (expenseSortCol === col.key) setExpenseSortAsc(!expenseSortAsc);
                                else { setExpenseSortCol(col.key as any); setExpenseSortAsc(true); }
                              }}>
                              <span className="inline-flex items-center gap-1">
                                {col.label}
                                {col.key && expenseSortCol === col.key && <ArrowUpDown className="w-3 h-3" />}
                              </span>
                            </th>
                          ))}
                          <th className="p-3 text-xs text-muted-foreground font-medium w-20"></th>
                        </tr></thead>
                        <tbody>
                          {filteredExpenses.length === 0 ? (
                            <tr><td colSpan={10} className="text-center p-6 text-muted-foreground">No expenses match the filter.</td></tr>
                          ) : filteredExpenses.map((e) => (
                            <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                              <td className="p-3 text-xs">{format(new Date(e.expense_date), "dd MMM yyyy")}</td>
                              <td className="p-3">{statusBadge(e.category.toLowerCase().replace(/\s/g, "_"))}</td>
                              <td className="p-3 text-xs">{e.description || "—"}</td>
                              <td className="p-3 text-xs font-medium">{e.paid_to || "—"}</td>
                              <td className="p-3 text-xs">{e.paid_by || "—"}</td>
                              <td className="p-3 text-xs">{e.allocated_to || "—"}</td>
                              <td className="p-3">
                                <button onClick={() => toggleExpensePaid(e.id, e.is_paid)}
                                  className={`text-[11px] px-2 py-1 rounded-full font-bold ${isOwner ? "cursor-pointer" : "cursor-not-allowed opacity-70"} ${e.is_paid ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}
                                  title={isOwner ? (e.is_paid ? "Click to unapprove" : "Click to approve") : "Only the Owner can approve expenses"}>
                                  {e.is_paid ? "Approved" : "Pending"}
                                </button>
                              </td>
                              <td className="p-3">
                                <span className={`text-[11px] px-2 py-1 rounded-full font-bold ${e.reimbursed ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                                  {e.reimbursed ? "Yes" : "No"}
                                </span>
                              </td>
                              <td className="p-3 text-right font-bold">£{Number(e.amount).toFixed(2)}</td>
                              <td className="p-3">
                                <Button variant="ghost" size="sm" onClick={() => deleteExpense(e.id)}>
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ FINANCE PULSE ═══ */}
              {tab === "finance" && (() => {
                const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.total), 0);
                const totalOutstanding = invoices.filter(i => i.status !== "paid" && i.status !== "cancelled").reduce((s, i) => s + Number(i.total), 0);
                const totalExpensesAmt = expenses.reduce((s, e) => s + Number(e.amount), 0);
                const netProfit = totalRevenue - totalExpensesAmt;
                const contractsByType = contracts.reduce((acc, c) => { acc[c.contract_type] = (acc[c.contract_type] || 0) + 1; return acc; }, {} as Record<string, number>);
                const activeContracts = contracts.filter(c => c.status === "active").length;
                const months: string[] = [];
                for (let i = 5; i >= 0; i--) { const d = new Date(); d.setMonth(d.getMonth() - i); months.push(format(d, "yyyy-MM")); }
                const monthlyData = months.map(m => {
                  const rev = invoices.filter(i => i.status === "paid" && i.paid_date?.startsWith(m)).reduce((s, i) => s + Number(i.total), 0);
                  const exp = expenses.filter(e => e.expense_date?.startsWith(m)).reduce((s, e) => s + Number(e.amount), 0);
                  return { month: format(new Date(m + "-01"), "MMM yy"), revenue: rev, expenses: exp, net: rev - exp };
                });

                return (
                  <div className="space-y-5">
                    <h2 className="text-xl font-bold flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Finance Pulse</h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="ks-card p-4 text-center"><div className="text-2xl font-bold text-success">£{totalRevenue.toFixed(2)}</div><div className="text-xs text-muted-foreground">Revenue (Paid)</div></div>
                      <div className="ks-card p-4 text-center"><div className="text-2xl font-bold text-primary">£{totalOutstanding.toFixed(2)}</div><div className="text-xs text-muted-foreground">Outstanding</div></div>
                      <div className="ks-card p-4 text-center"><div className="text-2xl font-bold text-destructive">£{totalExpensesAmt.toFixed(2)}</div><div className="text-xs text-muted-foreground">Expenses</div></div>
                      <div className="ks-card p-4 text-center"><div className={`text-2xl font-bold ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>£{netProfit.toFixed(2)}</div><div className="text-xs text-muted-foreground">Net Profit</div></div>
                      <div className="ks-card p-4 text-center"><div className="text-2xl font-bold">{activeContracts}</div><div className="text-xs text-muted-foreground">Active Contracts</div></div>
                    </div>
                    <div className="ks-card p-4">
                      <h3 className="font-bold text-sm mb-3">Monthly Trend (Last 6 Months)</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="border-b border-border">
                            <th className="text-left p-2 text-xs text-muted-foreground">Month</th>
                            <th className="text-right p-2 text-xs text-success">Revenue</th>
                            <th className="text-right p-2 text-xs text-destructive">Expenses</th>
                            <th className="text-right p-2 text-xs font-bold">Net</th>
                            <th className="p-2 text-xs text-muted-foreground">Bar</th>
                          </tr></thead>
                          <tbody>
                            {monthlyData.map((m) => {
                              const maxVal = Math.max(...monthlyData.map(d => Math.max(d.revenue, d.expenses)), 1);
                              return (
                                <tr key={m.month} className="border-b border-border last:border-0">
                                  <td className="p-2 font-medium text-xs">{m.month}</td>
                                  <td className="p-2 text-right text-xs text-success">£{m.revenue.toFixed(2)}</td>
                                  <td className="p-2 text-right text-xs text-destructive">£{m.expenses.toFixed(2)}</td>
                                  <td className={`p-2 text-right text-xs font-bold ${m.net >= 0 ? "text-success" : "text-destructive"}`}>£{m.net.toFixed(2)}</td>
                                  <td className="p-2 w-40">
                                    <div className="flex gap-0.5 h-4">
                                      <div className="bg-success/30 rounded-sm" style={{ width: `${(m.revenue / maxVal) * 100}%` }} />
                                      <div className="bg-destructive/30 rounded-sm" style={{ width: `${(m.expenses / maxVal) * 100}%` }} />
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="ks-card p-4">
                        <h3 className="font-bold text-sm mb-2">Contracts by Type</h3>
                        {Object.entries(contractsByType).length === 0 ? <p className="text-sm text-muted-foreground">No contracts yet.</p> :
                          Object.entries(contractsByType).map(([type, count]) => (
                            <div key={type} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0">
                              <span className="capitalize">{type.replace(/_/g, " ")}</span><span className="font-bold">{count as number}</span>
                            </div>
                          ))}
                      </div>
                      <div className="ks-card p-4">
                        <h3 className="font-bold text-sm mb-2">Invoice Status</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {["draft", "sent", "paid", "overdue"].map((status) => {
                            const count = invoices.filter(i => i.status === status).length;
                            const total = invoices.filter(i => i.status === status).reduce((s, i) => s + Number(i.total), 0);
                            return (<div key={status} className="text-center"><div className="text-lg font-bold">{count}</div><div className="text-xs text-muted-foreground capitalize">{status}</div><div className="text-xs font-medium">£{total.toFixed(2)}</div></div>);
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ═══ OFSTED TOOLS ═══ */}
              {tab === "ofsted" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2"><ClipboardCheck className="w-5 h-5" /> Ofsted Compliance Tools</h2>
                    <Button variant="hero" size="sm" className="gap-1.5" onClick={runMockAudit}>
                      <Sparkles className="w-4 h-4" /> Run Mock Audit
                    </Button>
                  </div>

                  {/* Ofsted Score Card */}
                  <div className="ks-card p-6">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className={`text-5xl font-bold ${ofstedScore.overall >= 90 ? "text-success" : ofstedScore.overall >= 70 ? "text-success" : ofstedScore.overall >= 50 ? "text-primary" : "text-destructive"}`}>
                          {ofstedScore.overall.toFixed(0)}%
                        </div>
                        <div className={`text-lg font-bold mt-1 ${ofstedScore.grade === "Outstanding" ? "text-success" : ofstedScore.grade === "Good" ? "text-success" : ofstedScore.grade === "Requires Improvement" ? "text-primary" : "text-destructive"}`}>
                          {ofstedScore.grade}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-muted rounded-full h-4">
                          <div className={`h-4 rounded-full transition-all ${ofstedScore.overall >= 70 ? "bg-success" : ofstedScore.overall >= 50 ? "bg-primary" : "bg-destructive"}`}
                            style={{ width: `${ofstedScore.overall}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                          <span>Inadequate</span><span>Requires Improvement</span><span>Good</span><span>Outstanding</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Area scores */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ofstedScore.areaScores.map((area: any) => (
                      <div key={area.area} className="ks-card p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-bold text-xs">{area.area}</h3>
                          <span className={`text-xs font-bold ${area.score >= 70 ? "text-success" : area.score >= 50 ? "text-primary" : "text-destructive"}`}>
                            {area.checked}/{area.total}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mb-2">
                          <div className={`h-2 rounded-full ${area.score >= 70 ? "bg-success" : area.score >= 50 ? "bg-primary" : "bg-destructive"}`}
                            style={{ width: `${area.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Audit Prep Checklist */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-sm">Audit Preparation Checklist</h3>
                    {OFSTED_AREAS.map(area => (
                      <div key={area.area} className="ks-card p-4">
                        <h4 className="font-bold text-xs mb-3 text-muted-foreground uppercase tracking-wider">{area.area}</h4>
                        <div className="space-y-2">
                          {area.items.map(item => (
                            <label key={item.key} className="flex items-center gap-3 cursor-pointer hover:bg-muted/30 rounded-lg p-1.5 -m-1.5 transition-colors">
                              <input type="checkbox" checked={!!ofstedChecks[item.key]}
                                onChange={() => setOfstedChecks(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                                className="rounded border-input w-4 h-4" />
                              <span className={`text-sm ${ofstedChecks[item.key] ? "line-through text-muted-foreground" : ""}`}>{item.label}</span>
                              {ofstedChecks[item.key] && <CheckCircle2 className="w-3.5 h-3.5 text-success ml-auto" />}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mock Audit Results */}
                  {mockAuditScore && (
                    <div className="ks-card p-6 border-l-4 border-secondary space-y-4">
                      <h3 className="font-bold text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" /> Mock Audit Results</h3>
                      <div className="flex items-center gap-4">
                        <div className={`text-3xl font-bold ${mockAuditScore.grade === "Outstanding" || mockAuditScore.grade === "Good" ? "text-success" : "text-destructive"}`}>
                          {mockAuditScore.grade}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Score: {mockAuditScore.pct.toFixed(0)}% · {format(new Date(mockAuditScore.timestamp), "dd MMM yyyy HH:mm")}
                        </div>
                      </div>
                      {mockAuditScore.gaps.length > 0 && (
                        <div>
                          <h4 className="font-bold text-xs mb-2 text-destructive">Gaps Found ({mockAuditScore.gaps.length})</h4>
                          <div className="space-y-1">
                            {mockAuditScore.gaps.map((g: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 text-xs bg-destructive/5 rounded-lg p-2">
                                <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                                <span className="font-medium">{g.area}:</span>
                                <span className="text-muted-foreground">{g.item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ SAFEGUARDING ═══ */}
              {tab === "safeguarding" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Safeguarding</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { title: "Safeguarding Policy", desc: "Ensure up-to-date safeguarding policy is documented and shared with all staff.", status: complianceDocs.some(d => d.document_type === "safeguarding_policy" && d.status === "approved") },
                      { title: "DBS Checks", desc: "All childminders must have valid DBS certificates before working with children.", status: cmProfiles.filter(c => c.dbs_number).length > 0 },
                      { title: "First Aid Training", desc: "Current paediatric first aid certification required for all active childminders.", status: cmProfiles.filter(c => c.first_aid_expiry && new Date(c.first_aid_expiry) > new Date()).length > 0 },
                      { title: "Risk Assessments", desc: "Risk assessments must be completed for all childminder settings and activities.", status: false },
                      { title: "Prevent Duty", desc: "Staff training on Prevent duty and British values awareness.", status: false },
                      { title: "Safer Recruitment", desc: "All recruitment follows safer recruitment practices with references checked.", status: false },
                    ].map((item, i) => (
                      <div key={i} className="ks-card p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.status ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                            {item.status ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm">{item.title}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="ks-card p-4">
                    <h3 className="font-bold text-sm mb-2">Safeguarding Contacts</h3>
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <p><strong>Designated Safeguarding Lead:</strong> Admin User — info@kinderstars.co.uk</p>
                      <p><strong>Local Authority Designated Officer (LADO):</strong> Contact your local LADO</p>
                      <p><strong>Ofsted:</strong> 0300 123 1231</p>
                      <p><strong>NSPCC Helpline:</strong> 0808 800 5000</p>
                      <p><strong>Childline:</strong> 0800 1111</p>
                    </div>
                  </div>
                  <div className="ks-card p-4 space-y-2">
                    <h3 className="font-bold text-sm">DBS & Compliance Summary</h3>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div><div className="text-2xl font-bold text-success">{cmProfiles.filter(c => c.dbs_number).length}</div><div className="text-xs text-muted-foreground">DBS Verified</div></div>
                      <div><div className="text-2xl font-bold text-destructive">{cmProfiles.filter(c => !c.dbs_number).length}</div><div className="text-xs text-muted-foreground">Missing DBS</div></div>
                      <div><div className="text-2xl font-bold">{cmProfiles.filter(c => c.first_aid_expiry && new Date(c.first_aid_expiry) > new Date()).length}</div><div className="text-xs text-muted-foreground">Valid First Aid</div></div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ INCIDENTS ═══ */}
              {tab === "incidents" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Incident Log</h2>
                  <div className="ks-card p-4 space-y-3">
                    <h3 className="font-bold text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Record Incident</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                        <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={incidentForm.incident_type}
                          onChange={e => setIncidentForm(f => ({ ...f, incident_type: e.target.value }))}>
                          {["general", "safeguarding_concern", "accident", "injury", "near_miss", "behaviour", "complaint", "medication_error", "missing_child", "allegation"].map(t => (
                            <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Persons Involved</label>
                        <Input placeholder="Names of persons involved" value={incidentForm.persons_involved}
                          onChange={e => setIncidentForm(f => ({ ...f, persons_involved: e.target.value }))} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                        <textarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Describe the incident…"
                          value={incidentForm.description} onChange={e => setIncidentForm(f => ({ ...f, description: e.target.value }))} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs text-muted-foreground mb-1 block">Actions Taken</label>
                        <Input placeholder="What actions were taken?" value={incidentForm.actions_taken}
                          onChange={e => setIncidentForm(f => ({ ...f, actions_taken: e.target.value }))} />
                      </div>
                    </div>
                    <Button variant="warm" size="sm" className="gap-1.5" onClick={async () => {
                      if (!incidentForm.description) { toast({ title: "Description required", variant: "destructive" }); return; }
                      const { error } = await supabase.from("incidents").insert({
                        reporter_id: user!.id, incident_type: incidentForm.incident_type,
                        description: incidentForm.description, persons_involved: incidentForm.persons_involved || null,
                        actions_taken: incidentForm.actions_taken || null,
                      });
                      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
                      else {
                        toast({ title: "Incident recorded" });
                        setIncidentForm({ incident_type: "general", description: "", persons_involved: "", actions_taken: "" });
                        supabase.from("incidents").select("*").order("incident_date", { ascending: false }).then(({ data }) => setIncidents(data || []));
                      }
                    }}><Plus className="w-4 h-4" /> Record Incident</Button>
                  </div>
                  <div className="ks-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border bg-muted/50">
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Date</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Type</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Description</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Persons</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Status</th>
                          <th className="p-3 text-xs text-muted-foreground font-medium">Actions</th>
                        </tr></thead>
                        <tbody>
                          {incidents.length === 0 ? (
                            <tr><td colSpan={6} className="text-center p-6 text-muted-foreground">No incidents recorded.</td></tr>
                          ) : incidents.map((inc: any) => (
                            <tr key={inc.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                              <td className="p-3 text-xs">{format(new Date(inc.incident_date), "dd MMM yyyy HH:mm")}</td>
                              <td className="p-3">{statusBadge(inc.incident_type)}</td>
                              <td className="p-3 text-xs max-w-[200px] truncate">{inc.description || "—"}</td>
                              <td className="p-3 text-xs">{inc.persons_involved || "—"}</td>
                              <td className="p-3">{statusBadge(inc.status)}</td>
                              <td className="p-3">
                                <div className="flex gap-1">
                                  {inc.status === "open" && (
                                    <Button variant="ghost" size="sm" onClick={async () => {
                                      const outcome = prompt("Outcome / resolution:");
                                      if (outcome === null) return;
                                      await supabase.from("incidents").update({ status: "resolved", outcome }).eq("id", inc.id);
                                      toast({ title: "Incident resolved" });
                                      supabase.from("incidents").select("*").order("incident_date", { ascending: false }).then(({ data }) => setIncidents(data || []));
                                    }}><CheckCircle2 className="w-4 h-4 text-success" /></Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ GDPR ═══ */}
              {tab === "gdpr" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold flex items-center gap-2"><FileText className="w-5 h-5" /> GDPR Compliance</h2>
                  <div className="ks-card p-4 space-y-3">
                    <h3 className="font-bold text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Log Data Subject Request</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Request Type</label>
                        <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={gdprForm.request_type}
                          onChange={e => setGdprForm(f => ({ ...f, request_type: e.target.value }))}>
                          {["access", "rectification", "erasure", "portability", "restriction", "objection"].map(t => (
                            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">User ID (optional)</label>
                        <Input placeholder="User UUID" value={gdprForm.user_id} onChange={e => setGdprForm(f => ({ ...f, user_id: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                        <Input placeholder="Details…" value={gdprForm.notes} onChange={e => setGdprForm(f => ({ ...f, notes: e.target.value }))} />
                      </div>
                    </div>
                    <Button variant="warm" size="sm" className="gap-1.5" onClick={async () => {
                      const { error } = await supabase.from("gdpr_requests").insert({
                        user_id: gdprForm.user_id || null, request_type: gdprForm.request_type, notes: gdprForm.notes || null,
                      });
                      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
                      else {
                        toast({ title: "GDPR request logged" });
                        setGdprForm({ user_id: "", request_type: "access", notes: "" });
                        supabase.from("gdpr_requests").select("*").order("created_at", { ascending: false }).then(({ data }) => setGdprRequests(data || []));
                      }
                    }}><Plus className="w-4 h-4" /> Log Request</Button>
                  </div>
                  <div className="ks-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border bg-muted/50">
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Date</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Type</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">User</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Status</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Notes</th>
                          <th className="p-3 text-xs text-muted-foreground font-medium">Actions</th>
                        </tr></thead>
                        <tbody>
                          {gdprRequests.length === 0 ? (
                            <tr><td colSpan={6} className="text-center p-6 text-muted-foreground">No GDPR requests.</td></tr>
                          ) : gdprRequests.map((req: any) => (
                            <tr key={req.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                              <td className="p-3 text-xs">{format(new Date(req.created_at), "dd MMM yyyy")}</td>
                              <td className="p-3">{statusBadge(req.request_type)}</td>
                              <td className="p-3 text-xs font-mono">{req.user_id ? req.user_id.slice(0, 8) + "…" : "—"}</td>
                              <td className="p-3">{statusBadge(req.status)}</td>
                              <td className="p-3 text-xs max-w-[200px] truncate">{req.notes || "—"}</td>
                              <td className="p-3">
                                {req.status === "pending" && (
                                  <Button variant="ghost" size="sm" onClick={async () => {
                                    await supabase.from("gdpr_requests").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", req.id);
                                    toast({ title: "Request completed" });
                                    supabase.from("gdpr_requests").select("*").order("created_at", { ascending: false }).then(({ data }) => setGdprRequests(data || []));
                                  }}><CheckCircle2 className="w-4 h-4 text-success" /></Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="ks-card p-4 space-y-2">
                    <h3 className="font-bold text-sm">GDPR Quick Reference</h3>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• <strong>Subject Access Requests (SAR):</strong> Must be responded to within 30 days.</p>
                      <p>• <strong>Right to Erasure:</strong> Personal data must be deleted unless a legal basis exists for retention.</p>
                      <p>• <strong>Data Retention:</strong> Financial records: 7 years. Childminder records: 3 years post-engagement. Child records: Until child turns 25.</p>
                      <p>• <strong>Breach Notification:</strong> ICO must be notified within 72 hours of a qualifying breach.</p>
                      <p>• <strong>Data Protection Officer:</strong> info@kinderstars.co.uk</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ MFA MANAGEMENT ═══ */}
              {tab === "mfa" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> MFA Management</h2>
                  <div className="ks-card p-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Multi-Factor Authentication is managed centrally by KinderStars admin. MFA uses TOTP (authenticator apps like Google Authenticator or Authy).
                      All users are required to set up MFA on their first login via their Security settings.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="ks-card p-4 text-center">
                        <div className="text-2xl font-bold text-success">{profiles.filter(p => p.role === "admin").length}</div>
                        <div className="text-xs text-muted-foreground">Admin Accounts</div>
                      </div>
                      <div className="ks-card p-4 text-center">
                        <div className="text-2xl font-bold">{profiles.filter(p => p.role === "childminder").length}</div>
                        <div className="text-xs text-muted-foreground">Childminder Accounts</div>
                      </div>
                      <div className="ks-card p-4 text-center">
                        <div className="text-2xl font-bold">{profiles.filter(p => p.role === "parent").length}</div>
                        <div className="text-xs text-muted-foreground">Parent Accounts</div>
                      </div>
                    </div>
                  </div>
                  <div className="ks-card p-4 space-y-2">
                    <h3 className="font-bold text-sm">MFA Policy</h3>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• MFA is enforced for all admin accounts at login.</p>
                      <p>• Childminders and parents are prompted to set up MFA during onboarding.</p>
                      <p>• If a user loses their authenticator device, admin can reset MFA via the user management system.</p>
                      <p>• All MFA enrolments use TOTP (Time-based One-Time Password) standard.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ CREATE USER ═══ */}
              {tab === "create-user" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold flex items-center gap-2"><Plus className="w-5 h-5" /> Create User</h2>
                  <div className="ks-card p-5 space-y-4 max-w-lg">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="ks-field"><label>First Name *</label><input value={createUserForm.first_name}
                        onChange={e => setCreateUserForm(f => ({ ...f, first_name: e.target.value }))} placeholder="First name" /></div>
                      <div className="ks-field"><label>Last Name *</label><input value={createUserForm.last_name}
                        onChange={e => setCreateUserForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Last name" /></div>
                    </div>
                    <div className="ks-field"><label>Email *</label><input type="email" value={createUserForm.email}
                      onChange={e => setCreateUserForm(f => ({ ...f, email: e.target.value }))} placeholder="user@example.com" /></div>
                    <div className="ks-field"><label>Password *</label><input type="password" value={createUserForm.password}
                      onChange={e => setCreateUserForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" /></div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Role *</label>
                      <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={createUserForm.role}
                        onChange={e => setCreateUserForm(f => ({ ...f, role: e.target.value }))}>
                        <option value="parent">Parent</option>
                        <option value="childminder">Childminder</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <Button variant="hero" className="gap-1.5" onClick={async () => {
                      if (!createUserForm.email || !createUserForm.password || !createUserForm.first_name) {
                        toast({ title: "Please fill all required fields", variant: "destructive" }); return;
                      }
                      try {
                        const { data, error } = await supabase.functions.invoke("create-user", {
                          body: {
                            email: createUserForm.email.trim(), password: createUserForm.password,
                            first_name: createUserForm.first_name.trim(), last_name: createUserForm.last_name.trim(),
                            role: createUserForm.role,
                          },
                        });
                        if (error) throw error;
                        if (data?.error) throw new Error(data.error);
                        toast({ title: "User created!", description: `${createUserForm.email} (${createUserForm.role})` });
                        setCreateUserForm({ email: "", password: "", first_name: "", last_name: "", role: "parent" });
                        fetchCounts();
                        fetchProfiles(0);
                      } catch (err: any) {
                        toast({ title: "Error", description: err.message, variant: "destructive" });
                      }
                    }}><Plus className="w-4 h-4" /> Create User</Button>
                  </div>
                </div>
              )}

              {/* ═══ MEETINGS ═══ */}
              {tab === "meetings" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold flex items-center gap-2"><CalendarDays className="w-5 h-5" /> Meeting Scheduler</h2>
                  <div className="ks-card p-4 space-y-3">
                    <h3 className="font-bold text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Schedule New Meeting</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="ks-field sm:col-span-2">
                        <label>Title *</label>
                        <input value={meetingForm.title} onChange={e => setMeetingForm(f => ({ ...f, title: e.target.value }))} placeholder="Meeting title" />
                      </div>
                      <div className="ks-field sm:col-span-2">
                        <label>Description</label>
                        <textarea value={meetingForm.description} onChange={e => setMeetingForm(f => ({ ...f, description: e.target.value }))} placeholder="Agenda / details…" className="min-h-[60px]" />
                      </div>
                      <div className="ks-field">
                        <label>Date *</label>
                        <input type="date" value={meetingForm.meeting_date} onChange={e => setMeetingForm(f => ({ ...f, meeting_date: e.target.value }))} />
                      </div>
                      <div className="ks-field">
                        <label>Location</label>
                        <input value={meetingForm.location} onChange={e => setMeetingForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Office, Zoom link…" />
                      </div>
                      <div className="ks-field">
                        <label>Start Time *</label>
                        <input type="time" value={meetingForm.start_time} onChange={e => setMeetingForm(f => ({ ...f, start_time: e.target.value }))} />
                      </div>
                      <div className="ks-field">
                        <label>End Time *</label>
                        <input type="time" value={meetingForm.end_time} onChange={e => setMeetingForm(f => ({ ...f, end_time: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Responsible Person *</label>
                        <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={meetingForm.organizer_id}
                          onChange={e => setMeetingForm(f => ({ ...f, organizer_id: e.target.value }))}>
                          <option value="">Select organizer…</option>
                          {profiles.map(p => (
                            <option key={p.user_id} value={p.user_id}>{p.first_name} {p.last_name} ({p.role})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Attendees *</label>
                        <select multiple className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={meetingForm.attendee_ids}
                          onChange={e => {
                            const selected = Array.from(e.target.selectedOptions, o => o.value);
                            setMeetingForm(f => ({ ...f, attendee_ids: selected }));
                          }}>
                          {profiles.map(p => (
                            <option key={p.user_id} value={p.user_id}>{p.first_name} {p.last_name} ({p.role})</option>
                          ))}
                        </select>
                        <p className="text-[11px] text-muted-foreground mt-1">Hold Ctrl/Cmd to select multiple</p>
                      </div>
                    </div>
                    <Button variant="hero" size="sm" className="gap-1.5" disabled={meetingSaving} onClick={async () => {
                      if (!meetingForm.title || !meetingForm.meeting_date || !meetingForm.start_time || !meetingForm.end_time || !meetingForm.organizer_id || meetingForm.attendee_ids.length === 0) {
                        toast({ title: "Please fill all required fields", variant: "destructive" }); return;
                      }
                      setMeetingSaving(true);
                      try {
                        const { error } = await supabase.from("meetings").insert({
                          title: meetingForm.title,
                          description: meetingForm.description || null,
                          meeting_date: meetingForm.meeting_date,
                          start_time: meetingForm.start_time,
                          end_time: meetingForm.end_time,
                          location: meetingForm.location || null,
                          organizer_id: meetingForm.organizer_id,
                          attendee_ids: meetingForm.attendee_ids,
                        });
                        if (error) throw error;

                        // Send notifications to all attendees
                        const allRecipients = [...new Set([meetingForm.organizer_id, ...meetingForm.attendee_ids])];
                        const organizerName = getProfileName(meetingForm.organizer_id);
                        for (const attendeeId of allRecipients) {
                          await supabase.from("notifications").insert({
                            user_id: attendeeId,
                            title: `📅 Meeting: ${meetingForm.title}`,
                            body: `Scheduled by ${organizerName} on ${format(new Date(meetingForm.meeting_date), "dd MMM yyyy")} at ${meetingForm.start_time}–${meetingForm.end_time}${meetingForm.location ? ` | Location: ${meetingForm.location}` : ""}`,
                            type: "meeting",
                            link: "/childminder/notifications",
                          });
                        }

                        toast({ title: "Meeting scheduled!", description: `Notifications sent to ${allRecipients.length} people.` });
                        setMeetingForm({ title: "", description: "", meeting_date: format(new Date(), "yyyy-MM-dd"), start_time: "09:00", end_time: "10:00", location: "", organizer_id: "", attendee_ids: [] });
                        fetchMeetings();
                      } catch (err: any) {
                        toast({ title: "Error", description: err.message, variant: "destructive" });
                      }
                      setMeetingSaving(false);
                    }}><CalendarDays className="w-4 h-4" /> Schedule Meeting</Button>
                  </div>

                  {/* Meetings List */}
                  <div className="ks-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border bg-muted/50">
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Date</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Time</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Title</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Location</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Organizer</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Attendees</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Status</th>
                          <th className="p-3 text-xs text-muted-foreground font-medium">Actions</th>
                        </tr></thead>
                        <tbody>
                          {meetings.length === 0 ? (
                            <tr><td colSpan={8} className="text-center p-6 text-muted-foreground">No meetings scheduled.</td></tr>
                          ) : meetings.map((m: any) => (
                            <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                              <td className="p-3 text-xs">{format(new Date(m.meeting_date), "dd MMM yyyy")}</td>
                              <td className="p-3 text-xs">{m.start_time?.slice(0, 5)}–{m.end_time?.slice(0, 5)}</td>
                              <td className="p-3 text-sm font-medium">{m.title}</td>
                              <td className="p-3 text-xs">{m.location || "—"}</td>
                              <td className="p-3 text-xs">{getProfileName(m.organizer_id)}</td>
                              <td className="p-3 text-xs">
                                <div className="flex flex-wrap gap-1">
                                  {(m.attendee_ids || []).map((aid: string) => (
                                    <span key={aid} className="inline-block bg-primary/10 text-primary rounded px-1.5 py-0.5 text-[11px]">{getProfileName(aid)}</span>
                                  ))}
                                </div>
                              </td>
                              <td className="p-3">{statusBadge(m.status)}</td>
                              <td className="p-3">
                                <div className="flex gap-1">
                                  {m.status === "scheduled" && (
                                    <>
                                      <Button variant="ghost" size="sm" title="Mark completed" onClick={async () => {
                                        await supabase.from("meetings").update({ status: "completed" }).eq("id", m.id);
                                        toast({ title: "Meeting marked as completed" });
                                        fetchMeetings();
                                      }}><CheckCircle2 className="w-4 h-4 text-success" /></Button>
                                      <Button variant="ghost" size="sm" title="Cancel meeting" onClick={async () => {
                                        await supabase.from("meetings").update({ status: "cancelled" }).eq("id", m.id);
                                        // Notify attendees
                                        const allRecipients = [...new Set([m.organizer_id, ...(m.attendee_ids || [])])];
                                        for (const aid of allRecipients) {
                                          await supabase.from("notifications").insert({
                                            user_id: aid,
                                            title: `❌ Meeting Cancelled: ${m.title}`,
                                            body: `The meeting on ${format(new Date(m.meeting_date), "dd MMM yyyy")} has been cancelled.`,
                                            type: "meeting",
                                          });
                                        }
                                        toast({ title: "Meeting cancelled", description: "Attendees notified." });
                                        fetchMeetings();
                                      }}><XCircle className="w-4 h-4 text-destructive" /></Button>
                                    </>
                                  )}
                                  <Button variant="ghost" size="sm" title="Delete" onClick={async () => {
                                    await supabase.from("meetings").delete().eq("id", m.id);
                                    toast({ title: "Meeting deleted" });
                                    fetchMeetings();
                                  }}><Trash2 className="w-4 h-4 text-muted-foreground" /></Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ INTERVIEWS ═══ */}
              {tab === "interviews" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold flex items-center gap-2"><Video className="w-5 h-5" /> Interview Slot Management</h2>

                  {/* Create / Edit form */}
                  <div className="ks-card p-4 space-y-3">
                    <h3 className="font-bold text-sm flex items-center gap-1.5">
                      {editingSlot ? <><Pencil className="w-4 h-4" /> Edit Slot</> : <><Plus className="w-4 h-4" /> Create Interview Slot</>}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="ks-field">
                        <label>Date *</label>
                        <input type="date" value={interviewForm.slot_date} onChange={e => setInterviewForm(f => ({ ...f, slot_date: e.target.value }))} />
                      </div>
                      <div className="ks-field">
                        <label>Start Time *</label>
                        <input type="time" value={interviewForm.start_time} onChange={e => setInterviewForm(f => ({ ...f, start_time: e.target.value }))} />
                      </div>
                      <div className="ks-field">
                        <label>End Time *</label>
                        <input type="time" value={interviewForm.end_time} onChange={e => setInterviewForm(f => ({ ...f, end_time: e.target.value }))} />
                      </div>
                      <div className="ks-field sm:col-span-2">
                        <label>Google Meet Link</label>
                        <input value={interviewForm.meeting_link} onChange={e => setInterviewForm(f => ({ ...f, meeting_link: e.target.value }))} placeholder="https://meet.google.com/..." />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">For Role *</label>
                        <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={interviewForm.role_target} onChange={e => setInterviewForm(f => ({ ...f, role_target: e.target.value }))}>
                          <option value="childminder">Childminder</option>
                          <option value="parent">Parent</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs text-muted-foreground mb-1 block">Assign Directly to User (optional — bypasses self-booking)</label>
                        <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={interviewForm.assign_to} onChange={e => setInterviewForm(f => ({ ...f, assign_to: e.target.value }))}>
                          <option value="">— Open for self-booking —</option>
                          {profiles.filter(p => p.role === interviewForm.role_target || p.role === "user").map(p => (
                            <option key={p.user_id} value={p.user_id}>{p.first_name} {p.last_name} ({p.email})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="hero" size="sm" className="gap-1.5" disabled={interviewSaving} onClick={async () => {
                        if (!interviewForm.slot_date || !interviewForm.start_time || !interviewForm.end_time) {
                          toast({ title: "Please fill date and times", variant: "destructive" }); return;
                        }
                        setInterviewSaving(true);
                        try {
                          const slotData: any = {
                            slot_date: interviewForm.slot_date,
                            start_time: interviewForm.start_time,
                            end_time: interviewForm.end_time,
                            meeting_link: interviewForm.meeting_link || null,
                            role_target: interviewForm.role_target,
                            created_by: user!.id,
                          };

                          // If assigning directly to a user
                          if (interviewForm.assign_to) {
                            slotData.booked_by = interviewForm.assign_to;
                            slotData.booked_at = new Date().toISOString();
                            slotData.status = "booked";
                          }

                          if (editingSlot) {
                            const { error } = await supabase.from("interview_slots").update(slotData).eq("id", editingSlot.id);
                            if (error) throw error;
                            toast({ title: "Slot updated" });
                          } else {
                            const { error } = await supabase.from("interview_slots").insert(slotData);
                            if (error) throw error;
                            toast({ title: "Slot created!" });
                          }

                          // Send email if directly assigned
                          if (interviewForm.assign_to) {
                            const assignedProfile = profiles.find(p => p.user_id === interviewForm.assign_to);
                            if (assignedProfile?.email) {
                              supabase.functions.invoke("send-email", {
                                body: {
                                  to: assignedProfile.email,
                                  subject: "KinderStars: Interview Scheduled for You",
                                  html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:20px;">
                                    <h2 style="color:#2563eb;">KinderStars Interview</h2>
                                    <p>Hi ${assignedProfile.first_name || "there"},</p>
                                    <p>An interview has been scheduled for you:</p>
                                    <p><strong>Date:</strong> ${format(new Date(interviewForm.slot_date), "EEEE, d MMMM yyyy")}</p>
                                    <p><strong>Time:</strong> ${interviewForm.start_time} – ${interviewForm.end_time}</p>
                                    ${interviewForm.meeting_link ? `<p><strong>Meeting Link:</strong> <a href="${interviewForm.meeting_link}">${interviewForm.meeting_link}</a></p>` : ""}
                                    <p>Please be on time. If you have any questions, contact the KinderStars team.</p>
                                    <p style="margin-top:20px;color:#888;font-size:12px;">KinderStars Team</p>
                                  </div>`,
                                },
                              }).catch(() => {});

                              // Also send in-app notification
                              await supabase.from("notifications").insert({
                                user_id: interviewForm.assign_to,
                                title: "📅 Interview Scheduled",
                                body: `Your interview is on ${format(new Date(interviewForm.slot_date), "d MMM yyyy")} at ${interviewForm.start_time}. ${interviewForm.meeting_link ? "Check your email for the meeting link." : ""}`,
                                type: "interview",
                              });
                            }

                            // Update onboarding status if childminder
                            if (interviewForm.role_target === "childminder") {
                              await supabase.from("childminder_profiles").update({ onboarding_status: "interview_scheduled" }).eq("user_id", interviewForm.assign_to);
                            }
                          }

                          setInterviewForm({ slot_date: format(new Date(), "yyyy-MM-dd"), start_time: "10:00", end_time: "10:30", meeting_link: "", role_target: "childminder", assign_to: "" });
                          setEditingSlot(null);
                          fetchInterviewSlots();
                        } catch (err: any) {
                          toast({ title: "Error", description: err.message, variant: "destructive" });
                        }
                        setInterviewSaving(false);
                      }}>
                        {interviewSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingSlot ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {editingSlot ? "Update Slot" : "Create Slot"}
                      </Button>
                      {editingSlot && (
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingSlot(null);
                          setInterviewForm({ slot_date: format(new Date(), "yyyy-MM-dd"), start_time: "10:00", end_time: "10:30", meeting_link: "", role_target: "childminder", assign_to: "" });
                        }}>Cancel</Button>
                      )}
                    </div>
                  </div>

                  {/* Slots table */}
                  <div className="ks-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border bg-muted/50">
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Date</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Time</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">For</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Status</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Booked By</th>
                          <th className="text-left p-3 text-xs text-muted-foreground font-medium">Meet Link</th>
                          <th className="p-3 text-xs text-muted-foreground font-medium">Actions</th>
                        </tr></thead>
                        <tbody>
                          {interviewSlots.length === 0 ? (
                            <tr><td colSpan={7} className="text-center p-6 text-muted-foreground">No interview slots. Create one above.</td></tr>
                          ) : interviewSlots.map((slot: any) => (
                            <tr key={slot.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                              <td className="p-3 text-xs">{format(new Date(slot.slot_date), "dd MMM yyyy")}</td>
                              <td className="p-3 text-xs">{slot.start_time?.slice(0, 5)}–{slot.end_time?.slice(0, 5)}</td>
                              <td className="p-3">{statusBadge(slot.role_target)}</td>
                              <td className="p-3">{statusBadge(slot.status)}</td>
                              <td className="p-3 text-xs">{slot.booked_by ? getProfileName(slot.booked_by) : "—"}</td>
                              <td className="p-3 text-xs">
                                {slot.meeting_link ? (
                                  <a href={slot.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                    <Video className="w-3 h-3" /> Join
                                  </a>
                                ) : "—"}
                              </td>
                              <td className="p-3">
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" title="Edit" onClick={() => {
                                    setEditingSlot(slot);
                                    setInterviewForm({
                                      slot_date: slot.slot_date,
                                      start_time: slot.start_time?.slice(0, 5) || "10:00",
                                      end_time: slot.end_time?.slice(0, 5) || "10:30",
                                      meeting_link: slot.meeting_link || "",
                                      role_target: slot.role_target || "childminder",
                                      assign_to: slot.booked_by || "",
                                    });
                                  }}><Pencil className="w-4 h-4" /></Button>

                                  {slot.status === "booked" && (
                                    <Button variant="ghost" size="sm" title="Mark completed" onClick={async () => {
                                      await supabase.from("interview_slots").update({ status: "completed" }).eq("id", slot.id);
                                      if (slot.booked_by && slot.role_target === "childminder") {
                                        await supabase.from("childminder_profiles").update({ onboarding_status: "interview_completed" }).eq("user_id", slot.booked_by);
                                      }
                                      toast({ title: "Interview marked as completed ✅" });
                                      fetchInterviewSlots();
                                    }}><CheckCircle2 className="w-4 h-4 text-success" /></Button>
                                  )}

                                  {!slot.booked_by && (
                                    <Button variant="ghost" size="sm" title="Assign to user" onClick={() => {
                                      setEditingSlot(slot);
                                      setInterviewForm({
                                        slot_date: slot.slot_date,
                                        start_time: slot.start_time?.slice(0, 5) || "10:00",
                                        end_time: slot.end_time?.slice(0, 5) || "10:30",
                                        meeting_link: slot.meeting_link || "",
                                        role_target: slot.role_target || "childminder",
                                        assign_to: "",
                                      });
                                    }}><UserPlus className="w-4 h-4 text-primary" /></Button>
                                  )}

                                  <Button variant="ghost" size="sm" title="Delete" onClick={async () => {
                                    await supabase.from("interview_slots").delete().eq("id", slot.id);
                                    toast({ title: "Slot deleted" });
                                    fetchInterviewSlots();
                                  }}><Trash2 className="w-4 h-4 text-muted-foreground" /></Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ AUDIT LOG ═══ */}
              {tab === "audit-log" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold flex-1">Audit Log</h2>
                    <Button variant="ghost" size="sm" onClick={fetchAuditLogs} disabled={auditLoading}>
                      <RefreshCw className={`w-4 h-4 ${auditLoading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                  {auditLoading ? (
                    <div className="text-muted-foreground text-sm text-center py-10">Loading…</div>
                  ) : auditLogs.length === 0 ? (
                    <div className="ks-card p-6 text-center text-muted-foreground text-sm">No audit log entries yet. Actions like user edits, deletions, and password resets will appear here.</div>
                  ) : (
                    <div className="ks-card overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="border-b border-border bg-muted/50">
                            <th className="text-left p-3 text-xs text-muted-foreground font-medium">Time</th>
                            <th className="text-left p-3 text-xs text-muted-foreground font-medium">Admin</th>
                            <th className="text-left p-3 text-xs text-muted-foreground font-medium">Action</th>
                            <th className="text-left p-3 text-xs text-muted-foreground font-medium">Target</th>
                            <th className="text-left p-3 text-xs text-muted-foreground font-medium">Details</th>
                          </tr></thead>
                          <tbody>
                            {auditLogs.map((log) => (
                              <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                                <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{format(new Date(log.created_at), "dd MMM yyyy HH:mm")}</td>
                                <td className="p-3 text-xs">{log.admin_email || "—"}</td>
                                <td className="p-3">{statusBadge(log.action)}</td>
                                <td className="p-3 text-xs">{log.target_email || log.target_user_id?.slice(0, 8) || "—"}</td>
                                <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate">
                                  {log.details && Object.keys(log.details).length > 0 ? JSON.stringify(log.details) : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ ANALYTICS ═══ */}
              {tab === "analytics" && (() => {
                const now = new Date();
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

                // Registration trends (last 12 weeks)
                const weeklyRegs: { week: string; parents: number; minders: number }[] = [];
                for (let i = 11; i >= 0; i--) {
                  const wStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
                  const wEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
                  const label = format(wEnd, "dd MMM");
                  const parents = profiles.filter(p => p.role === "parent" && new Date(p.created_at) >= wStart && new Date(p.created_at) < wEnd).length;
                  const minders = profiles.filter(p => p.role === "childminder" && new Date(p.created_at) >= wStart && new Date(p.created_at) < wEnd).length;
                  weeklyRegs.push({ week: label, parents, minders });
                }

                // Onboarding funnel
                const totalCm = cmProfiles.length;
                const pendingCm = cmProfiles.filter(c => c.onboarding_status === "pending").length;
                const submittedCm = cmProfiles.filter(c => c.onboarding_status === "submitted").length;
                const verifiedCm = cmProfiles.filter(c => c.onboarding_status === "verified").length;
                const funnelData = [
                  { stage: "Registered", count: totalCm },
                  { stage: "Submitted", count: submittedCm + verifiedCm },
                  { stage: "Verified", count: verifiedCm },
                ];

                // Engagement metrics
                const activeParents30d = profiles.filter(p => p.role === "parent" && new Date(p.created_at) >= thirtyDaysAgo).length;
                const activeMinders30d = profiles.filter(p => p.role === "childminder" && new Date(p.created_at) >= thirtyDaysAgo).length;
                const totalParents = profiles.filter(p => p.role === "parent").length;
                const totalMinders = profiles.filter(p => p.role === "childminder").length;

                // Subscription breakdown
                const activeSubs = subscriptions.filter(s => s.status === "active").length;
                const trialSubs = subscriptions.filter(s => s.plan === "free_trial").length;
                const paidSubs = subscriptions.filter(s => s.plan !== "free_trial" && s.status === "active").length;
                const subData = [
                  { name: "Free Trial", value: trialSubs },
                  { name: "Monthly", value: paidSubs },
                ];
                const SUB_COLORS = ["hsl(var(--primary))", "hsl(var(--success))"];

                // Booking activity
                const bookingsByStatus: Record<string, number> = {};
                // use shifts as proxy
                shifts.forEach(s => {
                  bookingsByStatus[s.status] = (bookingsByStatus[s.status] || 0) + 1;
                });
                const bookingStatusData = Object.entries(bookingsByStatus).map(([name, value]) => ({ name, value }));
                const BOOKING_COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];

                return (
                  <div className="space-y-5">
                    <h2 className="text-xl font-bold flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Analytics Dashboard</h2>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "Total Parents", value: totalParents, color: "text-primary" },
                        { label: "Total Childminders", value: totalMinders, color: "text-secondary" },
                        { label: "New Parents (30d)", value: activeParents30d, color: "text-success" },
                        { label: "Conversion Rate", value: totalCm > 0 ? `${Math.round((verifiedCm / totalCm) * 100)}%` : "0%", color: "text-warning" },
                      ].map((kpi, i) => (
                        <div key={i} className="ks-card p-4 text-center">
                          <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                          <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Registration Trends */}
                    <div className="ks-card p-4">
                      <h3 className="font-bold text-sm mb-3">Registration Trends (12 Weeks)</h3>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={weeklyRegs}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey="parents" name="Parents" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                            <Bar dataKey="minders" name="Childminders" fill="hsl(var(--secondary))" radius={[4,4,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Onboarding Funnel */}
                      <div className="ks-card p-4">
                        <h3 className="font-bold text-sm mb-3">Childminder Onboarding Funnel</h3>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={funnelData} layout="vertical">
                              <XAxis type="number" tick={{ fontSize: 10 }} />
                              <YAxis type="category" dataKey="stage" tick={{ fontSize: 10 }} width={80} />
                              <Tooltip />
                              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0,4,4,0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                          <div><div className="text-lg font-bold">{pendingCm}</div><div className="text-[10px] text-muted-foreground">Pending</div></div>
                          <div><div className="text-lg font-bold">{submittedCm}</div><div className="text-[10px] text-muted-foreground">Submitted</div></div>
                          <div><div className="text-lg font-bold text-success">{verifiedCm}</div><div className="text-[10px] text-muted-foreground">Verified</div></div>
                        </div>
                      </div>

                      {/* Subscription Breakdown */}
                      <div className="ks-card p-4">
                        <h3 className="font-bold text-sm mb-3">Subscriptions</h3>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={subData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                                {subData.map((_, i) => <Cell key={i} fill={SUB_COLORS[i % SUB_COLORS.length]} />)}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                          <div><div className="text-lg font-bold">{activeSubs}</div><div className="text-[10px] text-muted-foreground">Active</div></div>
                          <div><div className="text-lg font-bold">{trialSubs}</div><div className="text-[10px] text-muted-foreground">Trial</div></div>
                          <div><div className="text-lg font-bold text-success">{paidSubs}</div><div className="text-[10px] text-muted-foreground">Paid</div></div>
                        </div>
                      </div>
                    </div>

                    {/* Shift Activity */}
                    <div className="ks-card p-4">
                      <h3 className="font-bold text-sm mb-3">Shift Status Distribution</h3>
                      {bookingStatusData.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No shift data yet.</p>
                      ) : (
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={bookingStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                                {bookingStatusData.map((_, i) => <Cell key={i} fill={BOOKING_COLORS[i % BOOKING_COLORS.length]} />)}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    {/* Engagement Summary */}
                    <div className="ks-card p-4">
                      <h3 className="font-bold text-sm mb-3">Platform Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: "Total Children", value: children.length },
                          { label: "Active Contracts", value: contracts.filter((c: any) => c.status === "active" || c.status === "signed").length },
                          { label: "Open Incidents", value: incidents.filter(i => i.status === "open").length },
                          { label: "Pending GDPR", value: gdprRequests.filter(g => g.status === "pending").length },
                        ].map((stat, i) => (
                          <div key={i} className="p-3 bg-muted/50 rounded-xl text-center">
                            <div className="text-xl font-bold">{stat.value}</div>
                            <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
