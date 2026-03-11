import { BarberPayment } from "@/types/barbershop";
import { supabase } from "@/integrations/supabase/client";

type Listener = () => void;

let payments: BarberPayment[] = [];
let userId: string | null = null;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

const mapFromDb = (row: any): BarberPayment => ({
  id: row.id,
  barberId: row.barber_id,
  amount: Number(row.amount),
  date: row.date,
  description: row.description || "",
  status: row.status,
  type: row.type || "commission",
});

export const paymentsStore = {
  getPayments: () => payments,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setUserId: async (uid: string) => {
    userId = uid;
    const { data } = await supabase.from("barber_payments").select("*").eq("user_id", uid).order("date", { ascending: false });
    payments = (data || []).map(mapFromDb);
    notify();
  },
  addPayment: async (payment: Omit<BarberPayment, "id"> & { id?: string }) => {
    if (!userId) return;
    const { data } = await supabase.from("barber_payments").insert({
      user_id: userId,
      barber_id: payment.barberId,
      amount: payment.amount,
      date: payment.date,
      description: payment.description,
      status: payment.status || "pending",
      type: payment.type || "commission",
    }).select().single();
    if (data) {
      payments = [...payments, mapFromDb(data)];
      notify();
    }
  },
  markPaid: async (id: string) => {
    payments = payments.map((p) => (p.id === id ? { ...p, status: "paid" as const } : p));
    notify();
    await supabase.from("barber_payments").update({ status: "paid" }).eq("id", id);
  },
  getBarberBalance: (barberId: string, monthStr: string) => {
    const monthPayments = payments.filter(
      (p) => p.barberId === barberId && p.date?.substring(0, 7) === monthStr
    );
    const commissions = monthPayments
      .filter((p) => !p.type || p.type === "commission")
      .filter((p) => p.status === "pending")
      .reduce((a, p) => a + p.amount, 0);
    const disbursed = monthPayments
      .filter((p) => p.type === "payment" || p.type === "advance")
      .reduce((a, p) => a + p.amount, 0);
    return commissions - disbursed;
  },
  addDisbursement: async (barberId: string, amount: number, date: string, type: "payment" | "advance", description: string) => {
    if (!userId) return;
    const { data } = await supabase.from("barber_payments").insert({
      user_id: userId,
      barber_id: barberId,
      amount,
      date,
      description,
      status: "paid",
      type,
    }).select().single();
    if (data) {
      payments = [...payments, mapFromDb(data)];
      notify();
    }
  },
  removeDisbursement: async (id: string) => {
    payments = payments.filter((p) => p.id !== id);
    notify();
    await supabase.from("barber_payments").delete().eq("id", id);
  },
  removeCommissionsByDescription: async (description: string, barberId: string, date: string) => {
    const toRemove = payments.filter((p) => p.description === description && p.barberId === barberId && p.date === date);
    payments = payments.filter((p) => !(p.description === description && p.barberId === barberId && p.date === date));
    notify();
    for (const p of toRemove) {
      await supabase.from("barber_payments").delete().eq("id", p.id);
    }
  },
  clear: () => { payments = []; userId = null; notify(); },
};
