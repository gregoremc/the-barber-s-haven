import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import MotionContainer from "@/components/MotionContainer";
import { mockBills } from "@/data/mockData";
import { Bill } from "@/types/barbershop";

const statusConfig = {
  pending: { label: "Pendente", className: "bg-warning/10 text-warning-foreground" },
  paid: { label: "Pago", className: "bg-success/10 text-success" },
  overdue: { label: "Vencida", className: "bg-destructive/10 text-destructive" },
};

const Bills = () => {
  const [bills, setBills] = useState<Bill[]>(mockBills);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", dueDate: "", category: "" });

  const totalPending = bills.filter((b) => b.status !== "paid").reduce((a, b) => a + b.amount, 0);
  const totalPaid = bills.filter((b) => b.status === "paid").reduce((a, b) => a + b.amount, 0);
  const overdueCount = bills.filter((b) => b.status === "overdue").length;

  const handleSave = () => {
    if (!form.description || !form.amount) return;
    setBills((prev) => [
      ...prev,
      { id: String(Date.now()), description: form.description, amount: Number(form.amount), dueDate: form.dueDate, category: form.category, status: "pending" },
    ]);
    setShowForm(false);
    setForm({ description: "", amount: "", dueDate: "", category: "" });
  };

  const markPaid = (id: string) => {
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, status: "paid" as const } : b)));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Contas a Pagar</h1>
          <p className="text-muted-foreground font-light mt-1">Controle de despesas e contas</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={() => setShowForm(!showForm)}
          className="organic-btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Nova Conta
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MotionContainer className="organic-card">
          <p className="stat-label">Total Pendente</p>
          <p className="stat-value mt-1 text-warning">R$ {totalPending.toLocaleString("pt-BR")}</p>
        </MotionContainer>
        <MotionContainer delay={0.05} className="organic-card">
          <p className="stat-label">Total Pago</p>
          <p className="stat-value mt-1 text-success">R$ {totalPaid.toLocaleString("pt-BR")}</p>
        </MotionContainer>
        <MotionContainer delay={0.1} className="organic-card">
          <div className="flex items-center gap-2">
            <p className="stat-label">Contas Vencidas</p>
            {overdueCount > 0 && <AlertCircle size={14} className="text-destructive" />}
          </div>
          <p className="stat-value mt-1 text-destructive">{overdueCount}</p>
        </MotionContainer>
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
            <h3 className="section-title">Nova Conta</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="organic-input" />
              <input placeholder="Valor (R$)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="organic-input" />
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="organic-input" />
              <input placeholder="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="organic-input" />
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
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Descrição</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Categoria</th>
                <th className="text-right p-4 text-xs text-muted-foreground font-medium">Valor</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Vencimento</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Status</th>
                <th className="text-right p-4 text-xs text-muted-foreground font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => {
                const status = statusConfig[bill.status];
                return (
                  <motion.tr
                    key={bill.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-border/30 last:border-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="p-4 text-sm font-medium">{bill.description}</td>
                    <td className="p-4 text-sm text-muted-foreground">{bill.category}</td>
                    <td className="p-4 text-sm text-right font-medium">R$ {bill.amount.toLocaleString("pt-BR")}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(bill.dueDate + "T12:00:00").toLocaleDateString("pt-BR")}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {bill.status !== "paid" && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => markPaid(bill.id)}
                          className="text-xs text-success flex items-center gap-1 ml-auto"
                        >
                          <CheckCircle2 size={14} /> Pagar
                        </motion.button>
                      )}
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

export default Bills;
