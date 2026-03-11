import { supabase } from "@/integrations/supabase/client";

export interface TrashItem {
  id: string;
  type: "product" | "service" | "client" | "barber" | "supplier" | "bill" | "appointment";
  typeLabel: string;
  name: string;
  data: any;
  deletedAt: string;
}

type Listener = () => void;

let trashItems: TrashItem[] = [];
let userId: string | null = null;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

export const trashStore = {
  getItems: () => trashItems,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setUserId: async (uid: string) => {
    userId = uid;
    const { data } = await supabase.from("trash_items").select("*").eq("user_id", uid).order("created_at", { ascending: false });
    trashItems = (data || []).map((r: any) => ({
      id: r.id,
      type: r.item_type as any,
      typeLabel: r.deleted_data?.typeLabel || r.item_type,
      name: r.label,
      data: r.deleted_data?.data || r.deleted_data,
      deletedAt: new Date(r.created_at).toLocaleString("pt-BR"),
    }));
    notify();
  },
  addItem: async (item: Omit<TrashItem, "id" | "deletedAt">) => {
    if (!userId) return;
    const { data } = await supabase.from("trash_items").insert({
      user_id: userId,
      item_type: item.type,
      label: item.name,
      deleted_data: { typeLabel: item.typeLabel, data: item.data },
    }).select().single();
    if (data) {
      trashItems = [
        {
          id: data.id,
          type: data.item_type as any,
          typeLabel: item.typeLabel,
          name: data.label,
          data: item.data,
          deletedAt: new Date(data.created_at).toLocaleString("pt-BR"),
        },
        ...trashItems,
      ];
      notify();
    }
  },
  removeItem: async (id: string) => {
    trashItems = trashItems.filter((i) => i.id !== id);
    notify();
    await supabase.from("trash_items").delete().eq("id", id);
  },
  clear: async () => {
    trashItems = [];
    notify();
    if (userId) await supabase.from("trash_items").delete().eq("user_id", userId);
  },
  clearLocal: () => { trashItems = []; userId = null; notify(); },
};
