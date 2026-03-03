import { BarberPayment } from "@/types/barbershop";
import { mockBarberPayments } from "@/data/mockData";

type Listener = () => void;

let payments: BarberPayment[] = [...mockBarberPayments];
const listeners = new Set<Listener>();

const notify = () => listeners.forEach((l) => l());

export const paymentsStore = {
  getPayments: () => payments,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  addPayment: (payment: BarberPayment) => {
    payments = [...payments, payment];
    notify();
  },
  markPaid: (id: string) => {
    payments = payments.map((p) => (p.id === id ? { ...p, status: "paid" as const } : p));
    notify();
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
    return Math.max(0, commissions - disbursed);
  },
  addDisbursement: (barberId: string, amount: number, date: string, type: "payment" | "advance", description: string) => {
    payments = [
      ...payments,
      {
        id: String(Date.now()),
        barberId,
        amount,
        date,
        description,
        status: "paid" as const,
        type,
      },
    ];
    notify();
  },
};
