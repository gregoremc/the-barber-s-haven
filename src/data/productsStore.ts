import { Product } from "@/types/barbershop";
import { supabase } from "@/integrations/supabase/client";

type Listener = () => void;

let products: Product[] = [];
let userId: string | null = null;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

const mapFromDb = (row: any): Product => ({
  id: row.id,
  name: row.name,
  category: row.category || "",
  costPrice: Number(row.cost_price),
  sellPrice: Number(row.sell_price),
  stock: row.stock,
  commission: Number(row.commission),
  supplierId: row.supplier_id || "",
  supplierDebt: Number(row.supplier_debt),
});

export const productsStore = {
  getProducts: () => products,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setUserId: async (uid: string) => {
    userId = uid;
    const { data } = await supabase.from("products").select("*").eq("user_id", uid).order("created_at");
    products = (data || []).map(mapFromDb);
    notify();
  },
  addProduct: async (product: Omit<Product, "id"> & { id?: string }) => {
    if (!userId) return;
    const { data } = await supabase.from("products").insert({
      user_id: userId,
      name: product.name,
      category: product.category,
      cost_price: product.costPrice,
      sell_price: product.sellPrice,
      stock: product.stock,
      commission: product.commission,
      supplier_id: product.supplierId || null,
      supplier_debt: product.supplierDebt,
    }).select().single();
    if (data) {
      products = [...products, mapFromDb(data)];
      notify();
    }
  },
  updateProduct: async (id: string, data: Partial<Product>) => {
    products = products.map((p) => (p.id === id ? { ...p, ...data } : p));
    notify();
    const dbData: any = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.category !== undefined) dbData.category = data.category;
    if (data.costPrice !== undefined) dbData.cost_price = data.costPrice;
    if (data.sellPrice !== undefined) dbData.sell_price = data.sellPrice;
    if (data.stock !== undefined) dbData.stock = data.stock;
    if (data.commission !== undefined) dbData.commission = data.commission;
    if (data.supplierId !== undefined) dbData.supplier_id = data.supplierId || null;
    if (data.supplierDebt !== undefined) dbData.supplier_debt = data.supplierDebt;
    await supabase.from("products").update(dbData).eq("id", id);
  },
  deleteProduct: async (id: string) => {
    products = products.filter((p) => p.id !== id);
    notify();
    await supabase.from("products").delete().eq("id", id);
  },
  addStock: async (id: string, quantity: number) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    const newStock = product.stock + quantity;
    const newDebt = product.supplierDebt + product.costPrice * quantity;
    products = products.map((p) => p.id === id ? { ...p, stock: newStock, supplierDebt: newDebt } : p);
    notify();
    await supabase.from("products").update({ stock: newStock, supplier_debt: newDebt }).eq("id", id);
  },
  paySupplierDebt: async (id: string, amount: number) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    const payment = Math.min(amount, product.supplierDebt);
    const newDebt = product.supplierDebt - payment;
    products = products.map((p) => p.id === id ? { ...p, supplierDebt: newDebt } : p);
    notify();
    await supabase.from("products").update({ supplier_debt: newDebt }).eq("id", id);
  },
  clear: () => { products = []; userId = null; notify(); },
};
