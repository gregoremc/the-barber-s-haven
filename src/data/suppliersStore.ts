import { Supplier } from "@/types/barbershop";
import { supabase } from "@/integrations/supabase/client";

type Listener = () => void;

let suppliers: Supplier[] = [];
let userId: string | null = null;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

const mapFromDb = (row: any): Supplier => ({
  id: row.id,
  name: row.name,
  cpfCnpj: row.cpf_cnpj || "",
  address: row.address || "",
  pixKey: row.pix_key || "",
  phone: row.phone || "",
  website: row.website || "",
  customFields: (row.supplier_custom_fields || []).map((f: any) => ({ id: f.id, label: f.label, value: f.value || "" })),
  attachments: (row.supplier_attachments || []).map((a: any) => ({ id: a.id, name: a.name, url: a.url, date: a.date || "" })),
});

export const suppliersStore = {
  getSuppliers: () => suppliers,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setUserId: async (uid: string) => {
    userId = uid;
    const { data } = await supabase.from("suppliers").select("*, supplier_custom_fields(*), supplier_attachments(*)").eq("user_id", uid).order("created_at");
    suppliers = (data || []).map(mapFromDb);
    notify();
  },
  addSupplier: async (supplier: Omit<Supplier, "id"> & { id?: string }) => {
    if (!userId) return;
    const { data } = await supabase.from("suppliers").insert({
      user_id: userId,
      name: supplier.name,
      cpf_cnpj: supplier.cpfCnpj,
      address: supplier.address,
      pix_key: supplier.pixKey,
      phone: supplier.phone,
      website: supplier.website,
    }).select("*, supplier_custom_fields(*), supplier_attachments(*)").single();
    if (data) {
      suppliers = [...suppliers, mapFromDb(data)];
      notify();
    }
  },
  updateSupplier: async (id: string, data: Partial<Supplier>) => {
    suppliers = suppliers.map((s) => (s.id === id ? { ...s, ...data } : s));
    notify();
    const dbData: any = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.cpfCnpj !== undefined) dbData.cpf_cnpj = data.cpfCnpj;
    if (data.address !== undefined) dbData.address = data.address;
    if (data.pixKey !== undefined) dbData.pix_key = data.pixKey;
    if (data.phone !== undefined) dbData.phone = data.phone;
    if (data.website !== undefined) dbData.website = data.website;
    await supabase.from("suppliers").update(dbData).eq("id", id);
  },
  deleteSupplier: async (id: string) => {
    suppliers = suppliers.filter((s) => s.id !== id);
    notify();
    await supabase.from("suppliers").delete().eq("id", id);
  },
  clear: () => { suppliers = []; userId = null; notify(); },
};
