import { Service } from "@/types/barbershop";
import { supabase } from "@/integrations/supabase/client";

type Listener = () => void;

let services: Service[] = [];
let userId: string | null = null;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

const mapFromDb = (row: any): Service => ({
  id: row.id,
  name: row.name,
  costPrice: Number(row.cost_price),
  price: Number(row.price),
  duration: row.duration,
  description: row.description || "",
});

export const servicesStore = {
  getServices: () => services,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setUserId: async (uid: string) => {
    userId = uid;
    const { data } = await supabase.from("services").select("*").eq("user_id", uid).order("created_at");
    services = (data || []).map(mapFromDb);
    notify();
  },
  addService: async (service: Omit<Service, "id"> & { id?: string }) => {
    if (!userId) return;
    const { data } = await supabase.from("services").insert({
      user_id: userId,
      name: service.name,
      cost_price: service.costPrice,
      price: service.price,
      duration: service.duration,
      description: service.description,
    }).select().single();
    if (data) {
      services = [...services, mapFromDb(data)];
      notify();
    }
  },
  updateService: async (id: string, data: Partial<Service>) => {
    services = services.map((s) => (s.id === id ? { ...s, ...data } : s));
    notify();
    const dbData: any = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.costPrice !== undefined) dbData.cost_price = data.costPrice;
    if (data.price !== undefined) dbData.price = data.price;
    if (data.duration !== undefined) dbData.duration = data.duration;
    if (data.description !== undefined) dbData.description = data.description;
    await supabase.from("services").update(dbData).eq("id", id);
  },
  deleteService: async (id: string) => {
    services = services.filter((s) => s.id !== id);
    notify();
    await supabase.from("services").delete().eq("id", id);
  },
  clear: () => { services = []; userId = null; notify(); },
};
