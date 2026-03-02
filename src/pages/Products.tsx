import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Package } from "lucide-react";
import MotionContainer from "@/components/MotionContainer";
import ConfirmDelete from "@/components/ConfirmDelete";
import { mockProducts } from "@/data/mockData";
import { Product } from "@/types/barbershop";
import { trashStore } from "@/data/trashStore";
import { registerRestoreHandler } from "@/pages/Trash";

const Products = () => {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", category: "", costPrice: "", sellPrice: "", stock: "" });
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  useEffect(() => {
    registerRestoreHandler("product", (item) => {
      setProducts((prev) => [...prev, item.data as Product]);
    });
  }, []);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalCost = products.reduce((a, p) => a + p.costPrice * p.stock, 0);
  const totalSell = products.reduce((a, p) => a + p.sellPrice * p.stock, 0);
  const profit = totalSell - totalCost;

  const openNew = () => {
    setEditProduct(null);
    setForm({ name: "", category: "", costPrice: "", sellPrice: "", stock: "" });
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      name: p.name,
      category: p.category,
      costPrice: String(p.costPrice),
      sellPrice: String(p.sellPrice),
      stock: String(p.stock),
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    if (editProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editProduct.id
            ? { ...p, name: form.name, category: form.category, costPrice: Number(form.costPrice), sellPrice: Number(form.sellPrice), stock: Number(form.stock) }
            : p
        )
      );
    } else {
      setProducts((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          name: form.name,
          category: form.category,
          costPrice: Number(form.costPrice),
          sellPrice: Number(form.sellPrice),
          stock: Number(form.stock),
        },
      ]);
    }
    setShowForm(false);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      trashStore.addItem({ type: "product", typeLabel: "Produto", name: deleteTarget.name, data: deleteTarget });
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-8">
      <ConfirmDelete
        open={!!deleteTarget}
        itemName={deleteTarget?.name}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Produtos</h1>
          <p className="text-muted-foreground font-light mt-1">Controle financeiro de produtos</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={openNew}
          className="organic-btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Novo Produto
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MotionContainer className="organic-card">
          <p className="stat-label">Custo Total Estoque</p>
          <p className="stat-value mt-1">R$ {totalCost.toLocaleString("pt-BR")}</p>
        </MotionContainer>
        <MotionContainer delay={0.05} className="organic-card">
          <p className="stat-label">Valor de Venda</p>
          <p className="stat-value mt-1">R$ {totalSell.toLocaleString("pt-BR")}</p>
        </MotionContainer>
        <MotionContainer delay={0.1} className="organic-card">
          <p className="stat-label">Lucro Potencial</p>
          <p className="stat-value mt-1 text-success">R$ {profit.toLocaleString("pt-BR")}</p>
        </MotionContainer>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="organic-input pl-10"
        />
      </div>

      <AnimatePresence mode="wait">
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="organic-card space-y-4 overflow-hidden"
          >
            <h3 className="section-title">{editProduct ? "Editar Produto" : "Novo Produto"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="organic-input" />
              <input placeholder="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="organic-input" />
              <input placeholder="Preço de Custo" type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} className="organic-input" />
              <input placeholder="Preço de Venda" type="number" value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: e.target.value })} className="organic-input" />
              <input placeholder="Estoque" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="organic-input" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} className="organic-btn-primary">Salvar</button>
              <button onClick={() => setShowForm(false)} className="organic-btn-secondary">Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MotionContainer delay={0.15}>
        <div className="organic-card overflow-hidden !p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Produto</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Categoria</th>
                <th className="text-right p-4 text-xs text-muted-foreground font-medium">Custo</th>
                <th className="text-right p-4 text-xs text-muted-foreground font-medium">Venda</th>
                <th className="text-right p-4 text-xs text-muted-foreground font-medium">Estoque</th>
                <th className="text-right p-4 text-xs text-muted-foreground font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-border/30 last:border-0 hover:bg-secondary/30 transition-colors"
                >
                  <td className="p-4 text-sm font-medium">{product.name}</td>
                  <td className="p-4 text-sm text-muted-foreground">{product.category}</td>
                  <td className="p-4 text-sm text-right">R$ {product.costPrice.toFixed(2)}</td>
                  <td className="p-4 text-sm text-right">R$ {product.sellPrice.toFixed(2)}</td>
                  <td className="p-4 text-sm text-right">{product.stock}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => openEdit(product)} className="text-xs text-muted-foreground hover:text-foreground mr-3 transition-colors">Editar</button>
                    <button onClick={() => setDeleteTarget(product)} className="text-xs text-destructive hover:text-destructive/80 transition-colors">Excluir</button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </MotionContainer>
    </div>
  );
};

export default Products;
