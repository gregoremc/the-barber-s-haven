import { useState, useRef, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Trash2, Paperclip, X, PlusCircle } from "lucide-react";
import MotionContainer from "@/components/MotionContainer";
import ConfirmDelete from "@/components/ConfirmDelete";
import { suppliersStore } from "@/data/suppliersStore";
import { Supplier, SupplierCustomField, SupplierAttachment } from "@/types/barbershop";
import { trashStore } from "@/data/trashStore";

const SuppliersTab = () => {
  const suppliers = useSyncExternalStore(suppliersStore.subscribe, suppliersStore.getSuppliers);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: "", cpfCnpj: "", address: "", pixKey: "", phone: "", website: "" });
  const [customFields, setCustomFields] = useState<SupplierCustomField[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.cpfCnpj.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditSupplier(null);
    setForm({ name: "", cpfCnpj: "", address: "", pixKey: "", phone: "", website: "" });
    setCustomFields([]);
    setShowForm(true);
    setViewSupplier(null);
  };

  const openEdit = (s: Supplier) => {
    setEditSupplier(s);
    setForm({
      name: s.name,
      cpfCnpj: s.cpfCnpj,
      address: s.address,
      pixKey: s.pixKey,
      phone: s.phone,
      website: s.website,
    });
    setCustomFields(s.customFields || []);
    setShowForm(true);
    setViewSupplier(null);
  };

  const handleSave = () => {
    if (!form.name) return;
    const data = {
      name: form.name,
      cpfCnpj: form.cpfCnpj,
      address: form.address,
      pixKey: form.pixKey,
      phone: form.phone,
      website: form.website,
      customFields: customFields.filter((f) => f.label.trim()),
    };
    if (editSupplier) {
      suppliersStore.updateSupplier(editSupplier.id, data);
    } else {
      suppliersStore.addSupplier({
        id: String(Date.now()),
        ...data,
        attachments: [],
      });
    }
    setShowForm(false);
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { id: String(Date.now()), label: "", value: "" }]);
  };

  const updateCustomField = (id: string, key: "label" | "value", val: string) => {
    setCustomFields(customFields.map((f) => (f.id === id ? { ...f, [key]: val } : f)));
  };

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter((f) => f.id !== id));
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      trashStore.addItem({ type: "supplier", typeLabel: "Fornecedor", name: deleteTarget.name, data: deleteTarget });
      suppliersStore.deleteSupplier(deleteTarget.id);
      setDeleteTarget(null);
      if (viewSupplier?.id === deleteTarget.id) setViewSupplier(null);
    }
  };

  const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!viewSupplier || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const url = URL.createObjectURL(file);
    const attachment: SupplierAttachment = {
      id: String(Date.now()),
      name: file.name,
      url,
      date: new Date().toISOString().slice(0, 10),
    };
    const updated = [...(viewSupplier.attachments || []), attachment];
    suppliersStore.updateSupplier(viewSupplier.id, { attachments: updated });
    setViewSupplier({ ...viewSupplier, attachments: updated });
  };

  const removeAttachment = (attId: string) => {
    if (!viewSupplier) return;
    const updated = (viewSupplier.attachments || []).filter((a) => a.id !== attId);
    suppliersStore.updateSupplier(viewSupplier.id, { attachments: updated });
    setViewSupplier({ ...viewSupplier, attachments: updated });
  };

  return (
    <div className="space-y-6">
      <ConfirmDelete
        open={!!deleteTarget}
        itemName={deleteTarget?.name}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleAttachment} />

      <div className="flex items-center justify-between">
        <div />
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={openNew}
          className="organic-btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Novo Fornecedor
        </motion.button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar fornecedor..."
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
            <h3 className="section-title">{editSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="organic-input" />
              <input placeholder="CPF/CNPJ" value={form.cpfCnpj} onChange={(e) => setForm({ ...form, cpfCnpj: e.target.value })} className="organic-input" />
              <input placeholder="Endereço" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="organic-input" />
              <input placeholder="Chave PIX" value={form.pixKey} onChange={(e) => setForm({ ...form, pixKey: e.target.value })} className="organic-input" />
              <input placeholder="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="organic-input" />
              <input placeholder="Site" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="organic-input" />
            </div>

            {customFields.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Campos Personalizados</p>
                {customFields.map((field) => (
                  <div key={field.id} className="flex gap-2 items-center">
                    <input
                      placeholder="Nome do campo"
                      value={field.label}
                      onChange={(e) => updateCustomField(field.id, "label", e.target.value)}
                      className="organic-input flex-1"
                    />
                    <input
                      placeholder="Valor"
                      value={field.value}
                      onChange={(e) => updateCustomField(field.id, "value", e.target.value)}
                      className="organic-input flex-1"
                    />
                    <button onClick={() => removeCustomField(field.id)} className="text-destructive hover:text-destructive/80 p-2">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button onClick={addCustomField} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              <PlusCircle size={14} />
              Adicionar campo personalizado
            </button>

            <div className="flex gap-3">
              <button onClick={handleSave} className="organic-btn-primary">Salvar</button>
              <button onClick={() => setShowForm(false)} className="organic-btn-secondary">Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Supplier detail view */}
      <AnimatePresence mode="wait">
        {viewSupplier && !showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="organic-card space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h3 className="section-title">{viewSupplier.name}</h3>
              <button onClick={() => setViewSupplier(null)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {viewSupplier.cpfCnpj && <div><span className="text-muted-foreground">CPF/CNPJ:</span> {viewSupplier.cpfCnpj}</div>}
              {viewSupplier.address && <div><span className="text-muted-foreground">Endereço:</span> {viewSupplier.address}</div>}
              {viewSupplier.pixKey && <div><span className="text-muted-foreground">Chave PIX:</span> {viewSupplier.pixKey}</div>}
              {viewSupplier.phone && <div><span className="text-muted-foreground">Telefone:</span> {viewSupplier.phone}</div>}
              {viewSupplier.website && <div><span className="text-muted-foreground">Site:</span> {viewSupplier.website}</div>}
              {viewSupplier.customFields?.map((f) => (
                <div key={f.id}><span className="text-muted-foreground">{f.label}:</span> {f.value}</div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">Documentos Anexados</p>
                <button onClick={() => fileInputRef.current?.click()} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                  <Paperclip size={12} />
                  Anexar
                </button>
              </div>
              {(viewSupplier.attachments || []).length === 0 && (
                <p className="text-xs text-muted-foreground/60">Nenhum documento anexado</p>
              )}
              {(viewSupplier.attachments || []).map((att) => (
                <div key={att.id} className="flex items-center justify-between text-sm bg-secondary/30 rounded-lg px-3 py-2">
                  <a href={att.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{att.name}</a>
                  <button onClick={() => removeAttachment(att.id)} className="text-destructive hover:text-destructive/80 ml-2">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MotionContainer delay={0.15}>
        <div className="organic-card overflow-hidden !p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Nome</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">CPF/CNPJ</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Telefone</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-medium hidden md:table-cell">Chave PIX</th>
                <th className="text-right p-4 text-xs text-muted-foreground font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((supplier) => (
                <motion.tr
                  key={supplier.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-border/30 last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer"
                  onClick={() => { setViewSupplier(supplier); setShowForm(false); }}
                >
                  <td className="p-4 text-sm font-medium">{supplier.name}</td>
                  <td className="p-4 text-sm text-muted-foreground">{supplier.cpfCnpj}</td>
                  <td className="p-4 text-sm text-muted-foreground">{supplier.phone}</td>
                  <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">{supplier.pixKey}</td>
                  <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openEdit(supplier)} className="text-xs text-muted-foreground hover:text-foreground mr-3 transition-colors">Editar</button>
                    <button onClick={() => setDeleteTarget(supplier)} className="text-xs text-destructive hover:text-destructive/80 transition-colors">Excluir</button>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">Nenhum fornecedor cadastrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </MotionContainer>
    </div>
  );
};

export default SuppliersTab;
