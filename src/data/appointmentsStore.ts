import { Appointment } from "@/types/barbershop";
import { supabase } from "@/integrations/supabase/client";

type Listener = () => void;

let appointments: Appointment[] = [];
let userId: string | null = null;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

const mapFromDb = (row: any): Appointment => ({
  id: row.id,
  barberId: row.barber_id,
  clientName: row.client_name,
  serviceId: (row.service_ids || [])[0] || "",
  serviceIds: row.service_ids || [],
  date: row.date,
  time: row.time,
  status: row.status,
  planId: row.plan_id || null,
});

export const appointmentsStore = {
  getAppointments: () => appointments,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setUserId: async (uid: string) => {
    userId = uid;
    const { data } = await supabase.from("appointments").select("*").eq("user_id", uid).order("date", { ascending: false });
    appointments = (data || []).map(mapFromDb);
    notify();
  },
  addAppointment: async (apt: Omit<Appointment, "id"> & { id?: string }) => {
    if (!userId) return;
    const serviceIds = apt.serviceIds?.length ? apt.serviceIds : apt.serviceId ? [apt.serviceId] : [];
    const { data, error } = await supabase.from("appointments").insert({
      user_id: userId,
      barber_id: apt.barberId,
      client_name: apt.clientName,
      service_ids: serviceIds,
      date: apt.date,
      time: apt.time,
      status: apt.status || "scheduled",
    }).select().single();
    if (data) {
      appointments = [...appointments, mapFromDb(data)];
      notify();
    }
  },
  updateStatus: async (id: string, status: Appointment["status"]) => {
    appointments = appointments.map((a) => (a.id === id ? { ...a, status } : a));
    notify();
    await supabase.from("appointments").update({ status }).eq("id", id);
  },
  updateAppointment: async (id: string, data: Partial<Appointment>) => {
    appointments = appointments.map((a) => (a.id === id ? { ...a, ...data } : a));
    notify();
    const dbData: any = {};
    if (data.serviceIds) dbData.service_ids = data.serviceIds;
    if (data.clientName) dbData.client_name = data.clientName;
    if (data.barberId) dbData.barber_id = data.barberId;
    if (data.time) dbData.time = data.time;
    if (data.date) dbData.date = data.date;
    if (data.status) dbData.status = data.status;
    await supabase.from("appointments").update(dbData).eq("id", id);
  },
  deleteAppointment: async (id: string) => {
    appointments = appointments.filter((a) => a.id !== id);
    notify();
    await supabase.from("appointments").delete().eq("id", id);
  },
  restoreAppointment: async (apt: Appointment) => {
    if (!userId) return;
    const serviceIds = apt.serviceIds?.length ? apt.serviceIds : apt.serviceId ? [apt.serviceId] : [];
    const { data } = await supabase.from("appointments").insert({
      user_id: userId,
      barber_id: apt.barberId,
      client_name: apt.clientName,
      service_ids: serviceIds,
      date: apt.date,
      time: apt.time,
      status: apt.status || "scheduled",
    }).select().single();
    if (data) {
      appointments = [...appointments, mapFromDb(data)];
      notify();
    }
  },
  clear: () => { appointments = []; userId = null; notify(); },
};
