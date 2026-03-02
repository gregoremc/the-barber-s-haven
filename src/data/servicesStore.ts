import { Service } from "@/types/barbershop";
import { mockServices } from "@/data/mockData";

type Listener = () => void;

let services: Service[] = [...mockServices];
const listeners = new Set<Listener>();

const notify = () => listeners.forEach((l) => l());

export const servicesStore = {
  getServices: () => services,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  addService: (service: Service) => {
    services = [...services, service];
    notify();
  },
  updateService: (id: string, data: Partial<Service>) => {
    services = services.map((s) => (s.id === id ? { ...s, ...data } : s));
    notify();
  },
  deleteService: (id: string) => {
    services = services.filter((s) => s.id !== id);
    notify();
  },
};
