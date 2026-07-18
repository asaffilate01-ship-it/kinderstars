import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, FileText, Bell, TrendingUp, GraduationCap, ClipboardList, MessageSquare, Heart, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import WelcomeTour, { TourStep } from "@/components/WelcomeTour";

const ChildminderDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [prospectStage, setProspectStage] = useState<string | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<string | null>(null);
  const [stats, setStats] = useState<{ label: string; value: number | string; icon: any; color: string }[]>([]);
  const [activity, setActivity] = useState<{ id: string; title: string; time: string; icon: any }[]>([]);
  const [loading, setLoading] = useState(true);

  const tourSteps: TourStep[] = [
    { target: "[data-tour='cm-stats']", title: t("portal.childminder.dashboard"), description: t("portal.childminder.pendingShifts") },
    { target: "[data-tour='cm-activity']", title: t("portal.childminder.recentActivity"), description: t("portal.childminder.recentActivity") },
    { target: "[data-tour='cm-links']", title: t("portal.childminder.quickLinks"), description: t("portal.childminder.quickLinks") },
  ];

  const quickLinks = [
    { to: "/childminder/shifts", icon: Clock, label: t("portal.cmQuickLinks.upcomingShifts"), desc: t("portal.cmQuickLinks.upcomingShiftsDesc") },
    { to: "/childminder/availability", icon: Calendar, label: t("portal.cmQuickLinks.myAvailability"), desc: t("portal.cmQuickLinks.myAvailabilityDesc") },
    { to: "/childminder/timesheets", icon: FileText, label: t("portal.cmQuickLinks.timesheets"), desc: t("portal.cmQuickLinks.timesheetsDesc") },
    { to: "/childminder/contracts", icon: ClipboardList, label: t("portal.cmQuickLinks.myContracts"), desc: t("portal.cmQuickLinks.myContractsDesc") },
    { to: "/childminder/performance", icon: TrendingUp, label: t("portal.cmQuickLinks.performance"), desc: t("portal.cmQuickLinks.performanceDesc") },
    { to: "/childminder/notifications", icon: Bell, label: t("portal.cmQuickLinks.notifications"), desc: t("portal.cmQuickLinks.notificationsDesc") },
  ];

  const prospectLinks = [
    { to: "/childminder/prospect", icon: GraduationCap, label: t("portal.cmQuickLinks.trainingChecklist"), desc: t("portal.cmQuickLinks.trainingChecklistDesc") },
    { to: "/childminder/profile", icon: FileText, label: t("portal.cmQuickLinks.myProfile"), desc: t("portal.cmQuickLinks.myProfileDesc") },
    { to: "/childminder/notifications", icon: Bell, label: t("portal.cmQuickLinks.notifications"), desc: t("portal.cmQuickLinks.notificationsDesc") },
  ];

  useEffect(() => {
    if (!user) return;
    supabase
      .from("childminder_profiles")
      .select("prospect_stage, onboarding_status")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProspectStage(data?.prospect_stage ?? null);
        setOnboardingStatus(data?.onboarding_status ?? null);
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [shiftsRes, messagesRes, notifsRes, timesheetsRes, bookingsRes, contractsRes] = await Promise.all([
        supabase.from("shifts").select("id, title, status, start_time").eq("childminder_id", user.id).order("start_time", { ascending: false }).limit(5),
        supabase.from("messages").select("id, content, created_at").eq("recipient_id", user.id).eq("read", false).order("created_at", { ascending: false }).limit(5),
        supabase.from("notifications").select("id, title, created_at").eq("user_id", user.id).eq("read", false).order("created_at", { ascending: false }).limit(5),
        supabase.from("timesheets").select("id, status", { count: "exact" }).eq("childminder_id", user.id).eq("status", "draft"),
        supabase.from("bookings").select("id, status, booking_date").eq("childminder_id", user.id).order("booking_date", { ascending: false }).limit(5),
        supabase.from("contracts").select("id, status, contract_type, updated_at").eq("assigned_to", user.id).order("updated_at", { ascending: false }).limit(3),
      ]);

      const pendingShifts = (shiftsRes.data ?? []).filter(s => s.status === "offered" || s.status === "pending").length;
      const unreadMessages = messagesRes.data?.length ?? 0;
      const draftTimesheets = timesheetsRes.count ?? 0;
      const unreadNotifs = notifsRes.data?.length ?? 0;

      setStats([
        { label: t("portal.childminder.pendingShifts"), value: pendingShifts, icon: Clock, color: "bg-secondary/15 text-secondary" },
        { label: t("portal.childminder.draftTimesheets"), value: draftTimesheets, icon: FileText, color: "bg-primary/15 text-primary-foreground" },
        { label: t("portal.childminder.unreadMessages"), value: unreadMessages, icon: MessageSquare, color: "bg-accent/15 text-accent" },
        { label: t("portal.sidebar.notifications"), value: unreadNotifs, icon: Bell, color: "bg-destructive/15 text-destructive" },
      ]);

      const items: { id: string; title: string; time: string; icon: any }[] = [];
      (shiftsRes.data ?? []).forEach(s => {
        items.push({ id: s.id, title: `${s.title} — ${s.status}`, time: s.start_time, icon: Clock });
      });
      (messagesRes.data ?? []).forEach(m => {
        items.push({ id: m.id, title: `${t("portal.messages.newMessage")}: "${(m.content || "").slice(0, 40)}…"`, time: m.created_at, icon: MessageSquare });
      });
      (notifsRes.data ?? []).forEach(n => {
        items.push({ id: n.id, title: n.title, time: n.created_at, icon: Bell });
      });
      (bookingsRes.data ?? []).forEach(b => {
        items.push({ id: b.id, title: `${t("portal.bookings.title")} ${format(new Date(b.booking_date), "dd MMM")} — ${b.status}`, time: b.booking_date, icon: Heart });
      });
      (contractsRes.data ?? []).forEach(c => {
        items.push({ id: c.id, title: `${t("portal.contracts.title")} (${c.contract_type}) — ${c.status}`, time: c.updated_at, icon: Shield });
      });

      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setActivity(items.slice(0, 8));
      setLoading(false);
    };

    fetchData();
  }, [user, t]);

  const isProspect = onboardingStatus !== "verified" && (!prospectStage || prospectStage !== "migrated");
  const links = isProspect ? prospectLinks : quickLinks;
  const firstName = user?.user_metadata?.first_name;

  return (
    <div>
      {!isProspect && <WelcomeTour steps={tourSteps} storageKey="ks-tour-childminder" />}
      <h1 className="text-2xl font-bold tracking-tight mb-1">
        {isProspect ? t("portal.childminder.welcomeFuture") : t("portal.childminder.welcomeBack")}
      </h1>
      <p className="text-muted-foreground text-sm mb-6">
        {firstName ? `${firstName}` : user?.email}
        {isProspect && ` — ${t("portal.childminder.completePath")}`}
      </p>

      {!isProspect && (
        <div data-tour="cm-stats" className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {stats.map((s) => (
            <div key={s.label} className="ks-card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold">{loading ? "…" : s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isProspect && activity.length > 0 && (
        <div data-tour="cm-activity" className="ks-card p-5 mb-6">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-secondary" /> {t("portal.childminder.recentActivity")}
          </h3>
          <div className="space-y-0">
            {activity.map((item, i) => (
              <div key={item.id + i} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center mt-0.5 shrink-0">
                  <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground">{format(new Date(item.time), "dd MMM yyyy, HH:mm")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 className="font-bold text-sm mb-3">{t("portal.childminder.quickLinks")}</h3>
      <div data-tour="cm-links" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {links.map((link) => (
          <Link key={link.to} to={link.to} className="ks-card p-5 hover:shadow-lg transition-shadow group">
            <div className="ks-icon-box">
              <link.icon className="w-5 h-5 text-secondary" />
            </div>
            <h3 className="font-bold text-sm group-hover:text-secondary transition-colors">{link.label}</h3>
            <p className="text-muted-foreground text-xs mt-1">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ChildminderDashboard;
