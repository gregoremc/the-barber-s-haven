import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useBills = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bills", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bills")
        .select("*, bill_attachments(*)")
        .eq("user_id", user!.id)
        .order("due_date");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useAddBill = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bill: { description: string; amount: number; due_date: string; category?: string; status?: string; is_recurring?: boolean; recurring_months?: number; recurring_group_id?: string; installment_number?: number }) => {
      const { data, error } = await supabase
        .from("bills")
        .insert({ ...bill, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bills"] }),
  });
};

export const useUpdateBill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("bills").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bills"] }),
  });
};

export const useDeleteBill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bills").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bills"] }),
  });
};

export const useDeleteBillsByGroup = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase.from("bills").delete().eq("recurring_group_id", groupId).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bills"] }),
  });
};
