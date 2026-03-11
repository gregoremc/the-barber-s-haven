export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
}

import { supabase } from "@/integrations/supabase/client";

type Listener = () => void;

let clients: Client[] = [];
let userId: string | null = null;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

export const clientsStore = {
  getClients: () => clients,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setUserId: async (uid: string) => {
    userId = uid;
    const { data } = await supabase.from("clients").select("*").eq("user_id", uid).order("name");
    clients = (data || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      phone: r.phone || "",
      email: "",
      notes: "",
    }));
    notify();
  },
  addClient: async (client: Omit<Client, "id"> & { id?: string }) => {
    if (!userId) return;
    const { data } = await supabase.from("clients").insert({
      user_id: userId,
      name: client.name,
      phone: client.phone,
    }).select().single();
    if (data) {
      clients = [...clients, { id: data.id, name: data.name, phone: data.phone || "", email: "", notes: "" }];
      notify();
    }
  },
  updateClient: async (id: string, data: Partial<Client>) => {
    clients = clients.map((c) => (c.id === id ? { ...c, ...data } : c));
    notify();
    const dbData: any = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.phone !== undefined) dbData.phone = data.phone;
    await supabase.from("clients").update(dbData).eq("id", id);
  },
  deleteClient: async (id: string) => {
    clients = clients.filter((c) => c.id !== id);
    notify();
    await supabase.from("clients").delete().eq("id", id);
  },
  clear: () => { clients = []; userId = null; notify(); },
};
