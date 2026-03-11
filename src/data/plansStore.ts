import { supabase } from "@/integrations/supabase/client";

export interface Plan {
  id: string;
  name: string;
  frequency: "monthly" | "biweekly";
  price: number;
  description: string;
  serviceIds: string[];
  active: boolean;
}

type Listener = () => void;

let plans: Plan[] = [];
let userId: string | null = null;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

const mapFromDb = (r: any): Plan => ({
  id: r.id,
  name: r.name,
  frequency: r.frequency || "monthly",
  price: Number(r.price) || 0,
  description: r.description || "",
  serviceIds: r.service_ids || [],
  active: r.active ?? true,
});

export const plansStore = {
  getPlans: () => plans,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setUserId: async (uid: string) => {
    userId = uid;
    const { data } = await supabase.from("plans").select("*").eq("user_id", uid).order("name");
    plans = (data || []).map(mapFromDb);
    notify();
  },
  addPlan: async (plan: Omit<Plan, "id">) => {
    if (!userId) return;
    const { data } = await supabase
      .from("plans")
      .insert({
        user_id: userId,
        name: plan.name,
        frequency: plan.frequency,
        price: plan.price,
        description: plan.description,
        service_ids: plan.serviceIds,
        active: plan.active,
      })
      .select()
      .single();
    if (data) {
      plans = [...plans, mapFromDb(data)];
      notify();
    }
  },
  updatePlan: async (id: string, updates: Partial<Plan>) => {
    plans = plans.map((p) => (p.id === id ? { ...p, ...updates } : p));
    notify();
    const dbData: any = {};
    if (updates.name !== undefined) dbData.name = updates.name;
    if (updates.frequency !== undefined) dbData.frequency = updates.frequency;
    if (updates.price !== undefined) dbData.price = updates.price;
    if (updates.description !== undefined) dbData.description = updates.description;
    if (updates.serviceIds !== undefined) dbData.service_ids = updates.serviceIds;
    if (updates.active !== undefined) dbData.active = updates.active;
    await supabase.from("plans").update(dbData).eq("id", id);
  },
  deletePlan: async (id: string) => {
    plans = plans.filter((p) => p.id !== id);
    notify();
    await supabase.from("plans").delete().eq("id", id);
  },
  clear: () => {
    plans = [];
    userId = null;
    notify();
  },
};
