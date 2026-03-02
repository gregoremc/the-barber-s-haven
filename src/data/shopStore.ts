type Listener = () => void;

interface ShopSettings {
  name: string;
  subtitle: string;
  logoUrl: string | null;
}

let settings: ShopSettings = {
  name: "BarberShop",
  subtitle: "Gestão Inteligente",
  logoUrl: null,
};

const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

export const shopStore = {
  getSettings: () => settings,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  update: (data: Partial<ShopSettings>) => {
    settings = { ...settings, ...data };
    notify();
  },
};
