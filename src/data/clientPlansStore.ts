import { supabase } from "@/integrations/supabase/client";

export interface ClientPlan {
  id: string;
  planId: string;
  clientId: string;
  barberId: string | null;
  dayOfWeek: number; // 0=Sunday..6=Saturday
  time: string;
  durationType: "1_year" | "2_years" | "perpetual";
  startDate: string;
  active: boolean;
}

type Listener = () => void;

let clientPlans: ClientPlan[] = [];
let userId: string | null = null;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

const mapFromDb = (r: any): ClientPlan => ({
  id: r.id,
  planId: r.plan_id,
  clientId: r.client_id,
  barberId: r.barber_id || null,
  dayOfWeek: r.day_of_week ?? 1,
  time: r.time || "09:00",
  durationType: r.duration_type || "perpetual",
  startDate: r.start_date,
  active: r.active ?? true,
});

export const clientPlansStore = {
  getClientPlans: () => clientPlans,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setUserId: async (uid: string) => {
    userId = uid;
    const { data } = await supabase.from("client_plans").select("*").eq("user_id", uid);
    clientPlans = (data || []).map(mapFromDb);
    notify();
  },
  addClientPlan: async (cp: Omit<ClientPlan, "id">) => {
    if (!userId) return;
    const { data } = await supabase
      .from("client_plans")
      .insert({
        user_id: userId,
        plan_id: cp.planId,
        client_id: cp.clientId,
        barber_id: cp.barberId,
        day_of_week: cp.dayOfWeek,
        time: cp.time,
        duration_type: cp.durationType,
        start_date: cp.startDate,
        active: cp.active,
      })
      .select()
      .single();
    if (data) {
      clientPlans = [...clientPlans, mapFromDb(data)];
      notify();
    }
  },
  toggleActive: async (id: string, active: boolean) => {
    clientPlans = clientPlans.map((cp) => (cp.id === id ? { ...cp, active } : cp));
    notify();
    await supabase.from("client_plans").update({ active }).eq("id", id);
  },
  deleteClientPlan: async (id: string) => {
    clientPlans = clientPlans.filter((cp) => cp.id !== id);
    notify();
    await supabase.from("client_plans").delete().eq("id", id);
  },
  clear: () => {
    clientPlans = [];
    userId = null;
    notify();
  },
};
