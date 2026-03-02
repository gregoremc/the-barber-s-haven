import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Clock, CheckCircle2, XCircle } from "lucide-react";
import MotionContainer from "@/components/MotionContainer";
import { mockAppointments, mockBarbers, mockServices } from "@/data/mockData";
import { Appointment } from "@/types/barbershop";

const statusConfig = {
  scheduled: { label: "Agendado", className: "bg-accent/10 text-accent" },
  completed: { label: "Concluído", className: "bg-success/10 text-success" },
  cancelled: { label: "Cancelado", className: "bg-destructive/10 text-destructive" },
};

const Schedule = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ barberId: "", clientName: "", serviceId: "", date: "", time: "" });

  const grouped = appointments.reduce((acc, apt) => {
    if (!acc[apt.date]) acc[apt.date] = [];
    acc[apt.date].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const handleSave = () => {
    if (!form.clientName || !form.barberId) return;
    setAppointments((prev) => [
      ...prev,
      { id: String(Date.now()), ...form, status: "scheduled" },
    ]);
    setShowForm(false);
    setForm({ barberId: "", clientName: "", serviceId: "", date: "", time: "" });
  };

  const updateStatus = (id: string, status: Appointment["status"]) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Agenda</h1>
          <p className="text-muted-foreground font-light mt-1">Controle de agendamentos</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={() => setShowForm(!showForm)}
          className="organic-btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Novo Agendamento
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
            <h3 className="section-title">Novo Agendamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input placeholder="Nome do Cliente" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} className="organic-input" />
              <select value={form.barberId} onChange={(e) => setForm({ ...form, barberId: e.target.value })} className="organic-input">
                <option value="">Selecione o Barbeiro</option>
                {mockBarbers.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <select value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })} className="organic-input">
                <option value="">Selecione o Serviço</option>
                {mockServices.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>
                ))}
              </select>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="organic-input" />
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="organic-input" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} className="organic-btn-primary">Salvar</button>
              <button onClick={() => setShowForm(false)} className="organic-btn-secondary">Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, apts], i) => (
            <MotionContainer key={date} delay={i * 0.05}>
              <div className="organic-card space-y-4">
                <h3 className="section-title">
                  {new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </h3>
                <div className="space-y-3">
                  {apts
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((apt) => {
                      const barber = mockBarbers.find((b) => b.id === apt.barberId);
                      const service = mockServices.find((s) => s.id === apt.serviceId);
                      const status = statusConfig[apt.status];
                      return (
                        <div
                          key={apt.id}
                          className="flex items-center justify-between py-3 border-b border-border/30 last:border-0"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 min-w-[60px]">
                              <Clock size={14} strokeWidth={1.5} className="text-muted-foreground" />
                              <span className="text-sm font-medium">{apt.time}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{apt.clientName}</p>
                              <p className="text-xs text-muted-foreground font-light">
                                {barber?.name} · {service?.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${status.className}`}>
                              {status.label}
                            </span>
                            {apt.status === "scheduled" && (
                              <div className="flex gap-1">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => updateStatus(apt.id, "completed")}
                                  className="p-1.5 rounded-full hover:bg-success/10 transition-colors"
                                >
                                  <CheckCircle2 size={16} className="text-success" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => updateStatus(apt.id, "cancelled")}
                                  className="p-1.5 rounded-full hover:bg-destructive/10 transition-colors"
                                >
                                  <XCircle size={16} className="text-destructive" />
                                </motion.button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </MotionContainer>
          ))}
      </div>
    </div>
  );
};

export default Schedule;
