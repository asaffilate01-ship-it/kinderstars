import { supabase } from "@/integrations/supabase/client";
import { Childminder, rowToChildminder } from "@/lib/childminder-data";
import { useQuery } from "@tanstack/react-query";

export function useChildminders() {
  return useQuery<Childminder[]>({
    queryKey: ["childminders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("childminders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToChildminder);
    },
  });
}
