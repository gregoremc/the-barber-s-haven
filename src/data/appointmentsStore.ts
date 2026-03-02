import { Appointment } from "@/types/barbershop";
import { mockAppointments } from "@/data/mockData";

type Listener = () => void;

let appointments: Appointment[] = [...mockAppointments];
const listeners = new Set<Listener>();

const notify = () => listeners.forEach((l) => l());

export const appointmentsStore = {
  getAppointments: () => appointments,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  addAppointment: (apt: Appointment) => {
    appointments = [...appointments, apt];
    notify();
  },
  updateStatus: (id: string, status: Appointment["status"]) => {
    appointments = appointments.map((a) => (a.id === id ? { ...a, status } : a));
    notify();
  },
  updateAppointment: (id: string, data: Partial<Appointment>) => {
    appointments = appointments.map((a) => (a.id === id ? { ...a, ...data } : a));
    notify();
  },
};
