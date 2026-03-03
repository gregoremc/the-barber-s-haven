import { useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, ShoppingCart, X } from "lucide-react";
import MotionContainer from "@/components/MotionContainer";
import ConfirmDelete from "@/components/ConfirmDelete";
import { productsStore } from "@/data/productsStore";
import { barbersStore } from "@/data/barbersStore";
import { paymentsStore } from "@/data/paymentsStore";
import { Product } from "@/types/barbershop";
import { trashStore } from "@/data/trashStore";
import { toast } from "@/hooks/use-toast";

interface ProductsTabProps {
  onRegisterRestore: (handler: (item: any) => void) => void;
}

const ProductsTab = ({ onRegisterRestore }: ProductsTabProps) => {
  const products = useSyncExternalStore(productsStore.subscribe, productsStore.getProducts);
  const barbers = useSyncExternalStore(barbersStore.subscribe, barbersStore.getBarbers);
  const activeBarbers = barbers.filter((b) => b.active !== false);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", category: "", costPrice: "", sellPrice: "", stock: "", commission: "" });
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // Sale modal state
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleProductId, setSaleProductId] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [saleSeller, setSaleSeller] = useState("establishment"); // "establishment" or barber id

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
    setForm({ name: "", category: "", costPrice: "", sellPrice: "", stock: "", commission: "" });
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
      commission: String(p.commission || 0),
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    const data = {
      name: form.name,
      category: form.category,
      costPrice: Number(form.costPrice),
      sellPrice: Number(form.sellPrice),
      stock: Number(form.stock),
      commission: Number(form.commission) || 0,
    };
    if (editProduct) {
      productsStore.updateProduct(editProduct.id, data);
    } else {
      productsStore.addProduct({ id: String(Date.now()), ...data });
    }
    setShowForm(false);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      trashStore.addItem({ type: "product", typeLabel: "Produto", name: deleteTarget.name, data: deleteTarget });
      productsStore.deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const openSaleModal = () => {
    setSaleProductId(products[0]?.id || "");
    setSaleQuantity("1");
    setSaleSeller("establishment");
    setShowSaleModal(true);
  };

  const handleSale = () => {
    const product = products.find((p) => p.id === saleProductId);
    if (!product) return;

    const qty = Number(saleQuantity);
    if (qty <= 0 || qty > product.stock) {
      toast({ title: "Quantidade inválida", description: `Estoque disponível: ${product.stock}`, variant: "destructive" });
      return;
    }

    // Deduct stock
    productsStore.updateProduct(product.id, { stock: product.stock - qty });

    const totalSaleValue = product.sellPrice * qty;

    // If barber sold, create commission payment
    if (saleSeller !== "establishment") {
      const barber = activeBarbers.find((b) => b.id === saleSeller);
      if (barber) {
        const commissionAmount = totalSaleValue * (product.commission / 100);
        paymentsStore.addPayment({
          id: String(Date.now()),
          barberId: barber.id,
          amount: commissionAmount,
          date: new Date().toISOString().split("T")[0],
          description: `Venda: ${qty}x ${product.name} (${product.commission}%)`,
          status: "pending",
        });
      }
    }

    toast({
      title: "Venda registrada!",
      description: `${qty}x ${product.name} — R$ ${totalSaleValue.toFixed(2)}`,
    });

    setShowSaleModal(false);
  };

  return (
    <div className="space-y-6">
      <ConfirmDelete
        open={!!deleteTarget}
        itemName={deleteTarget?.name}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex items-center justify-between">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={openSaleModal}
          className="organic-btn-secondary flex items-center gap-2"
        >
          <ShoppingCart size={16} />
          Registrar Venda
        </motion.button>
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

      {/* Product form */}
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
              <input placeholder="Comissão Vendedor (%)" type="number" value={form.commission} onChange={(e) => setForm({ ...form, commission: e.target.value })} className="organic-input" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} className="organic-btn-primary">Salvar</button>
              <button onClick={() => setShowForm(false)} className="organic-btn-secondary">Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sale modal */}
      <AnimatePresence>
        {showSaleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSaleModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="organic-card w-full max-w-md mx-4 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="section-title">Registrar Venda</h3>
                <button onClick={() => setShowSaleModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Produto</label>
                  <select
                    value={saleProductId}
                    onChange={(e) => setSaleProductId(e.target.value)}
                    className="organic-input"
                  >
                    {products.filter((p) => p.stock > 0).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (estoque: {p.stock}) — R$ {p.sellPrice.toFixed(2)} — {p.commission}% comissão
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    value={saleQuantity}
                    onChange={(e) => setSaleQuantity(e.target.value)}
                    className="organic-input"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Vendedor</label>
                  <select
                    value={saleSeller}
                    onChange={(e) => setSaleSeller(e.target.value)}
                    className="organic-input"
                  >
                    <option value="establishment">Estabelecimento</option>
                    {activeBarbers.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {saleSeller !== "establishment" && saleProductId && (
                  <div className="p-3 rounded-lg bg-secondary/50 text-sm">
                    {(() => {
                      const p = products.find((pr) => pr.id === saleProductId);
                      if (!p) return null;
                      const qty = Number(saleQuantity) || 0;
                      const total = p.sellPrice * qty;
                      const commission = total * (p.commission / 100);
                      return (
                        <>
                          <p>Total da venda: <strong>R$ {total.toFixed(2)}</strong></p>
                          <p className="text-muted-foreground">
                            Comissão ({p.commission}%): <strong className="text-foreground">R$ {commission.toFixed(2)}</strong>
                          </p>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={handleSale} className="organic-btn-primary flex-1">Confirmar Venda</button>
                <button onClick={() => setShowSaleModal(false)} className="organic-btn-secondary">Cancelar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products table */}
      <MotionContainer delay={0.15}>
        <div className="organic-card overflow-hidden !p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Produto</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Categoria</th>
                <th className="text-right p-4 text-xs text-muted-foreground font-medium">Custo</th>
                <th className="text-right p-4 text-xs text-muted-foreground font-medium">Venda</th>
                <th className="text-right p-4 text-xs text-muted-foreground font-medium">Comissão</th>
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
                  <td className="p-4 text-sm text-right">{product.commission}%</td>
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

export default ProductsTab;
