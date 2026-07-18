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
  User, Baby, FileText, MessageSquare, Bell, Settings, LogOut, Home, CreditCard, Heart, Search, ScrollText, ClipboardList, Shield, Lock
} from "lucide-react";

const ParentPortal = () => {
  const { t } = useTranslation();
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const unreadNotifs = useUnreadNotifications();
  const unreadMsgs = useUnreadMessages();
  useRealtimeToasts();
  const [onboardingVerified, setOnboardingVerified] = useState<boolean | null>(null);

  const allSidebarLinks = [
    { to: "/parent", icon: Home, label: t("portal.sidebar.dashboard"), end: true, requiresVerified: false, key: "dashboard" },
    { to: "/parent/onboarding", icon: ClipboardList, label: t("portal.sidebar.onboarding"), requiresVerified: false, key: "onboarding" },
    { to: "/parent/profile", icon: User, label: t("portal.sidebar.myDetails"), requiresVerified: false, key: "details" },
    { to: "/parent/documents", icon: Shield, label: t("portal.sidebar.documents"), requiresVerified: false, key: "documents" },
    { to: "/parent/children", icon: Baby, label: t("portal.sidebar.children"), requiresVerified: false, key: "children" },
    { to: "/parent/find-childminder", icon: Search, label: t("portal.sidebar.findChildminder"), requiresVerified: true, key: "find" },
    { to: "/parent/bookings", icon: Heart, label: t("portal.sidebar.bookings"), requiresVerified: true, key: "bookings" },
    { to: "/parent/funding", icon: CreditCard, label: t("portal.sidebar.fundingPayments"), requiresVerified: true, key: "funding" },
    { to: "/parent/invoices", icon: FileText, label: t("portal.sidebar.invoices"), requiresVerified: true, key: "invoices" },
    { to: "/parent/contracts", icon: ScrollText, label: t("portal.sidebar.contracts"), requiresVerified: true, key: "contracts" },
    { to: "/parent/messages", icon: MessageSquare, label: t("portal.sidebar.messages"), requiresVerified: false, key: "messages" },
    { to: "/parent/notifications", icon: Bell, label: t("portal.sidebar.notifications"), requiresVerified: false, key: "notifications" },
    { to: "/parent/settings", icon: Settings, label: t("portal.sidebar.security"), requiresVerified: false, key: "security" },
  ];

  const bottomTabs: BottomNavItem[] = [
    { to: "/parent", icon: Home, label: t("portal.sidebar.dashboard"), end: true },
    { to: "/parent/onboarding", icon: ClipboardList, label: t("portal.sidebar.onboarding") },
    { to: "/parent/messages", icon: MessageSquare, label: t("portal.sidebar.messages"), badge: unreadMsgs },
    { to: "/parent/notifications", icon: Bell, label: t("portal.sidebar.notifications"), badge: unreadNotifs },
    { to: "/parent/profile", icon: User, label: t("portal.sidebar.profile") },
  ];

  const verifiedBottomTabs: BottomNavItem[] = [
    { to: "/parent", icon: Home, label: t("portal.sidebar.dashboard"), end: true },
    { to: "/parent/find-childminder", icon: Search, label: t("portal.sidebar.findChildminder") },
    { to: "/parent/messages", icon: MessageSquare, label: t("portal.sidebar.messages"), badge: unreadMsgs },
    { to: "/parent/notifications", icon: Bell, label: t("portal.sidebar.notifications"), badge: unreadNotifs },
    { to: "/parent/profile", icon: User, label: t("portal.sidebar.profile") },
  ];

  useEffect(() => {
    if (!loading && (!user || (userRole !== "parent" && userRole !== "admin" && userRole !== "owner"))) {
      navigate("/auth?role=parent");
    }
  }, [loading, user, userRole, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("onboarding_tasks")
      .select("task_key, completed")
      .eq("user_id", user.id)
      .eq("task_key", "parent_verified")
      .maybeSingle()
      .then(({ data }) => {
        setOnboardingVerified(data?.completed === true);
      });
  }, [user]);

  useEffect(() => {
    if (onboardingVerified === null || onboardingVerified === true || userRole === "admin" || userRole === "owner") return;
    const allowedPaths = ["/parent/onboarding", "/parent/profile", "/parent/settings", "/parent/documents", "/parent/children", "/parent/messages", "/parent/notifications"];
    if (!allowedPaths.some((p) => location.pathname.startsWith(p)) && location.pathname !== "/parent") {
      navigate("/parent/onboarding");
    }
  }, [onboardingVerified, location.pathname, navigate, userRole]);

  const isVerified = onboardingVerified === true;
  const isAdminOrOwner = userRole === "admin" || userRole === "owner";

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden lg:flex flex-col w-[240px] border-r border-border bg-card p-4 gap-1 sticky top-0 h-screen overflow-y-auto shrink-0">
        <a href="/" className="mb-4">
          <img src={logo} alt="KinderStars" className="w-[130px]" />
        </a>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 px-3">{t("portal.sidebar.parentPortal")}</p>
        {allSidebarLinks.map((link) => {
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
        {onboardingVerified === false && !location.pathname.includes("/onboarding") && (
          <div className="ks-card p-3.5 mb-4 bg-primary/5 border-primary/20">
            <p className="text-sm font-medium">
              🛡️ {t("portal.onboarding.completeOnboarding").split("{{link}}")[0]}<button onClick={() => navigate("/parent/onboarding")} className="underline font-bold text-primary">{t("portal.sidebar.onboarding")}</button>
            </p>
          </div>
        )}
        <Outlet />
      </main>

      <BottomNav items={isVerified ? verifiedBottomTabs : bottomTabs} />
    </div>
  );
};

export default ParentPortal;
