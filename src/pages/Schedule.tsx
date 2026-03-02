import { useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Clock, CheckCircle2, XCircle, X, ChevronLeft, ChevronRight, PlusCircle, Trash2 } from "lucide-react";
import MotionContainer from "@/components/MotionContainer";
import ClientSearch from "@/components/ClientSearch";
import { mockAppointments, mockServices } from "@/data/mockData";
import { barbersStore } from "@/data/barbersStore";
import { Appointment } from "@/types/barbershop";
import { paymentsStore } from "@/data/paymentsStore";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ptBR } from "date-fns/locale";


const statusConfig = {
  scheduled: { label: "Agendado", className: "bg-accent/10 text-accent" },
  completed: { label: "Concluído", className: "bg-success/10 text-success" },
  cancelled: { label: "Cancelado", className: "bg-destructive/10 text-destructive" },
};

const getServiceIds = (apt: Appointment): string[] =>
  apt.serviceIds?.length ? apt.serviceIds : apt.serviceId ? [apt.serviceId] : [];

const formatDateBR = (date: Date) =>
  date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

const toDateStr = (date: Date) => date.toISOString().split("T")[0];

const Schedule = () => {
  const barbersList = useSyncExternalStore(barbersStore.subscribe, barbersStore.getBarbers);
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ barberId: "", clientName: "", time: "" });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingApt, setEditingApt] = useState<string | null>(null);

  const dateStr = toDateStr(selectedDate);
  const dayAppointments = appointments
    .filter((a) => a.date === dateStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  const navigateDay = (dir: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + dir);
      return next;
    });
  };

  const goToToday = () => setSelectedDate(new Date());

  const addService = (id: string) => {
    if (id && !selectedServices.includes(id)) {
      setSelectedServices((prev) => [...prev, id]);
    }
  };

  const removeService = (id: string) => {
    setSelectedServices((prev) => prev.filter((s) => s !== id));
  };

  const generateCommissionPayment = (barberId: string, serviceIds: string[], date: string) => {
    const barber = barbersList.find((b) => b.id === barberId);
    if (!barber) return;
    const totalServices = serviceIds.reduce((acc, sid) => {
      const svc = mockServices.find((s) => s.id === sid);
      return acc + (svc?.price || 0);
    }, 0);
    const commissionAmount = totalServices * (barber.commission / 100);
    if (commissionAmount <= 0) return;
    const svcNames = serviceIds.map((sid) => mockServices.find((s) => s.id === sid)?.name).filter(Boolean).join(", ");
    paymentsStore.addPayment({
      id: String(Date.now()) + Math.random().toString(36).slice(2),
      barberId,
      amount: commissionAmount,
      date,
      description: `Comissão: ${svcNames}`,
      status: "pending",
    });
  };

  const handleSave = () => {
    if (!form.clientName || !form.barberId || selectedServices.length === 0) return;
    const status = isCompleted ? "completed" : "scheduled";
    setAppointments((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        barberId: form.barberId,
        clientName: form.clientName,
        serviceId: selectedServices[0],
        serviceIds: selectedServices,
        date: dateStr,
        time: form.time,
        status,
      },
    ]);
    if (status === "completed") {
      generateCommissionPayment(form.barberId, selectedServices, dateStr);
    }
    setShowForm(false);
    setForm({ barberId: "", clientName: "", time: "" });
    setSelectedServices([]);
    setIsCompleted(false);
  };

  const updateStatus = (id: string, status: Appointment["status"]) => {
    const apt = appointments.find((a) => a.id === id);
    if (apt && status === "completed") {
      const svcIds = getServiceIds(apt);
      generateCommissionPayment(apt.barberId, svcIds, apt.date);
    }
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  const addServiceToApt = (aptId: string, serviceId: string) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id !== aptId) return a;
        const ids = getServiceIds(a);
        if (ids.includes(serviceId)) return a;
        const newIds = [...ids, serviceId];
        return { ...a, serviceId: newIds[0], serviceIds: newIds };
      })
    );
  };

  const removeServiceFromApt = (aptId: string, serviceId: string) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id !== aptId) return a;
        const ids = getServiceIds(a).filter((id) => id !== serviceId);
        if (ids.length === 0) return a; // keep at least one
        return { ...a, serviceId: ids[0], serviceIds: ids };
      })
    );
  };

  const isToday = toDateStr(new Date()) === dateStr;

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

      {/* Day Navigation */}
      <div className="flex items-center justify-between organic-card !py-3 !px-5">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigateDay(-1)}
          className="p-2 rounded-xl hover:bg-secondary transition-colors"
        >
          <ChevronLeft size={20} className="text-muted-foreground" />
        </motion.button>
        <Popover>
          <PopoverTrigger asChild>
            <button className="text-center cursor-pointer hover:opacity-80 transition-opacity">
              <p className="text-sm font-medium capitalize">{formatDateBR(selectedDate)}</p>
              {!isToday && (
                <button onClick={(e) => { e.stopPropagation(); goToToday(); }} className="text-xs text-primary hover:underline mt-0.5">
                  Voltar para hoje
                </button>
              )}
              {isToday && (
                <p className="text-xs text-muted-foreground mt-0.5">Hoje</p>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={ptBR}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigateDay(1)}
          className="p-2 rounded-xl hover:bg-secondary transition-colors"
        >
          <ChevronRight size={20} className="text-muted-foreground" />
        </motion.button>
      </div>

      {/* New Appointment Form */}
      <AnimatePresence mode="wait">
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="organic-card space-y-4 overflow-hidden"
          >
            <h3 className="section-title">Novo Agendamento — {formatDateBR(selectedDate)}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ClientSearch value={form.clientName} onChange={(name) => setForm({ ...form, clientName: name })} />
              <select value={form.barberId} onChange={(e) => setForm({ ...form, barberId: e.target.value })} className="organic-input">
                <option value="">Selecione o Barbeiro</option>
                {barbersList.map((b) => (
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
            <div className="flex items-center gap-3 pt-1">
              <Checkbox
                id="completed-check"
                checked={isCompleted}
                onCheckedChange={(checked) => setIsCompleted(checked === true)}
              />
              <label htmlFor="completed-check" className="text-sm text-muted-foreground cursor-pointer select-none">
                Marcar como já executado (cliente sem agendamento)
              </label>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} className="organic-btn-primary">Salvar</button>
              <button onClick={() => { setShowForm(false); setSelectedServices([]); setIsCompleted(false); }} className="organic-btn-secondary">Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Appointments List */}
      <div className="space-y-3">
        {dayAppointments.length === 0 ? (
          <MotionContainer delay={0}>
            <div className="organic-card text-center py-12">
              <p className="text-muted-foreground font-light">Nenhum agendamento para este dia</p>
            </div>
          </MotionContainer>
        ) : (
          dayAppointments.map((apt, i) => {
            const barber = barbersList.find((b) => b.id === apt.barberId);
            const svcIds = getServiceIds(apt);
            const services = svcIds.map((id) => mockServices.find((s) => s.id === id)).filter(Boolean);
            const status = statusConfig[apt.status];
            const isEditing = editingApt === apt.id;

            return (
              <MotionContainer key={apt.id} delay={i * 0.03}>
                <div className="organic-card !p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 min-w-[60px]">
                        <Clock size={14} strokeWidth={1.5} className="text-muted-foreground" />
                        <span className="text-sm font-medium">{apt.time}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{apt.clientName}</p>
                        <p className="text-xs text-muted-foreground font-light">
                          {barber?.name}
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

                  {/* Services chips */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {services.map((svc) => (
                      <span key={svc!.id} className="flex items-center gap-1.5 text-xs bg-secondary px-3 py-1 rounded-full">
                        {svc!.name} · R$ {svc!.price.toFixed(2)}
                        {isEditing && svcIds.length > 1 && (
                          <button
                            onClick={() => removeServiceFromApt(apt.id, svc!.id)}
                            className="hover:text-destructive transition-colors"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                      </span>
                    ))}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setEditingApt(isEditing ? null : apt.id)}
                      className="p-1 rounded-full hover:bg-secondary transition-colors"
                      title="Editar serviços"
                    >
                      <PlusCircle size={14} className="text-muted-foreground" />
                    </motion.button>
                    <span className="text-xs text-muted-foreground ml-auto">
                      Total: R$ {services.reduce((acc, s) => acc + s!.price, 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Add service dropdown when editing */}
                  <AnimatePresence>
                    {isEditing && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <select
                          value=""
                          onChange={(e) => { addServiceToApt(apt.id, e.target.value); }}
                          className="organic-input mt-2 text-sm"
                        >
                          <option value="">Adicionar serviço...</option>
                          {mockServices
                            .filter((s) => !svcIds.includes(s.id))
                            .map((s) => (
                              <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>
                            ))}
                        </select>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </MotionContainer>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Schedule;
