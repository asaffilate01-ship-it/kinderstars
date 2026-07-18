import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useUnreadMessages() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchCount = async () => {
      const { count: c } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("read", false);
      setCount(c ?? 0);
    };

    fetchCount();

    const channel = supabase
      .channel("msg-unread-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` },
        () => fetchCount()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return count;
}
