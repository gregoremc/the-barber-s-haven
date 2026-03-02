import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Clock, CheckCircle2, XCircle, X } from "lucide-react";
import MotionContainer from "@/components/MotionContainer";
import { mockAppointments, mockBarbers, mockServices } from "@/data/mockData";
import { Appointment } from "@/types/barbershop";

const statusConfig = {
  scheduled: { label: "Agendado", className: "bg-accent/10 text-accent" },
  completed: { label: "Concluído", className: "bg-success/10 text-success" },
  cancelled: { label: "Cancelado", className: "bg-destructive/10 text-destructive" },
};

const getServiceIds = (apt: Appointment): string[] =>
  apt.serviceIds?.length ? apt.serviceIds : apt.serviceId ? [apt.serviceId] : [];

const Schedule = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ barberId: "", clientName: "", date: "", time: "" });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const grouped = appointments.reduce((acc, apt) => {
    if (!acc[apt.date]) acc[apt.date] = [];
    acc[apt.date].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const addService = (id: string) => {
    if (id && !selectedServices.includes(id)) {
      setSelectedServices((prev) => [...prev, id]);
    }
  };

  const removeService = (id: string) => {
    setSelectedServices((prev) => prev.filter((s) => s !== id));
  };

  const handleSave = () => {
    if (!form.clientName || !form.barberId || selectedServices.length === 0) return;
    setAppointments((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        ...form,
        serviceId: selectedServices[0],
        serviceIds: selectedServices,
        status: "scheduled",
      },
    ]);
    setShowForm(false);
    setForm({ barberId: "", clientName: "", date: "", time: "" });
    setSelectedServices([]);
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
              <select
                value=""
                onChange={(e) => { addService(e.target.value); }}
                className="organic-input"
              >
                <option value="">Adicionar Serviço</option>
                {mockServices
                  .filter((s) => !selectedServices.includes(s.id))
                  .map((s) => (
                    <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>
                  ))}
              </select>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="organic-input" />
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="organic-input" />
            </div>
            {selectedServices.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedServices.map((sid) => {
                  const svc = mockServices.find((s) => s.id === sid);
                  return (
                    <span key={sid} className="flex items-center gap-1.5 text-xs bg-secondary px-3 py-1.5 rounded-full">
                      {svc?.name}
                      <button onClick={() => removeService(sid)} className="hover:text-destructive transition-colors">
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
                <span className="text-xs text-muted-foreground self-center ml-2">
                  Total: R$ {selectedServices.reduce((acc, sid) => {
                    const svc = mockServices.find((s) => s.id === sid);
                    return acc + (svc?.price || 0);
                  }, 0).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleSave} className="organic-btn-primary">Salvar</button>
              <button onClick={() => { setShowForm(false); setSelectedServices([]); }} className="organic-btn-secondary">Cancelar</button>
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
                      const svcIds = getServiceIds(apt);
                      const services = svcIds.map((id) => mockServices.find((s) => s.id === id)).filter(Boolean);
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
                                {barber?.name} · {services.map((s) => s!.name).join(", ")}
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
