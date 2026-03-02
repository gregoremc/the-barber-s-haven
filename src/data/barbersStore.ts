import { Barber, BarberAttachment } from "@/types/barbershop";
import { mockBarbers } from "@/data/mockData";

type Listener = () => void;

let barbers: Barber[] = [...mockBarbers];
const listeners = new Set<Listener>();

const notify = () => listeners.forEach((l) => l());

export const barbersStore = {
  getBarbers: () => barbers,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  addBarber: (barber: Barber) => {
    barbers = [...barbers, barber];
    notify();
  },
  updateBarber: (id: string, data: Partial<Barber>) => {
    barbers = barbers.map((b) => (b.id === id ? { ...b, ...data } : b));
    notify();
  },
  deleteBarber: (id: string) => {
    barbers = barbers.filter((b) => b.id !== id);
    notify();
  },
  addAttachment: (barberId: string, attachments: BarberAttachment[]) => {
    barbers = barbers.map((b) =>
      b.id === barberId
        ? { ...b, attachments: [...(b.attachments || []), ...attachments] }
        : b
    );
    notify();
  },
  removeAttachment: (barberId: string, attachmentId: string) => {
    barbers = barbers.map((b) =>
      b.id === barberId
        ? { ...b, attachments: (b.attachments || []).filter((a) => a.id !== attachmentId) }
        : b
    );
    notify();
  },
};
