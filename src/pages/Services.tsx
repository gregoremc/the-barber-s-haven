import { useState, useEffect, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Scissors } from "lucide-react";
import MotionContainer from "@/components/MotionContainer";
import ConfirmDelete from "@/components/ConfirmDelete";
import { servicesStore } from "@/data/servicesStore";
import { Service } from "@/types/barbershop";
import { trashStore } from "@/data/trashStore";
import { registerRestoreHandler } from "@/pages/Trash";

const Services = () => {
  const services = useSyncExternalStore(servicesStore.subscribe, servicesStore.getServices);
  const [showForm, setShowForm] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: "", costPrice: "", price: "", duration: "", description: "" });
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  useEffect(() => {
    registerRestoreHandler("service", (item) => {
      servicesStore.addService(item.data as Service);
    });
  }, []);

  const openNew = () => {
    setEditService(null);
    setForm({ name: "", costPrice: "", price: "", duration: "", description: "" });
    setShowForm(true);
  };

  const openEdit = (s: Service) => {
    setEditService(s);
    setForm({ name: s.name, costPrice: String(s.costPrice), price: String(s.price), duration: String(s.duration), description: s.description });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    if (editService) {
      servicesStore.updateService(editService.id, {
        name: form.name,
        costPrice: Number(form.costPrice),
        price: Number(form.price),
        duration: Number(form.duration),
        description: form.description,
      });
    } else {
      servicesStore.addService({
        id: String(Date.now()),
        name: form.name,
        costPrice: Number(form.costPrice),
        price: Number(form.price),
        duration: Number(form.duration),
        description: form.description,
      });
    }
    setShowForm(false);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      trashStore.addItem({ type: "service", typeLabel: "Serviço", name: deleteTarget.name, data: deleteTarget });
      servicesStore.deleteService(deleteTarget.id);
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
          <h1 className="page-title">Serviços</h1>
          <p className="text-muted-foreground font-light mt-1">Controle financeiro de serviços</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={openNew}
          className="organic-btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Novo Serviço
        </motion.button>
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
            <h3 className="section-title">{editService ? "Editar Serviço" : "Novo Serviço"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="organic-input" />
              <input placeholder="Preço de Custo (R$)" type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} className="organic-input" />
              <input placeholder="Preço de Venda (R$)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="organic-input" />
              <input placeholder="Duração (min)" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="organic-input" />
              <input placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="organic-input" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} className="organic-btn-primary">Salvar</button>
              <button onClick={() => setShowForm(false)} className="organic-btn-secondary">Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((service, i) => (
          <MotionContainer key={service.id} delay={i * 0.05}>
            <div className="organic-card-hover space-y-3">
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-secondary">
                  <Scissors size={18} strokeWidth={1.5} className="text-muted-foreground" />
                </div>
                <div className="text-right">
                  <span className="text-xl font-medium">R$ {service.price.toFixed(2)}</span>
                  <p className="text-xs text-muted-foreground font-light">Custo: R$ {service.costPrice.toFixed(2)}</p>
                  <p className="text-xs text-success font-medium">Lucro: R$ {(service.price - service.costPrice).toFixed(2)}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium">{service.name}</h3>
                <p className="text-xs text-muted-foreground font-light mt-1">{service.description}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <span className="text-xs text-muted-foreground">{service.duration} min</span>
                <div className="flex gap-3">
                  <button onClick={() => openEdit(service)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Editar</button>
                  <button onClick={() => setDeleteTarget(service)} className="text-xs text-destructive hover:text-destructive/80 transition-colors">Excluir</button>
                </div>
              </div>
            </div>
          </MotionContainer>
        ))}
      </div>
    </div>
  );
};

export default Services;
