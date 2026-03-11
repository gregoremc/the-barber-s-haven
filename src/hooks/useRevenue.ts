import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useRevenue = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["revenue_entries", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revenue_entries")
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useAddRevenue = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: { type: string; amount: number; date: string; description?: string }) => {
      const { data, error } = await supabase
        .from("revenue_entries")
        .insert({ ...entry, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["revenue_entries"] }),
  });
};
