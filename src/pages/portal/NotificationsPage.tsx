import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Check, Clock, AlertTriangle, FileText, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface Notification {
  id: string;
  title: string;
  body: string | null;
  type: string | null;
  read: boolean;
  link: string | null;
  created_at: string;
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  late_arrival: AlertTriangle,
  shift_offer: Clock,
  timesheet_approved: FileText,
  timesheet_rejected: FileText,
  message: MessageSquare,
  booking: Clock,
  info: Bell,
};

const NotificationsPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadNotifications();

    const channel = supabase
      .channel("notif-page")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => setNotifications((prev) => [payload.new as Notification, ...prev])
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setNotifications((data as Notification[]) || []);
    setLoading(false);
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } else {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const clearAllRead = async () => {
    if (!user) return;
    const readIds = notifications.filter((n) => n.read).map((n) => n.id);
    if (readIds.length === 0) return;
    const { error } = await supabase.from("notifications").delete().in("id", readIds);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } else {
      setNotifications((prev) => prev.filter((n) => !n.read));
      toast({ title: "Gelesene Benachrichtigungen entfernt" });
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = notifications.filter((n) => n.read).length;

  if (loading) return <div className="text-muted-foreground p-4">{t("portal.common.loading")}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("portal.notifications.title")}</h1>
          <p className="text-muted-foreground text-sm">{unreadCount} {t("portal.common.unread")}</p>
        </div>
        <div className="flex gap-2">
          {readCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllRead} className="gap-1.5 text-muted-foreground">
              <Trash2 className="w-3.5 h-3.5" /> {t("portal.common.clearRead")}
            </Button>
          )}
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
              <Check className="w-3.5 h-3.5" /> {t("portal.common.markAllRead")}
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="ks-card p-8 text-center text-muted-foreground text-sm">
          <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
          {t("portal.notifications.empty")}
        </div>
      ) : (
        <div className="ks-card divide-y divide-border">
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type || "info"] || Bell;
            return (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={`flex items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors cursor-pointer group ${!n.read ? "bg-primary/5" : ""}`}
              >
                <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!n.read ? "bg-primary/15" : "bg-muted"}`}>
                  <Icon className={`w-4 h-4 ${!n.read ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${!n.read ? "font-bold" : "font-medium"}`}>{n.title}</p>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: de })}
                  </p>
                </div>
                <button
                  onClick={(e) => deleteNotification(n.id, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive shrink-0"
                  title={t("portal.notifications.deleteConfirm")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
