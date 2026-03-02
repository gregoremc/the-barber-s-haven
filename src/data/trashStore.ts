export interface TrashItem {
  id: string;
  type: "product" | "service" | "client" | "barber" | "supplier";
  typeLabel: string;
  name: string;
  data: any;
  deletedAt: string;
}

type Listener = () => void;

let trashItems: TrashItem[] = [];
const listeners = new Set<Listener>();

const notify = () => listeners.forEach((l) => l());

export const trashStore = {
  getItems: () => trashItems,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  addItem: (item: Omit<TrashItem, "id" | "deletedAt">) => {
    trashItems = [
      {
        ...item,
        id: String(Date.now()) + Math.random().toString(36).slice(2),
        deletedAt: new Date().toLocaleString("pt-BR"),
      },
      ...trashItems,
    ];
    notify();
  },
  removeItem: (id: string) => {
    trashItems = trashItems.filter((i) => i.id !== id);
    notify();
  },
  clear: () => {
    trashItems = [];
    notify();
  },
};
