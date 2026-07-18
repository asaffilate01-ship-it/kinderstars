import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Baby, Heart, CreditCard, Bell, Search, ClipboardList, FileText, MessageSquare, Calendar, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import WelcomeTour, { TourStep } from "@/components/WelcomeTour";

const ParentDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState<{ label: string; value: number | string; icon: any; color: string }[]>([]);
  const [activity, setActivity] = useState<{ id: string; type: string; title: string; time: string; icon: any }[]>([]);
  const [loading, setLoading] = useState(true);

  const tourSteps: TourStep[] = [
    { target: "[data-tour='stats']", title: t("portal.parent.dashboard"), description: t("portal.parent.upcomingBookings") },
    { target: "[data-tour='activity']", title: t("portal.parent.recentActivity"), description: t("portal.parent.recentActivity") },
    { target: "[data-tour='quicklinks']", title: t("portal.parent.quickLinks"), description: t("portal.parent.quickLinks") },
  ];

  const quickLinks = [
    { to: "/parent/onboarding", icon: ClipboardList, label: t("portal.parentQuickLinks.onboarding"), desc: t("portal.parentQuickLinks.onboardingDesc") },
    { to: "/parent/find-childminder", icon: Search, label: t("portal.parentQuickLinks.findChildminder"), desc: t("portal.parentQuickLinks.findChildminderDesc") },
    { to: "/parent/children", icon: Baby, label: t("portal.parentQuickLinks.myChildren"), desc: t("portal.parentQuickLinks.myChildrenDesc") },
    { to: "/parent/bookings", icon: Heart, label: t("portal.parentQuickLinks.bookings"), desc: t("portal.parentQuickLinks.bookingsDesc") },
    { to: "/parent/contracts", icon: FileText, label: t("portal.parentQuickLinks.contracts"), desc: t("portal.parentQuickLinks.contractsDesc") },
    { to: "/parent/funding", icon: CreditCard, label: t("portal.parentQuickLinks.funding"), desc: t("portal.parentQuickLinks.fundingDesc") },
    { to: "/parent/notifications", icon: Bell, label: t("portal.parentQuickLinks.notifications"), desc: t("portal.parentQuickLinks.notificationsDesc") },
  ];

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      const [bookingsRes, childrenRes, messagesRes, notifsRes, contractsRes] = await Promise.all([
        supabase.from("bookings").select("id, status, booking_date, start_time", { count: "exact" }).eq("parent_id", user.id),
        supabase.from("children").select("id", { count: "exact" }).eq("parent_id", user.id),
        supabase.from("messages").select("id, content, created_at, read").eq("recipient_id", user.id).eq("read", false).order("created_at", { ascending: false }).limit(5),
        supabase.from("notifications").select("id, title, created_at, read").eq("user_id", user.id).eq("read", false).order("created_at", { ascending: false }).limit(5),
        supabase.from("contracts").select("id, status, updated_at, contract_type").eq("assigned_to", user.id).order("updated_at", { ascending: false }).limit(5),
      ]);

      const upcomingBookings = (bookingsRes.data ?? []).filter(b => b.status === "confirmed" || b.status === "pending").length;
      const unreadMessages = messagesRes.data?.length ?? 0;
      const unreadNotifs = notifsRes.data?.length ?? 0;
      const childCount = childrenRes.count ?? 0;

      setStats([
        { label: t("portal.parent.upcomingBookings"), value: upcomingBookings, icon: Calendar, color: "bg-secondary/15 text-secondary" },
        { label: t("portal.parent.children"), value: childCount, icon: Baby, color: "bg-primary/15 text-primary-foreground" },
        { label: t("portal.parent.unreadMessages"), value: unreadMessages, icon: MessageSquare, color: "bg-accent/15 text-accent" },
        { label: t("portal.sidebar.notifications"), value: unreadNotifs, icon: Bell, color: "bg-destructive/15 text-destructive" },
      ]);

      const items: { id: string; type: string; title: string; time: string; icon: any }[] = [];
      (bookingsRes.data ?? []).slice(0, 3).forEach(b => {
        items.push({ id: b.id, type: "booking", title: `${t("portal.bookings.title")} ${format(new Date(b.booking_date), "dd MMM")} — ${b.status}`, time: b.booking_date, icon: Heart });
      });
      (messagesRes.data ?? []).forEach(m => {
        items.push({ id: m.id, type: "message", title: `${t("portal.messages.newMessage")}: "${(m.content || "").slice(0, 40)}…"`, time: m.created_at, icon: MessageSquare });
      });
      (notifsRes.data ?? []).forEach(n => {
        items.push({ id: n.id, type: "notification", title: n.title, time: n.created_at, icon: Bell });
      });
      (contractsRes.data ?? []).forEach(c => {
        items.push({ id: c.id, type: "contract", title: `${t("portal.contracts.title")} (${c.contract_type}) — ${c.status}`, time: c.updated_at, icon: FileText });
      });

      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setActivity(items.slice(0, 8));
      setLoading(false);
    };

    fetchDashboardData();
  }, [user, t]);

  return (
    <div>
      <WelcomeTour steps={tourSteps} storageKey="ks-tour-parent" />
      <h1 className="text-2xl font-bold tracking-tight mb-1">{t("portal.parent.welcomeBack", { name: user?.user_metadata?.first_name || "" })}</h1>
      <p className="text-muted-foreground text-sm mb-6">{user?.email}</p>

      <div data-tour="stats" className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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

      {activity.length > 0 && (
        <div data-tour="activity" className="ks-card p-5 mb-6">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-secondary" /> {t("portal.parent.recentActivity")}
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

      <h3 className="font-bold text-sm mb-3">{t("portal.parent.quickLinks")}</h3>
      <div data-tour="quicklinks" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickLinks.map((link) => (
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

export default ParentDashboard;
