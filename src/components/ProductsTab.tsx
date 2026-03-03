import { useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, ShoppingCart, X, DollarSign, PackagePlus } from "lucide-react";
import MotionContainer from "@/components/MotionContainer";
import ConfirmDelete from "@/components/ConfirmDelete";
import { productsStore } from "@/data/productsStore";
import { suppliersStore } from "@/data/suppliersStore";
import { barbersStore } from "@/data/barbersStore";
import { paymentsStore } from "@/data/paymentsStore";
import { revenueStore } from "@/data/revenueStore";
import { Product } from "@/types/barbershop";
import { trashStore } from "@/data/trashStore";
import { toast } from "@/hooks/use-toast";

interface ProductsTabProps {
  onRegisterRestore: (handler: (item: any) => void) => void;
}

const ProductsTab = ({ onRegisterRestore }: ProductsTabProps) => {
  const products = useSyncExternalStore(productsStore.subscribe, productsStore.getProducts);
  const suppliers = useSyncExternalStore(suppliersStore.subscribe, suppliersStore.getSuppliers);
  const barbers = useSyncExternalStore(barbersStore.subscribe, barbersStore.getBarbers);
  const activeBarbers = barbers.filter((b) => b.active !== false);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", category: "", costPrice: "", sellPrice: "", stock: "", commission: "", supplierId: "" });
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // Sale modal
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleProductId, setSaleProductId] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [saleSeller, setSaleSeller] = useState("establishment");

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProduct, setPaymentProduct] = useState<Product | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  // Add stock modal
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [addStockProduct, setAddStockProduct] = useState<Product | null>(null);
  const [addStockQty, setAddStockQty] = useState("");

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalDebt = products.reduce((a, p) => a + p.supplierDebt, 0);

  const getSupplierName = (id: string) => suppliers.find((s) => s.id === id)?.name || "—";

  const openNew = () => {
    setEditProduct(null);
    setForm({ name: "", category: "", costPrice: "", sellPrice: "", stock: "", commission: "", supplierId: suppliers[0]?.id || "" });
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
      supplierId: p.supplierId,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name || !form.supplierId) {
      toast({ title: "Preencha o nome e selecione um fornecedor", variant: "destructive" });
      return;
    }
    const costPrice = Number(form.costPrice);
    const stock = Number(form.stock);
    const data = {
      name: form.name,
      category: form.category,
      costPrice,
      sellPrice: Number(form.sellPrice),
      stock,
      commission: Number(form.commission) || 0,
      supplierId: form.supplierId,
    };
    if (editProduct) {
      productsStore.updateProduct(editProduct.id, data);
    } else {
      productsStore.addProduct({
        id: String(Date.now()),
        ...data,
        supplierDebt: costPrice * stock,
      });
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

  // Sale
  const openSaleModal = () => {
    setSaleProductId(products.filter((p) => p.stock > 0)[0]?.id || "");
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
    productsStore.updateProduct(product.id, { stock: product.stock - qty });
    const totalSaleValue = product.sellPrice * qty;
    // Record revenue
    revenueStore.addEntry({
      id: String(Date.now()) + Math.random().toString(36).slice(2),
      type: "product",
      amount: totalSaleValue,
      date: new Date().toISOString().split("T")[0],
      description: `${qty}x ${product.name}`,
    });
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
    toast({ title: "Venda registrada!", description: `${qty}x ${product.name} — R$ ${totalSaleValue.toFixed(2)}` });
    setShowSaleModal(false);
  };

  // Supplier payment
  const openPayment = (p: Product) => {
    setPaymentProduct(p);
    setPaymentAmount("");
    setShowPaymentModal(true);
  };

  const handlePayment = () => {
    if (!paymentProduct) return;
    const amount = Number(paymentAmount);
    if (amount <= 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    if (amount > paymentProduct.supplierDebt) {
      toast({ title: "Valor excede o débito", description: `Máximo: R$ ${paymentProduct.supplierDebt.toFixed(2)}`, variant: "destructive" });
      return;
    }
    productsStore.paySupplierDebt(paymentProduct.id, amount);
    toast({ title: "Pagamento registrado!", description: `R$ ${amount.toFixed(2)} pago para ${getSupplierName(paymentProduct.supplierId)}` });
    setShowPaymentModal(false);
  };

  // Add stock
  const openAddStock = (p: Product) => {
    setAddStockProduct(p);
    setAddStockQty("");
    setShowAddStockModal(true);
  };

  const handleAddStock = () => {
    if (!addStockProduct) return;
    const qty = Number(addStockQty);
    if (qty <= 0) {
      toast({ title: "Quantidade inválida", variant: "destructive" });
      return;
    }
    productsStore.addStock(addStockProduct.id, qty);
    toast({ title: "Estoque adicionado!", description: `+${qty} un de ${addStockProduct.name}` });
    setShowAddStockModal(false);
  };

  return (
    <div className="space-y-6">
      <ConfirmDelete open={!!deleteTarget} itemName={deleteTarget?.name} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />

      <div className="flex items-center justify-between">
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} onClick={openSaleModal} className="organic-btn-secondary flex items-center gap-2">
          <ShoppingCart size={16} />
          Registrar Venda
        </motion.button>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} onClick={openNew} className="organic-btn-primary flex items-center gap-2">
          <Plus size={16} />
          Novo Produto
        </motion.button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <MotionContainer className="organic-card">
          <p className="stat-label">Débito Total com Fornecedores</p>
          <p className="stat-value mt-1 text-destructive">R$ {totalDebt.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </MotionContainer>
        <MotionContainer delay={0.05} className="organic-card">
          <p className="stat-label">Produtos Cadastrados</p>
          <p className="stat-value mt-1">{products.length}</p>
        </MotionContainer>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="organic-input pl-10" />
      </div>

      {/* Product form */}
      <AnimatePresence mode="wait">
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="organic-card space-y-4 overflow-hidden">
            <h3 className="section-title">{editProduct ? "Editar Produto" : "Novo Produto"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Fornecedor *</label>
                <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="organic-input">
                  <option value="">Selecione...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nome *</label>
                <input placeholder="Nome do produto" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="organic-input" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
                <input placeholder="Ex: Cabelo, Barba..." value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="organic-input" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Preço de Custo (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <input placeholder="0,00" type="text" inputMode="decimal" value={form.costPrice} onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                    setForm({ ...form, costPrice: val });
                  }} className="organic-input pl-10" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Preço de Venda (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <input placeholder="0,00" type="text" inputMode="decimal" value={form.sellPrice} onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                    setForm({ ...form, sellPrice: val });
                  }} className="organic-input pl-10" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Estoque Inicial</label>
                <input placeholder="0" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="organic-input" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Comissão Vendedor (%)</label>
                <div className="relative">
                  <input placeholder="0" type="text" inputMode="decimal" value={form.commission} onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                    setForm({ ...form, commission: val });
                  }} className="organic-input pr-8" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
              </div>
            </div>
            {!form.supplierId && suppliers.length === 0 && (
              <p className="text-xs text-destructive">Cadastre um fornecedor primeiro na aba "Fornecedores".</p>
            )}
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowSaleModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="organic-card w-full max-w-md mx-4 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="section-title">Registrar Venda</h3>
                <button onClick={() => setShowSaleModal(false)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Produto</label>
                  <select value={saleProductId} onChange={(e) => setSaleProductId(e.target.value)} className="organic-input">
                    {products.filter((p) => p.stock > 0).map((p) => (
                      <option key={p.id} value={p.id}>{p.name} (estoque: {p.stock}) — R$ {p.sellPrice.toFixed(2)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Quantidade</label>
                  <input type="number" min="1" value={saleQuantity} onChange={(e) => setSaleQuantity(e.target.value)} className="organic-input" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Vendedor</label>
                  <select value={saleSeller} onChange={(e) => setSaleSeller(e.target.value)} className="organic-input">
                    <option value="establishment">Estabelecimento</option>
                    {activeBarbers.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                {saleSeller !== "establishment" && saleProductId && (() => {
                  const p = products.find((pr) => pr.id === saleProductId);
                  if (!p) return null;
                  const qty = Number(saleQuantity) || 0;
                  const total = p.sellPrice * qty;
                  const commission = total * (p.commission / 100);
                  return (
                    <div className="p-3 rounded-lg bg-secondary/50 text-sm">
                      <p>Total da venda: <strong>R$ {total.toFixed(2)}</strong></p>
                      <p className="text-muted-foreground">Comissão ({p.commission}%): <strong className="text-foreground">R$ {commission.toFixed(2)}</strong></p>
                    </div>
                  );
                })()}
              </div>
              <div className="flex gap-3">
                <button onClick={handleSale} className="organic-btn-primary flex-1">Confirmar Venda</button>
                <button onClick={() => setShowSaleModal(false)} className="organic-btn-secondary">Cancelar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Supplier payment modal */}
      <AnimatePresence>
        {showPaymentModal && paymentProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="organic-card w-full max-w-md mx-4 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="section-title">Pagar Fornecedor</h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-secondary/50 text-sm space-y-1">
                  <p><strong>{paymentProduct.name}</strong></p>
                  <p className="text-muted-foreground">Fornecedor: {getSupplierName(paymentProduct.supplierId)}</p>
                  <p className="text-destructive font-medium">Débito restante: R$ {paymentProduct.supplierDebt.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Valor do Pagamento (máx R$ {paymentProduct.supplierDebt.toFixed(2)})</label>
                  <input
                    type="number"
                    min="0.01"
                    max={paymentProduct.supplierDebt}
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="organic-input"
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handlePayment} className="organic-btn-primary flex-1">Confirmar Pagamento</button>
                <button onClick={() => setShowPaymentModal(false)} className="organic-btn-secondary">Cancelar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add stock modal */}
      <AnimatePresence>
        {showAddStockModal && addStockProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAddStockModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="organic-card w-full max-w-md mx-4 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="section-title">Adicionar Estoque</h3>
                <button onClick={() => setShowAddStockModal(false)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-secondary/50 text-sm space-y-1">
                  <p><strong>{addStockProduct.name}</strong></p>
                  <p className="text-muted-foreground">Estoque atual: {addStockProduct.stock} un</p>
                  <p className="text-muted-foreground">Custo unitário: R$ {addStockProduct.costPrice.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Quantidade a adicionar</label>
                  <input type="number" min="1" value={addStockQty} onChange={(e) => setAddStockQty(e.target.value)} className="organic-input" placeholder="0" />
                </div>
                {Number(addStockQty) > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Débito adicional: <strong className="text-foreground">R$ {(addStockProduct.costPrice * Number(addStockQty)).toFixed(2)}</strong>
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={handleAddStock} className="organic-btn-primary flex-1">Confirmar</button>
                <button onClick={() => setShowAddStockModal(false)} className="organic-btn-secondary">Cancelar</button>
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
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Fornecedor</th>
                <th className="text-right p-4 text-xs text-muted-foreground font-medium">Custo Un.</th>
                <th className="text-right p-4 text-xs text-muted-foreground font-medium">Venda</th>
                <th className="text-right p-4 text-xs text-muted-foreground font-medium">Estoque</th>
                <th className="text-right p-4 text-xs text-muted-foreground font-medium">Débito Fornecedor</th>
                <th className="text-right p-4 text-xs text-muted-foreground font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <motion.tr key={product.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border/30 last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="p-4 text-sm font-medium">{product.name}</td>
                  <td className="p-4 text-sm text-muted-foreground">{getSupplierName(product.supplierId)}</td>
                  <td className="p-4 text-sm text-right">R$ {product.costPrice.toFixed(2)}</td>
                  <td className="p-4 text-sm text-right">R$ {product.sellPrice.toFixed(2)}</td>
                  <td className="p-4 text-sm text-right">{product.stock}</td>
                  <td className="p-4 text-right">
                    <span className={`text-sm font-medium ${product.supplierDebt > 0 ? "text-destructive" : "text-success"}`}>
                      R$ {product.supplierDebt.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    {product.supplierDebt > 0 && (
                      <button onClick={() => openPayment(product)} className="text-xs text-primary hover:text-primary/80 transition-colors" title="Pagar fornecedor">
                        <DollarSign size={14} className="inline" /> Pagar
                      </button>
                    )}
                    <button onClick={() => openAddStock(product)} className="text-xs text-muted-foreground hover:text-foreground transition-colors" title="Adicionar estoque">
                      <PackagePlus size={14} className="inline" /> Estoque
                    </button>
                    <button onClick={() => openEdit(product)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Editar</button>
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
