import { useState, useEffect, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Crown } from "lucide-react";
import MotionContainer from "@/components/MotionContainer";
import ConfirmDelete from "@/components/ConfirmDelete";
import { clientsStore, Client } from "@/data/clientsStore";
import { clientPlansStore } from "@/data/clientPlansStore";
import { plansStore } from "@/data/plansStore";
import { trashStore } from "@/data/trashStore";
import { registerRestoreHandler } from "@/pages/Trash";
import { Switch } from "@/components/ui/switch";

const DURATION_LABELS: Record<string, string> = { "1_year": "1 Ano", "2_years": "2 Anos", perpetual: "Perpétuo" };
const FREQ_LABELS: Record<string, string> = { monthly: "Mensal", biweekly: "Quinzenal" };

const Clients = () => {
  const clients = useSyncExternalStore(clientsStore.subscribe, clientsStore.getClients);
  const clientPlans = useSyncExternalStore(clientPlansStore.subscribe, clientPlansStore.getClientPlans);
  const plans = useSyncExternalStore(plansStore.subscribe, plansStore.getPlans);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  useEffect(() => {
    registerRestoreHandler("client", (item) => {
      clientsStore.addClient(item.data as Client);
    });
  }, []);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditClient(null);
    setForm({ name: "", phone: "", email: "", notes: "" });
    setShowForm(true);
  };

  const openEdit = (c: Client) => {
    setEditClient(c);
    setForm({ name: c.name, phone: c.phone, email: c.email, notes: c.notes });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    if (editClient) {
      clientsStore.updateClient(editClient.id, form);
    } else {
      clientsStore.addClient({ id: String(Date.now()), ...form });
    }
    setShowForm(false);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      trashStore.addItem({ type: "client", typeLabel: "Cliente", name: deleteTarget.name, data: deleteTarget });
      clientsStore.deleteClient(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const getClientActivePlans = (clientId: string) =>
    clientPlans.filter((cp) => cp.clientId === clientId);

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
          <h1 className="page-title">Clientes</h1>
          <p className="text-muted-foreground font-light mt-1">Cadastro e gestão de clientes</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={openNew}
          className="organic-btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Novo Cliente
        </motion.button>
      </div>

      <MotionContainer className="organic-card">
        <p className="stat-label">Total de Clientes</p>
        <p className="stat-value mt-1">{clients.length}</p>
      </MotionContainer>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar cliente..."
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
            <h3 className="section-title">{editClient ? "Editar Cliente" : "Novo Cliente"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="organic-input" />
              <input placeholder="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="organic-input" />
              <input placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="organic-input" />
              <input placeholder="Observações" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="organic-input" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} className="organic-btn-primary">Salvar</button>
              <button onClick={() => setShowForm(false)} className="organic-btn-secondary">Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MotionContainer delay={0.1}>
        <div className="organic-card overflow-hidden !p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Nome</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Telefone</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">E-mail</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Plano</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Observações</th>
                <th className="text-right p-4 text-xs text-muted-foreground font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => {
                const activePlans = getClientActivePlans(client.id);
                return (
                  <motion.tr
                    key={client.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-border/30 last:border-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="p-4 text-sm font-medium">{client.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{client.phone}</td>
                    <td className="p-4 text-sm text-muted-foreground">{client.email}</td>
                    <td className="p-4">
                      {activePlans.length > 0 ? (
                        <div className="space-y-1">
                          {activePlans.map((cp) => {
                            const plan = plans.find((p) => p.id === cp.planId);
                            if (!plan) return null;
                            return (
                              <div key={cp.id} className="flex items-center gap-2">
                                <Crown size={12} className={cp.active ? "text-primary" : "text-muted-foreground"} />
                                <span className={`text-xs font-medium ${cp.active ? "text-primary" : "text-muted-foreground line-through"}`}>
                                  {plan.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {FREQ_LABELS[plan.frequency]} · {DURATION_LABELS[cp.durationType]}
                                </span>
                                <Switch
                                  checked={cp.active}
                                  onCheckedChange={(checked) => clientPlansStore.toggleActive(cp.id, checked)}
                                  className="scale-75"
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{client.notes || "—"}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => openEdit(client)} className="text-xs text-muted-foreground hover:text-foreground mr-3 transition-colors">Editar</button>
                      <button onClick={() => setDeleteTarget(client)} className="text-xs text-destructive hover:text-destructive/80 transition-colors">Excluir</button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </MotionContainer>
    </div>
  );
};

export default Clients;
