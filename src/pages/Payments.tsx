import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, CheckCircle2 } from "lucide-react";
import MotionContainer from "@/components/MotionContainer";
import { mockBarberPayments, mockBarbers } from "@/data/mockData";
import { BarberPayment } from "@/types/barbershop";

const Payments = () => {
  const [payments, setPayments] = useState<BarberPayment[]>(mockBarberPayments);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ barberId: "", amount: "", date: "", description: "" });

  const totalPaid = payments.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const totalPending = payments.filter((p) => p.status === "pending").reduce((a, p) => a + p.amount, 0);

  const handleSave = () => {
    if (!form.barberId || !form.amount) return;
    setPayments((prev) => [
      ...prev,
      { id: String(Date.now()), barberId: form.barberId, amount: Number(form.amount), date: form.date, description: form.description, status: "pending" },
    ]);
    setShowForm(false);
    setForm({ barberId: "", amount: "", date: "", description: "" });
  };

  const markPaid = (id: string) => {
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status: "paid" as const } : p)));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Pagamentos a Barbeiros</h1>
          <p className="text-muted-foreground font-light mt-1">Controle de comissões e pagamentos</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={() => setShowForm(!showForm)}
          className="organic-btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Novo Pagamento
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MotionContainer className="organic-card">
          <p className="stat-label">Total Pago</p>
          <p className="stat-value mt-1 text-success">R$ {totalPaid.toLocaleString("pt-BR")}</p>
        </MotionContainer>
        <MotionContainer delay={0.05} className="organic-card">
          <p className="stat-label">Pendente</p>
          <p className="stat-value mt-1 text-warning">R$ {totalPending.toLocaleString("pt-BR")}</p>
        </MotionContainer>
        <MotionContainer delay={0.1} className="organic-card">
          <p className="stat-label">Barbeiros Ativos</p>
          <p className="stat-value mt-1">{mockBarbers.length}</p>
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
            <h3 className="section-title">Novo Pagamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={form.barberId} onChange={(e) => setForm({ ...form, barberId: e.target.value })} className="organic-input">
                <option value="">Selecione o Barbeiro</option>
                {mockBarbers.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <input placeholder="Valor (R$)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="organic-input" />
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="organic-input" />
              <input placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="organic-input" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} className="organic-btn-primary">Salvar</button>
              <button onClick={() => setShowForm(false)} className="organic-btn-secondary">Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {mockBarbers.map((barber, i) => {
        const barberPayments = payments.filter((p) => p.barberId === barber.id);
        if (barberPayments.length === 0) return null;
        return (
          <MotionContainer key={barber.id} delay={i * 0.05}>
            <div className="organic-card space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Users size={18} strokeWidth={1.5} className="text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">{barber.name}</h3>
                  <p className="text-xs text-muted-foreground font-light">Comissão: {barber.commission}%</p>
                </div>
              </div>
              <div className="space-y-2">
                {barberPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{payment.description}</p>
                      <p className="text-xs text-muted-foreground font-light">
                        {new Date(payment.date + "T12:00:00").toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">R$ {payment.amount.toLocaleString("pt-BR")}</span>
                      {payment.status === "pending" ? (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => markPaid(payment.id)}
                          className="organic-btn-secondary !py-1.5 !px-4 text-xs"
                        >
                          Marcar Pago
                        </motion.button>
                      ) : (
                        <span className="text-xs text-success flex items-center gap-1">
                          <CheckCircle2 size={14} /> Pago
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </MotionContainer>
        );
      })}
    </div>
  );
};

export default Payments;
