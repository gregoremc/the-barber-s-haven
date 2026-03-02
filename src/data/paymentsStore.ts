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
};
