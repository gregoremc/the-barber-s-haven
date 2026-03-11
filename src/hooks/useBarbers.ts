import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useBarbers = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["barbers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbers")
        .select("*, barber_attachments(*)")
        .eq("user_id", user!.id)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useAddBarber = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (barber: { name: string; cpf_cnpj?: string; address?: string; phone: string; commission?: number; payment_day?: number }) => {
      const { data, error } = await supabase
        .from("barbers")
        .insert({ ...barber, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["barbers"] }),
  });
};

export const useUpdateBarber = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("barbers").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["barbers"] }),
  });
};
