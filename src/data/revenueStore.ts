import { supabase } from "@/integrations/supabase/client";

type Listener = () => void;

export interface RevenueEntry {
  id: string;
  type: "service" | "product";
  amount: number;
  date: string;
  description: string;
}

let entries: RevenueEntry[] = [];
let userId: string | null = null;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

export const revenueStore = {
  getEntries: () => entries,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setUserId: async (uid: string) => {
    userId = uid;
    const { data } = await supabase.from("revenue_entries").select("*").eq("user_id", uid).order("date", { ascending: false });
    entries = (data || []).map((r: any) => ({
      id: r.id,
      type: r.type,
      amount: Number(r.amount),
      date: r.date,
      description: r.description || "",
    }));
    notify();
  },
  addEntry: async (entry: Omit<RevenueEntry, "id"> & { id?: string }) => {
    if (!userId) return;
    const { data } = await supabase.from("revenue_entries").insert({
      user_id: userId,
      type: entry.type,
      amount: entry.amount,
      date: entry.date,
      description: entry.description,
    }).select().single();
    if (data) {
      entries = [{ id: data.id, type: data.type as any, amount: Number(data.amount), date: data.date, description: data.description || "" }, ...entries];
      notify();
    }
  },
  getMonthRevenue: (year: number, month: number) => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    return entries.filter((e) => e.date.startsWith(prefix)).reduce((acc, e) => acc + e.amount, 0);
  },
  clear: () => { entries = []; userId = null; notify(); },
};
