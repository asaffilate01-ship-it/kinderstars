import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BottomNav, { BottomNavItem } from "@/components/BottomNav";
import { useUnreadNotifications } from "@/hooks/use-notifications";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import { useRealtimeToasts } from "@/hooks/use-realtime-toasts";
import logo from "@/assets/kinderstars-logo.png";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  User, Calendar, Clock, FileText, MessageSquare, Bell, Settings, LogOut, Home, Shield, Award, ClipboardList, TrendingUp, CreditCard, Heart, ScrollText, GraduationCap, Lock, BookOpen
} from "lucide-react";

const ChildminderPortal = () => {
  const { t } = useTranslation();
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [onboardingStatus, setOnboardingStatus] = useState<string | null>(null);
  const [prospectStage, setProspectStage] = useState<string | null>(null);
  const unreadNotifs = useUnreadNotifications();
  const unreadMsgs = useUnreadMessages();
  useRealtimeToasts();

  const allSidebarLinks = [
    { to: "/childminder", icon: Home, label: t("portal.sidebar.dashboard"), end: true, requiresVerified: false, key: "dashboard" },
    { to: "/childminder/onboarding", icon: ClipboardList, label: t("portal.sidebar.onboarding"), requiresVerified: false, key: "onboarding" },
    { to: "/childminder/profile", icon: User, label: t("portal.sidebar.profile"), requiresVerified: false, key: "profile" },
    { to: "/childminder/compliance", icon: Shield, label: t("portal.sidebar.compliance"), requiresVerified: false, key: "compliance" },
    { to: "/childminder/verifizierung", icon: Shield, label: "Verifizierung", requiresVerified: false, key: "verification" },
    { to: "/childminder/certificates", icon: Award, label: t("portal.sidebar.certificates"), requiresVerified: false, key: "certificates" },
    { to: "/childminder/performance", icon: TrendingUp, label: t("portal.sidebar.performance"), requiresVerified: true, key: "performance" },
    { to: "/childminder/availability", icon: Calendar, label: t("portal.sidebar.availability"), requiresVerified: true, key: "availability" },
    { to: "/childminder/shifts", icon: Clock, label: t("portal.sidebar.shifts"), requiresVerified: true, key: "shifts" },
    { to: "/childminder/timesheets", icon: FileText, label: t("portal.sidebar.timesheets"), requiresVerified: true, key: "timesheets" },
    { to: "/childminder/invoices", icon: FileText, label: t("portal.sidebar.invoices"), requiresVerified: true, key: "invoices" },
    { to: "/childminder/contracts", icon: ScrollText, label: t("portal.sidebar.contracts"), requiresVerified: true, key: "contracts" },
    { to: "/childminder/bookings", icon: Heart, label: t("portal.sidebar.bookings"), requiresVerified: true, key: "bookings" },
    { to: "/childminder/training", icon: BookOpen, label: t("portal.sidebar.trainingCpd"), requiresVerified: false, key: "training" },
    { to: "/childminder/akademie", icon: GraduationCap, label: "Akademie", requiresVerified: false, key: "akademie" },
    { to: "/childminder/messages", icon: MessageSquare, label: t("portal.sidebar.messages"), requiresVerified: false, key: "messages" },
    { to: "/childminder/notifications", icon: Bell, label: t("portal.sidebar.notifications"), requiresVerified: false, key: "notifications" },
    { to: "/childminder/subscription", icon: CreditCard, label: t("portal.sidebar.subscription"), requiresVerified: false, key: "subscription" },
    { to: "/childminder/settings", icon: Settings, label: t("portal.sidebar.security"), requiresVerified: false, key: "security" },
  ];

  const prospectSidebarLinks = [
    { to: "/childminder", icon: Home, label: t("portal.sidebar.dashboard"), end: true, requiresVerified: false, key: "dashboard" },
    { to: "/childminder/prospect", icon: GraduationCap, label: t("portal.sidebar.training"), requiresVerified: false, key: "training-prospect" },
    { to: "/childminder/profile", icon: User, label: t("portal.sidebar.profile"), requiresVerified: false, key: "profile" },
    { to: "/childminder/training", icon: BookOpen, label: t("portal.sidebar.cpdCourses"), requiresVerified: false, key: "cpd" },
    { to: "/childminder/messages", icon: MessageSquare, label: t("portal.sidebar.messages"), requiresVerified: false, key: "messages" },
    { to: "/childminder/notifications", icon: Bell, label: t("portal.sidebar.notifications"), requiresVerified: false, key: "notifications" },
    { to: "/childminder/settings", icon: Settings, label: t("portal.sidebar.security"), requiresVerified: false, key: "security" },
  ];

  const bottomTabs: BottomNavItem[] = [
    { to: "/childminder", icon: Home, label: t("portal.sidebar.dashboard"), end: true },
    { to: "/childminder/onboarding", icon: ClipboardList, label: t("portal.sidebar.onboarding") },
    { to: "/childminder/messages", icon: MessageSquare, label: t("portal.sidebar.messages"), badge: unreadMsgs },
    { to: "/childminder/notifications", icon: Bell, label: t("portal.sidebar.notifications"), badge: unreadNotifs },
    { to: "/childminder/profile", icon: User, label: t("portal.sidebar.profile") },
  ];

  const verifiedBottomTabs: BottomNavItem[] = [
    { to: "/childminder", icon: Home, label: t("portal.sidebar.dashboard"), end: true },
    { to: "/childminder/shifts", icon: Clock, label: t("portal.sidebar.shifts") },
    { to: "/childminder/messages", icon: MessageSquare, label: t("portal.sidebar.messages"), badge: unreadMsgs },
    { to: "/childminder/notifications", icon: Bell, label: t("portal.sidebar.notifications"), badge: unreadNotifs },
    { to: "/childminder/profile", icon: User, label: t("portal.sidebar.profile") },
  ];

  useEffect(() => {
    if (!loading && (!user || (userRole !== "childminder" && userRole !== "admin" && userRole !== "owner"))) {
      navigate("/auth?role=childminder");
    }
  }, [loading, user, userRole, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("childminder_profiles")
      .select("onboarding_status, prospect_stage")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setOnboardingStatus(data?.onboarding_status ?? "pending");
        setProspectStage(data?.prospect_stage ?? null);
      });
  }, [user]);

  useEffect(() => {
    if (!onboardingStatus || onboardingStatus === "verified" || userRole === "admin" || userRole === "owner") return;
    const allowedPaths = [
      "/childminder/onboarding", "/childminder/profile", "/childminder/settings",
      "/childminder/compliance", "/childminder/certificates", "/childminder/messages",
      "/childminder/notifications", "/childminder/training", "/childminder/prospect",
      "/childminder/subscription",
    ];
    const isOnAllowed = allowedPaths.some((p) => location.pathname.startsWith(p));
    const isOnDashboard = location.pathname === "/childminder";
    if (!isOnAllowed && !isOnDashboard) {
      navigate("/childminder/onboarding");
    }
  }, [onboardingStatus, location.pathname, navigate, userRole]);

  const isVerified = onboardingStatus === "verified";
  const isAdminOrOwner = userRole === "admin" || userRole === "owner";
  const isProspect = !isVerified && !!prospectStage && prospectStage !== "migrated";
  const baseSidebarLinks = isProspect ? prospectSidebarLinks : allSidebarLinks;
  const portalLabel = isProspect ? t("portal.sidebar.traineePortal") : t("portal.sidebar.childminderPortal");

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden lg:flex flex-col w-[240px] border-r border-border bg-card p-4 gap-1 sticky top-0 h-screen overflow-y-auto shrink-0">
        <a href="/" className="mb-4">
          <img src={logo} alt="KinderStars" className="w-[130px]" />
        </a>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 px-3">{portalLabel}</p>
        {baseSidebarLinks.map((link) => {
          const locked = link.requiresVerified && !isVerified && !isAdminOrOwner;
          if (locked) {
            return (
              <div
                key={link.to}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-muted-foreground/40 cursor-not-allowed"
                title={t("portal.sidebar.completeOnboarding")}
              >
                <link.icon className="w-4 h-4" />
                <span className="flex-1">{link.label}</span>
                <Lock className="w-3 h-3" />
              </div>
            );
          }
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                  isActive
                    ? "bg-secondary text-secondary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <link.icon className="w-4 h-4" />
              {link.label}
              {link.key === "messages" && unreadMsgs > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-[10px] flex items-center justify-center font-bold">{unreadMsgs > 99 ? "99+" : unreadMsgs}</span>
              )}
              {link.key === "notifications" && unreadNotifs > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">{unreadNotifs > 99 ? "99+" : unreadNotifs}</span>
              )}
            </NavLink>
          );
        })}
        <div className="mt-auto pt-4 border-t border-border space-y-2">
          <LanguageSwitcher />
          <p className="text-xs text-muted-foreground truncate px-3 mb-1">{user.user_metadata?.first_name || user.email}</p>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={() => { signOut(); navigate("/"); }}>
            <LogOut className="w-4 h-4" /> {t("portal.common.signOut")}
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 pb-24 lg:p-8 lg:pb-8">
        {onboardingStatus && onboardingStatus !== "verified" && !location.pathname.includes("/onboarding") && (
          <div className="ks-card p-3.5 mb-4 bg-primary/5 border-primary/20">
            <p className="text-sm font-medium">
              📋 {t("portal.onboarding.completeChecklist").split("{{link}}")[0]}<button onClick={() => navigate("/childminder/onboarding")} className="underline font-bold text-primary">{t("portal.sidebar.onboarding")}</button>
            </p>
          </div>
        )}
        <Outlet />
      </main>

      <BottomNav items={isVerified ? verifiedBottomTabs : bottomTabs} />
    </div>
  );
};

export default ChildminderPortal;
