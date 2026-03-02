import { Supplier } from "@/types/barbershop";

type Listener = () => void;

let suppliers: Supplier[] = [];
const listeners = new Set<Listener>();

const notify = () => listeners.forEach((l) => l());

export const suppliersStore = {
  getSuppliers: () => suppliers,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  addSupplier: (supplier: Supplier) => {
    suppliers = [...suppliers, supplier];
    notify();
  },
  updateSupplier: (id: string, data: Partial<Supplier>) => {
    suppliers = suppliers.map((s) => (s.id === id ? { ...s, ...data } : s));
    notify();
  },
  deleteSupplier: (id: string) => {
    suppliers = suppliers.filter((s) => s.id !== id);
    notify();
  },
};
