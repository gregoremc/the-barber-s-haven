import { Barber, BarberAttachment } from "@/types/barbershop";
import { supabase } from "@/integrations/supabase/client";

type Listener = () => void;

let barbers: Barber[] = [];
let userId: string | null = null;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

const mapFromDb = (row: any): Barber => ({
  id: row.id,
  name: row.name,
  cpfCnpj: row.cpf_cnpj || "",
  address: row.address || "",
  phone: row.phone,
  commission: Number(row.commission),
  paymentDay: row.payment_day || undefined,
  avatar: row.avatar_url || undefined,
  active: row.active,
  attachments: (row.barber_attachments || []).map((a: any) => ({
    id: a.id,
    name: a.name,
    url: a.url,
    date: new Date(a.created_at).toLocaleDateString("pt-BR"),
  })),
});

export const barbersStore = {
  getBarbers: () => barbers,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setUserId: async (uid: string) => {
    userId = uid;
    const { data } = await supabase.from("barbers").select("*, barber_attachments(*)").eq("user_id", uid).order("created_at");
    barbers = (data || []).map(mapFromDb);
    notify();
  },
  addBarber: async (barber: Omit<Barber, "id"> & { id?: string }) => {
    if (!userId) return;
    const { data, error } = await supabase.from("barbers").insert({
      user_id: userId,
      name: barber.name,
      cpf_cnpj: barber.cpfCnpj,
      address: barber.address,
      phone: barber.phone,
      commission: barber.commission,
      payment_day: barber.paymentDay || null,
    }).select("*, barber_attachments(*)").single();
    if (data) {
      barbers = [...barbers, mapFromDb(data)];
      notify();
    }
  },
  updateBarber: async (id: string, data: Partial<Barber>) => {
    barbers = barbers.map((b) => (b.id === id ? { ...b, ...data } : b));
    notify();
    const dbData: any = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.cpfCnpj !== undefined) dbData.cpf_cnpj = data.cpfCnpj;
    if (data.address !== undefined) dbData.address = data.address;
    if (data.phone !== undefined) dbData.phone = data.phone;
    if (data.commission !== undefined) dbData.commission = data.commission;
    if (data.paymentDay !== undefined) dbData.payment_day = data.paymentDay;
    if (data.avatar !== undefined) dbData.avatar_url = data.avatar;
    if (data.active !== undefined) dbData.active = data.active;
    await supabase.from("barbers").update(dbData).eq("id", id);
  },
  deleteBarber: async (id: string) => {
    barbers = barbers.filter((b) => b.id !== id);
    notify();
    await supabase.from("barbers").delete().eq("id", id);
  },
  addAttachment: async (barberId: string, attachments: BarberAttachment[]) => {
    if (!userId) return;
    for (const att of attachments) {
      const { data } = await supabase.from("barber_attachments").insert({
        barber_id: barberId,
        user_id: userId,
        name: att.name,
        url: att.url,
      }).select().single();
      if (data) {
        barbers = barbers.map((b) =>
          b.id === barberId
            ? { ...b, attachments: [...(b.attachments || []), { id: data.id, name: data.name, url: data.url, date: new Date(data.created_at).toLocaleDateString("pt-BR") }] }
            : b
        );
      }
    }
    notify();
  },
  removeAttachment: async (barberId: string, attachmentId: string) => {
    barbers = barbers.map((b) =>
      b.id === barberId
        ? { ...b, attachments: (b.attachments || []).filter((a) => a.id !== attachmentId) }
        : b
    );
    notify();
    await supabase.from("barber_attachments").delete().eq("id", attachmentId);
  },
  clear: () => { barbers = []; userId = null; notify(); },
};
