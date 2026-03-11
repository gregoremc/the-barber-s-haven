import { useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Tag, Trash2, Edit2, UserPlus, Check, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MotionContainer from "@/components/MotionContainer";
import ConfirmDelete from "@/components/ConfirmDelete";
import { plansStore, Plan } from "@/data/plansStore";
import { clientPlansStore } from "@/data/clientPlansStore";
import { clientsStore } from "@/data/clientsStore";
import { barbersStore } from "@/data/barbersStore";
import { servicesStore } from "@/data/servicesStore";
import { trashStore } from "@/data/trashStore";

const FREQ_LABELS: Record<string, string> = { monthly: "Mensal", biweekly: "Quinzenal" };
const DAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DURATION_LABELS: Record<string, string> = { "1_year": "1 Ano", "2_years": "2 Anos", perpetual: "Perpétuo" };

const Plans = () => {
  const plans = useSyncExternalStore(plansStore.subscribe, plansStore.getPlans);
  const clients = useSyncExternalStore(clientsStore.subscribe, clientsStore.getClients);
  const barbers = useSyncExternalStore(barbersStore.subscribe, barbersStore.getBarbers);
  const services = useSyncExternalStore(servicesStore.subscribe, servicesStore.getServices);
  const clientPlans = useSyncExternalStore(clientPlansStore.subscribe, clientPlansStore.getClientPlans);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState({ name: "", frequency: "monthly" as "monthly" | "biweekly", price: "", description: "", serviceIds: [] as string[] });
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);

  // Assign modal
  const [assignPlan, setAssignPlan] = useState<Plan | null>(null);
  const [assignForm, setAssignForm] = useState({ clientId: "", barberId: "", dayOfWeek: 1, time: "09:00", durationType: "perpetual" as "1_year" | "2_years" | "perpetual", startDate: new Date().toISOString().split("T")[0] });

  const filtered = plans.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const activeBarbers = barbers.filter((b: any) => b.active !== false);

  const openNew = () => {
    setEditPlan(null);
    setForm({ name: "", frequency: "monthly", price: "", description: "", serviceIds: [] });
    setShowForm(true);
  };

  const openEdit = (p: Plan) => {
    setEditPlan(p);
    setForm({ name: p.name, frequency: p.frequency, price: String(p.price), description: p.description, serviceIds: [...p.serviceIds] });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    const data = { name: form.name, frequency: form.frequency, price: Number(form.price) || 0, description: form.description, serviceIds: form.serviceIds, active: true };
    if (editPlan) {
      plansStore.updatePlan(editPlan.id, data);
    } else {
      plansStore.addPlan(data);
    }
    setShowForm(false);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      trashStore.addItem({ type: "plan", typeLabel: "Plano", name: deleteTarget.name, data: deleteTarget });
      plansStore.deletePlan(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const toggleService = (sid: string) => {
    setForm((f) => ({
      ...f,
      serviceIds: f.serviceIds.includes(sid) ? f.serviceIds.filter((s) => s !== sid) : [...f.serviceIds, sid],
    }));
  };

  const openAssign = (plan: Plan) => {
    setAssignPlan(plan);
    setAssignForm({ clientId: "", barberId: "", dayOfWeek: 1, time: "09:00", durationType: "perpetual", startDate: new Date().toISOString().split("T")[0] });
  };

  const handleAssign = () => {
    if (!assignPlan || !assignForm.clientId) return;
    clientPlansStore.addClientPlan({
      planId: assignPlan.id,
      clientId: assignForm.clientId,
      barberId: assignForm.barberId || null,
      dayOfWeek: assignForm.dayOfWeek,
      time: assignForm.time,
      durationType: assignForm.durationType,
      startDate: assignForm.startDate,
      active: true,
    });
    setAssignPlan(null);
  };

  const getServiceNames = (ids: string[]) =>
    ids.map((id) => services.find((s: any) => s.id === id)?.name).filter(Boolean).join(", ");

  const getPlanClients = (planId: string) =>
    clientPlans.filter((cp) => cp.planId === planId && cp.active);

  return (
    <div className="space-y-8">
      <ConfirmDelete open={!!deleteTarget} itemName={deleteTarget?.name} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Planos</h1>
          <p className="text-muted-foreground font-light mt-1">Gerencie planos e promoções recorrentes</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openNew} className="organic-btn-primary flex items-center gap-2">
          <Plus size={16} /> Novo Plano
        </motion.button>
      </div>

      <MotionContainer className="organic-card">
        <p className="stat-label">Total de Planos</p>
        <p className="stat-value mt-1">{plans.length}</p>
      </MotionContainer>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Buscar plano..." value={search} onChange={(e) => setSearch(e.target.value)} className="organic-input pl-10" />
      </div>

      {/* Plan form */}
      <AnimatePresence mode="wait">
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="organic-card space-y-4 overflow-hidden">
            <h3 className="section-title">{editPlan ? "Editar Plano" : "Novo Plano"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input placeholder="Nome do plano" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="organic-input" />
              <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as any })} className="organic-input">
                <option value="monthly">Mensal</option>
                <option value="biweekly">Quinzenal</option>
              </select>
              <input placeholder="Preço (R$)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="organic-input" />
            </div>
            <textarea placeholder="Descrição do plano e itens inclusos..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="organic-input min-h-[80px]" />

            {services.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Serviços inclusos (opcional):</p>
                <div className="flex flex-wrap gap-2">
                  {services.map((s: any) => (
                    <button key={s.id} type="button" onClick={() => toggleService(s.id)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${form.serviceIds.includes(s.id) ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-secondary-foreground border-border/50 hover:bg-secondary/80"}`}>
                      {form.serviceIds.includes(s.id) && <Check size={12} className="inline mr-1" />}
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleSave} className="organic-btn-primary">Salvar</button>
              <button onClick={() => setShowForm(false)} className="organic-btn-secondary">Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign modal */}
      <AnimatePresence mode="wait">
        {assignPlan && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="organic-card space-y-4 overflow-hidden">
            <h3 className="section-title">Atribuir Plano: {assignPlan.name}</h3>
            {assignPlan.description && <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-xl">{assignPlan.description}</p>}
            {assignPlan.serviceIds.length > 0 && <p className="text-xs text-muted-foreground">Serviços: {getServiceNames(assignPlan.serviceIds)}</p>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select value={assignForm.clientId} onChange={(e) => setAssignForm({ ...assignForm, clientId: e.target.value })} className="organic-input">
                <option value="">Selecione o cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select value={assignForm.barberId} onChange={(e) => setAssignForm({ ...assignForm, barberId: e.target.value })} className="organic-input">
                <option value="">Barbeiro (opcional)</option>
                {activeBarbers.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <select value={assignForm.dayOfWeek} onChange={(e) => setAssignForm({ ...assignForm, dayOfWeek: Number(e.target.value) })} className="organic-input">
                {DAY_LABELS.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
              <input type="time" value={assignForm.time} onChange={(e) => setAssignForm({ ...assignForm, time: e.target.value })} className="organic-input" />
              <input type="date" value={assignForm.startDate} onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })} className="organic-input" />
              <select value={assignForm.durationType} onChange={(e) => setAssignForm({ ...assignForm, durationType: e.target.value as any })} className="organic-input">
                <option value="1_year">1 Ano</option>
                <option value="2_years">2 Anos</option>
                <option value="perpetual">Perpétuo</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button onClick={handleAssign} disabled={!assignForm.clientId} className="organic-btn-primary disabled:opacity-50">Atribuir</button>
              <button onClick={() => setAssignPlan(null)} className="organic-btn-secondary">Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plans list */}
      <MotionContainer delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((plan) => {
            const planClients = getPlanClients(plan.id);
            return (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="organic-card space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{plan.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{FREQ_LABELS[plan.frequency]}</span>
                      <span className="text-sm font-medium text-primary">R$ {plan.price.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openAssign(plan)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Atribuir a cliente">
                      <UserPlus size={14} className="text-muted-foreground" />
                    </button>
                    <button onClick={() => openEdit(plan)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                      <Edit2 size={14} className="text-muted-foreground" />
                    </button>
                    <button onClick={() => setDeleteTarget(plan)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                      <Trash2 size={14} className="text-destructive" />
                    </button>
                  </div>
                </div>

                {plan.description && <p className="text-xs text-muted-foreground line-clamp-3">{plan.description}</p>}

                {plan.serviceIds.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {plan.serviceIds.map((sid) => {
                      const svc = services.find((s: any) => s.id === sid);
                      return svc ? <span key={sid} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{svc.name}</span> : null;
                    })}
                  </div>
                )}

                {planClients.length > 0 && (
                  <div className="border-t border-border/30 pt-2">
                    <button
                      onClick={() => setViewClientsPlanId(plan.id)}
                      className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
                    >
                      <Users size={12} />
                      {planClients.length} cliente(s) ativo(s)
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </MotionContainer>
    </div>
  );
};

export default Plans;
