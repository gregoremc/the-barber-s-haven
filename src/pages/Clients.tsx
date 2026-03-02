import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Users } from "lucide-react";
import MotionContainer from "@/components/MotionContainer";

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
}

const mockClients: Client[] = [
  { id: "1", name: "João Pedro", phone: "(11) 99999-0001", email: "joao@email.com", notes: "Cliente frequente" },
  { id: "2", name: "Marcos Oliveira", phone: "(11) 99999-0002", email: "marcos@email.com", notes: "" },
  { id: "3", name: "Lucas Mendes", phone: "(11) 99999-0003", email: "lucas@email.com", notes: "Prefere corte degradê" },
  { id: "4", name: "Felipe Costa", phone: "(11) 99999-0004", email: "felipe@email.com", notes: "" },
  { id: "5", name: "Bruno Alves", phone: "(11) 99999-0005", email: "bruno@email.com", notes: "Alérgico a alguns produtos" },
];

const Clients = () => {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });

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
      setClients((prev) =>
        prev.map((c) =>
          c.id === editClient.id
            ? { ...c, name: form.name, phone: form.phone, email: form.email, notes: form.notes }
            : c
        )
      );
    } else {
      setClients((prev) => [
        ...prev,
        { id: String(Date.now()), name: form.name, phone: form.phone, email: form.email, notes: form.notes },
      ]);
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-8">
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
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Observações</th>
                <th className="text-right p-4 text-xs text-muted-foreground font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <motion.tr
                  key={client.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-border/30 last:border-0 hover:bg-secondary/30 transition-colors"
                >
                  <td className="p-4 text-sm font-medium">{client.name}</td>
                  <td className="p-4 text-sm text-muted-foreground">{client.phone}</td>
                  <td className="p-4 text-sm text-muted-foreground">{client.email}</td>
                  <td className="p-4 text-sm text-muted-foreground">{client.notes || "—"}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => openEdit(client)} className="text-xs text-muted-foreground hover:text-foreground mr-3 transition-colors">Editar</button>
                    <button onClick={() => handleDelete(client.id)} className="text-xs text-destructive hover:text-destructive/80 transition-colors">Excluir</button>
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

export default Clients;
