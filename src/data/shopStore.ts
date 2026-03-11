import { supabase } from "@/integrations/supabase/client";

type Listener = () => void;

export interface WorkingDays {
  mon: boolean;
  tue: boolean;
  wed: boolean;
  thu: boolean;
  fri: boolean;
  sat: boolean;
  sun: boolean;
}

export interface ShopSettings {
  name: string;
  subtitle: string;
  logoUrl: string | null;
  openTime: string;
  closeTime: string;
  weekendOpenTime: string;
  weekendCloseTime: string;
  workingDays: WorkingDays;
}

let settings: ShopSettings = { name: "BarberShop", subtitle: "Gestão Inteligente", logoUrl: null };
let userId: string | null = null;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

export const shopStore = {
  getSettings: () => settings,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setUserId: async (uid: string) => {
    userId = uid;
    const { data } = await supabase.from("shop_settings").select("*").eq("user_id", uid).maybeSingle();
    if (data) {
      settings = { name: data.name, subtitle: data.subtitle || "", logoUrl: data.logo_url };
    }
    notify();
  },
  update: async (data: Partial<ShopSettings>) => {
    settings = { ...settings, ...data };
    notify();
    if (!userId) return;
    const dbData: any = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.subtitle !== undefined) dbData.subtitle = data.subtitle;
    if (data.logoUrl !== undefined) dbData.logo_url = data.logoUrl;
    const { data: existing } = await supabase.from("shop_settings").select("id").eq("user_id", userId).maybeSingle();
    if (existing) {
      await supabase.from("shop_settings").update(dbData).eq("user_id", userId);
    } else {
      await supabase.from("shop_settings").insert({ ...dbData, user_id: userId });
    }
  },
  clear: () => {
    settings = { name: "BarberShop", subtitle: "Gestão Inteligente", logoUrl: null };
    userId = null;
    notify();
  },
};
