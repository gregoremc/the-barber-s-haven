import { Product } from "@/types/barbershop";
import { mockProducts } from "@/data/mockData";

type Listener = () => void;

let products: Product[] = [...mockProducts];
const listeners = new Set<Listener>();

const notify = () => listeners.forEach((l) => l());

export const productsStore = {
  getProducts: () => products,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  addProduct: (product: Product) => {
    products = [...products, product];
    notify();
  },
  updateProduct: (id: string, data: Partial<Product>) => {
    products = products.map((p) => (p.id === id ? { ...p, ...data } : p));
    notify();
  },
  deleteProduct: (id: string) => {
    products = products.filter((p) => p.id !== id);
    notify();
  },
};
