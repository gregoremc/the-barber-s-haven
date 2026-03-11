import { Bill, BillAttachment } from "@/types/barbershop";
import { supabase } from "@/integrations/supabase/client";

type Listener = () => void;

let bills: Bill[] = [];
let userId: string | null = null;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

const mapFromDb = (row: any): Bill => ({
  id: row.id,
  description: row.description,
  amount: Number(row.amount),
  dueDate: row.due_date,
  category: row.category || "",
  status: row.status,
  isRecurring: row.is_recurring || false,
  recurringMonths: row.recurring_months || undefined,
  recurringGroupId: row.recurring_group_id || undefined,
  installmentNumber: row.installment_number || undefined,
  attachments: (row.bill_attachments || []).map((a: any) => ({
    id: a.id,
    name: a.name,
    url: a.url,
    date: a.date || "",
  })),
});

export const billsStore = {
  getBills: () => bills,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setUserId: async (uid: string) => {
    userId = uid;
    const { data } = await supabase.from("bills").select("*, bill_attachments(*)").eq("user_id", uid).order("due_date");
    bills = (data || []).map(mapFromDb);
    notify();
  },
  addBill: async (bill: Omit<Bill, "id"> & { id?: string }) => {
    if (!userId) return;
    const { data } = await supabase.from("bills").insert({
      user_id: userId,
      description: bill.description,
      amount: bill.amount,
      due_date: bill.dueDate,
      category: bill.category,
      status: bill.status || "pending",
      is_recurring: bill.isRecurring || false,
      recurring_months: bill.recurringMonths || null,
      recurring_group_id: bill.recurringGroupId || null,
      installment_number: bill.installmentNumber || null,
    }).select("*, bill_attachments(*)").single();
    if (data) {
      bills = [...bills, mapFromDb(data)];
      notify();
    }
  },
  addBills: async (newBills: (Omit<Bill, "id"> & { id?: string })[]) => {
    if (!userId) return;
    const inserts = newBills.map((b) => ({
      user_id: userId!,
      description: b.description,
      amount: b.amount,
      due_date: b.dueDate,
      category: b.category,
      status: b.status || "pending",
      is_recurring: b.isRecurring || false,
      recurring_months: b.recurringMonths || null,
      recurring_group_id: b.recurringGroupId || null,
      installment_number: b.installmentNumber || null,
    }));
    const { data } = await supabase.from("bills").insert(inserts).select("*, bill_attachments(*)");
    if (data) {
      bills = [...bills, ...data.map(mapFromDb)];
      notify();
    }
  },
  updateBill: async (id: string, data: Partial<Bill>) => {
    bills = bills.map((b) => (b.id === id ? { ...b, ...data } : b));
    notify();
    const dbData: any = {};
    if (data.description !== undefined) dbData.description = data.description;
    if (data.amount !== undefined) dbData.amount = data.amount;
    if (data.dueDate !== undefined) dbData.due_date = data.dueDate;
    if (data.category !== undefined) dbData.category = data.category;
    if (data.status !== undefined) dbData.status = data.status;
    await supabase.from("bills").update(dbData).eq("id", id);
  },
  markPaid: async (id: string) => {
    bills = bills.map((b) => (b.id === id ? { ...b, status: "paid" as const } : b));
    notify();
    await supabase.from("bills").update({ status: "paid" }).eq("id", id);
  },
  anticipateGroup: async (groupId: string) => {
    bills = bills.map((b) =>
      b.recurringGroupId === groupId && b.status !== "paid" ? { ...b, status: "paid" as const } : b
    );
    notify();
    await supabase.from("bills").update({ status: "paid" }).eq("recurring_group_id", groupId).neq("status", "paid");
  },
  addAttachment: async (billId: string, attachment: BillAttachment) => {
    if (!userId) return;
    const { data } = await supabase.from("bill_attachments").insert({
      bill_id: billId,
      user_id: userId,
      name: attachment.name,
      url: attachment.url,
      date: attachment.date,
    }).select().single();
    if (data) {
      bills = bills.map((b) =>
        b.id === billId ? { ...b, attachments: [...(b.attachments || []), { id: data.id, name: data.name, url: data.url, date: data.date || "" }] } : b
      );
      notify();
    }
  },
  removeAttachment: async (billId: string, attachmentId: string) => {
    bills = bills.map((b) =>
      b.id === billId ? { ...b, attachments: (b.attachments || []).filter((a) => a.id !== attachmentId) } : b
    );
    notify();
    await supabase.from("bill_attachments").delete().eq("id", attachmentId);
  },
  removeBill: async (id: string) => {
    bills = bills.filter((b) => b.id !== id);
    notify();
    await supabase.from("bills").delete().eq("id", id);
  },
  removeBillsByGroup: async (groupId: string) => {
    bills = bills.filter((b) => b.recurringGroupId !== groupId);
    notify();
    if (userId) await supabase.from("bills").delete().eq("recurring_group_id", groupId).eq("user_id", userId);
  },
  clear: () => { bills = []; userId = null; notify(); },
};
