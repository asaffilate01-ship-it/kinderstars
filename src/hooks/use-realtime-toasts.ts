import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { playNotificationSound } from "@/lib/notification-sound";
import { requestNotificationPermission, showBrowserNotification } from "@/lib/browser-notifications";

/**
 * Global realtime listener that shows toast popups for:
 * - New notifications
 * - New messages (when not on the messages page)
 * - Booking status changes
 */
export function useRealtimeToasts() {
  const { user } = useAuth();
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!user || subscribedRef.current) return;
    subscribedRef.current = true;

    // Request browser notification permission on first mount
    requestNotificationPermission();

    /** Helper: show toast + browser notification + sound */
    const notify = (title: string, description?: string) => {
      toast({ title, description });
      playNotificationSound();
      showBrowserNotification(title.replace(/^[\p{Emoji}\u200d\ufe0f]+\s*/u, ""), description);
    };

    const channel = supabase
      .channel("global-realtime-toasts")
      // New notifications → toast
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as { title: string; body?: string; type?: string };
          notify(`🔔 ${n.title}`, n.body || undefined);
        }
      )
      // New incoming messages → notify (only if sender is not current user)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` },
        () => {
          // Only notify if not already on messages page
          if (!window.location.pathname.includes("/messages")) {
            notify("💬 New message", "You have a new message. Tap to view.");
          }
        }
      )
      // Booking status changes → toast for both parent and childminder
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings" },
        (payload) => {
          const booking = payload.new as { parent_id: string; childminder_id: string; status: string };
          const oldBooking = payload.old as { status?: string };

          // Only notify if status actually changed
          if (oldBooking.status === booking.status) return;

          if (booking.parent_id === user.id) {
            const statusLabels: Record<string, string> = {
              accepted: "✅ Your booking has been accepted!",
              declined: "❌ Your booking was declined.",
              cancelled: "🚫 Booking cancelled.",
            };
            const msg = statusLabels[booking.status];
            if (msg) notify(msg);
          }

          if (booking.childminder_id === user.id) {
            if (booking.status === "pending") {
              notify("📅 New booking request", "A parent has requested a booking.");
            }
            if (booking.status === "cancelled") {
              notify("🚫 Booking cancelled by parent");
            }
          }
        }
      )
      // New booking created → notify childminder
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings" },
        (payload) => {
          const booking = payload.new as { childminder_id: string; parent_id: string };
          if (booking.childminder_id === user.id) {
            notify("📅 New booking request!", "A parent has requested a session with you.");
          }
        }
      )
      .subscribe();

    return () => {
      subscribedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [user]);
}
