import { useState, useEffect } from "react";
import { Package, Truck } from "lucide-react";
import { registerRestoreHandler } from "@/pages/Trash";
import { productsStore } from "@/data/productsStore";
import { suppliersStore } from "@/data/suppliersStore";
import { Product, Supplier } from "@/types/barbershop";
import ProductsTab from "@/components/ProductsTab";
import SuppliersTab from "@/components/SuppliersTab";

const Products = () => {
  const [activeTab, setActiveTab] = useState<"products" | "suppliers">("products");

  useEffect(() => {
    registerRestoreHandler("product", (item) => {
      productsStore.addProduct(item.data as Product);
    });
    registerRestoreHandler("supplier", (item) => {
      suppliersStore.addSupplier(item.data as Supplier);
    });
  }, []);

  const tabs = [
    { key: "products" as const, label: "Produtos", icon: Package },
    { key: "suppliers" as const, label: "Fornecedores", icon: Truck },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Fornecedores / Produtos</h1>
        <p className="text-muted-foreground font-light mt-1">Gerencie seus produtos e fornecedores</p>
      </div>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "products" ? (
        <ProductsTab onRegisterRestore={() => {}} />
      ) : (
        <SuppliersTab />
      )}
    </div>
  );
};

export default Products;
