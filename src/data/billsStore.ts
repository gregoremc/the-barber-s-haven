import { Bill, BillAttachment } from "@/types/barbershop";
import { mockBills } from "@/data/mockData";

type Listener = () => void;

let bills: Bill[] = [...mockBills];
const listeners = new Set<Listener>();

const notify = () => listeners.forEach((l) => l());

export const billsStore = {
  getBills: () => bills,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  addBill: (bill: Bill) => {
    bills = [...bills, bill];
    notify();
  },
  addBills: (newBills: Bill[]) => {
    bills = [...bills, ...newBills];
    notify();
  },
  updateBill: (id: string, data: Partial<Bill>) => {
    bills = bills.map((b) => (b.id === id ? { ...b, ...data } : b));
    notify();
  },
  markPaid: (id: string) => {
    bills = bills.map((b) => (b.id === id ? { ...b, status: "paid" as const } : b));
    notify();
  },
  anticipateGroup: (groupId: string) => {
    bills = bills.map((b) =>
      b.recurringGroupId === groupId && b.status !== "paid"
        ? { ...b, status: "paid" as const }
        : b
    );
    notify();
  },
  addAttachment: (billId: string, attachment: BillAttachment) => {
    bills = bills.map((b) =>
      b.id === billId ? { ...b, attachments: [...(b.attachments || []), attachment] } : b
    );
    notify();
  },
  removeAttachment: (billId: string, attachmentId: string) => {
    bills = bills.map((b) =>
      b.id === billId
        ? { ...b, attachments: (b.attachments || []).filter((a) => a.id !== attachmentId) }
        : b
    );
    notify();
  },
  removeBill: (id: string) => {
    bills = bills.filter((b) => b.id !== id);
    notify();
  },
  removeBillsByGroup: (groupId: string) => {
    bills = bills.filter((b) => b.recurringGroupId !== groupId);
    notify();
  },
};
