type Listener = () => void;

export interface RevenueEntry {
  id: string;
  type: "service" | "product";
  amount: number; // gross value
  date: string; // YYYY-MM-DD
  description: string;
}

let entries: RevenueEntry[] = [];
const listeners = new Set<Listener>();

const notify = () => listeners.forEach((l) => l());

export const revenueStore = {
  getEntries: () => entries,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  addEntry: (entry: RevenueEntry) => {
    entries = [...entries, entry];
    notify();
  },
  getMonthRevenue: (year: number, month: number) => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    return entries
      .filter((e) => e.date.startsWith(prefix))
      .reduce((acc, e) => acc + e.amount, 0);
  },
};
