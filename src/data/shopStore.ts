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

const defaultWorkingDays: WorkingDays = { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false };
const defaultSettings: ShopSettings = {
  name: "BarberShop",
  subtitle: "Gestão Inteligente",
  logoUrl: null,
  openTime: "08:00",
  closeTime: "20:00",
  weekendOpenTime: "08:00",
  weekendCloseTime: "18:00",
  workingDays: { ...defaultWorkingDays },
};

let settings: ShopSettings = { ...defaultSettings };
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
      settings = {
        name: data.name,
        subtitle: data.subtitle || "",
        logoUrl: data.logo_url,
        openTime: (data as any).open_time || "08:00",
        closeTime: (data as any).close_time || "20:00",
        weekendOpenTime: (data as any).weekend_open_time || "08:00",
        weekendCloseTime: (data as any).weekend_close_time || "18:00",
        workingDays: (data as any).working_days || { ...defaultWorkingDays },
      };
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
    if (data.openTime !== undefined) dbData.open_time = data.openTime;
    if (data.closeTime !== undefined) dbData.close_time = data.closeTime;
    if (data.weekendOpenTime !== undefined) dbData.weekend_open_time = data.weekendOpenTime;
    if (data.weekendCloseTime !== undefined) dbData.weekend_close_time = data.weekendCloseTime;
    if (data.workingDays !== undefined) dbData.working_days = data.workingDays;
    const { data: existing } = await supabase.from("shop_settings").select("id").eq("user_id", userId).maybeSingle();
    if (existing) {
      await supabase.from("shop_settings").update(dbData).eq("user_id", userId);
    } else {
      await supabase.from("shop_settings").insert({ ...dbData, user_id: userId });
    }
  },
  clear: () => {
    settings = { ...defaultSettings, workingDays: { ...defaultWorkingDays } };
    userId = null;
    notify();
  },
};
