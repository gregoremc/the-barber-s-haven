import { useState, useSyncExternalStore, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight, X, User } from "lucide-react";
import MotionContainer from "@/components/MotionContainer";
import ClientSearch from "@/components/ClientSearch";
import { servicesStore } from "@/data/servicesStore";
import { barbersStore } from "@/data/barbersStore";
import { appointmentsStore } from "@/data/appointmentsStore";
import { Appointment } from "@/types/barbershop";
import { paymentsStore } from "@/data/paymentsStore";
import { revenueStore } from "@/data/revenueStore";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  scheduled: "bg-muted/80 border-border",
  completed: "bg-success/15 border-success/30",
  cancelled: "bg-destructive/15 border-destructive/30",
};

const statusLabels: Record<string, string> = {
  scheduled: "Agendado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const getServiceIds = (apt: Appointment): string[] =>
  apt.serviceIds?.length ? apt.serviceIds : apt.serviceId ? [apt.serviceId] : [];

const formatDateBR = (date: Date) =>
  date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const toDateStr = (date: Date) => date.toISOString().split("T")[0];

// Generate time slots from 08:00 to 21:00 in 30-min intervals
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let h = 8; h <= 21; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 21) slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const Schedule = () => {
  const barbersList = useSyncExternalStore(barbersStore.subscribe, barbersStore.getBarbers);
  const appointments = useSyncExternalStore(appointmentsStore.subscribe, appointmentsStore.getAppointments);
  const allServices = useSyncExternalStore(servicesStore.subscribe, servicesStore.getServices);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ barberId: "", clientName: "", time: "" });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const activeBarbers = barbersList.filter((b) => b.active !== false);
  const dateStr = toDateStr(selectedDate);
  const dayAppointments = appointments.filter((a) => a.date === dateStr);

  const navigateDay = (dir: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + dir);
      return next;
    });
  };

  const goToToday = () => setSelectedDate(new Date());
  const isToday = toDateStr(new Date()) === dateStr;

  const addService = (id: string) => {
    if (id && !selectedServices.includes(id)) setSelectedServices((prev) => [...prev, id]);
  };
  const removeService = (id: string) => setSelectedServices((prev) => prev.filter((s) => s !== id));

  const generateCommissionPayment = (barberId: string, serviceIds: string[], date: string) => {
    const barber = barbersList.find((b) => b.id === barberId);
    if (!barber) return;
    const totalServices = serviceIds.reduce((acc, sid) => {
      const svc = allServices.find((s) => s.id === sid);
      return acc + (svc?.price || 0);
    }, 0);
    const svcNames = serviceIds.map((sid) => allServices.find((s) => s.id === sid)?.name).filter(Boolean).join(", ");
    revenueStore.addEntry({
      id: String(Date.now()) + Math.random().toString(36).slice(2),
      type: "service",
      amount: totalServices,
      date,
      description: svcNames,
    });
    const commissionAmount = totalServices * (barber.commission / 100);
    if (commissionAmount <= 0) return;
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
    if (!form.clientName || !form.barberId || selectedServices.length === 0 || !form.time) return;
    const status = isCompleted ? "completed" : "scheduled";
    appointmentsStore.addAppointment({
      id: String(Date.now()),
      barberId: form.barberId,
      clientName: form.clientName,
      serviceId: selectedServices[0],
      serviceIds: selectedServices,
      date: dateStr,
      time: form.time,
      status,
    });
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
      generateCommissionPayment(apt.barberId, getServiceIds(apt), apt.date);
    }
    appointmentsStore.updateStatus(id, status);
  };

  // Get appointment block info for the grid
  const getAppointmentAtSlot = (barberId: string, slotTime: string) => {
    const slotMinutes = timeToMinutes(slotTime);
    return dayAppointments.find((apt) => {
      if (apt.barberId !== barberId) return false;
      const aptMinutes = timeToMinutes(apt.time);
      if (aptMinutes !== slotMinutes) return false;
      return true;
    });
  };

  // Check if a slot is covered by an appointment (not the start, but within duration)
  const isSlotCovered = (barberId: string, slotTime: string) => {
    const slotMinutes = timeToMinutes(slotTime);
    return dayAppointments.find((apt) => {
      if (apt.barberId !== barberId) return false;
      const aptMinutes = timeToMinutes(apt.time);
      const svcIds = getServiceIds(apt);
      const totalDuration = svcIds.reduce((acc, sid) => {
        const svc = allServices.find((s) => s.id === sid);
        return acc + (svc?.duration || 30);
      }, 0);
      return slotMinutes > aptMinutes && slotMinutes < aptMinutes + totalDuration;
    });
  };

  // Calculate how many 30-min slots an appointment spans
  const getSpan = (apt: Appointment) => {
    const svcIds = getServiceIds(apt);
    const totalDuration = svcIds.reduce((acc, sid) => {
      const svc = allServices.find((s) => s.id === sid);
      return acc + (svc?.duration || 30);
    }, 0);
    return Math.max(1, Math.ceil(totalDuration / 30));
  };

  // Click on empty cell to open form with pre-filled barber and time
  const handleCellClick = (barberId: string, time: string) => {
    setForm({ barberId, clientName: "", time });
    setSelectedServices([]);
    setIsCompleted(false);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Agenda</h1>
          <p className="text-muted-foreground font-light mt-1">Controle de agendamentos</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { setShowForm(!showForm); if (showForm) { setSelectedServices([]); setIsCompleted(false); } }}
          className="organic-btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Novo Agendamento
        </motion.button>
      </div>

      {/* Day Navigation */}
      <div className="flex items-center justify-between organic-card !py-3 !px-5">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => navigateDay(-1)} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ChevronLeft size={20} className="text-muted-foreground" />
        </motion.button>
        <Popover>
          <PopoverTrigger asChild>
            <button className="text-center cursor-pointer hover:opacity-80 transition-opacity">
              <p className="text-sm font-medium capitalize">{formatDateBR(selectedDate)}</p>
              {!isToday && (
                <button onClick={(e) => { e.stopPropagation(); goToToday(); }} className="text-xs text-accent hover:underline mt-0.5">Voltar para hoje</button>
              )}
              {isToday && <p className="text-xs text-muted-foreground mt-0.5">Hoje</p>}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} locale={ptBR} initialFocus className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => navigateDay(1)} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ChevronRight size={20} className="text-muted-foreground" />
        </motion.button>
      </div>

      {/* New Appointment Form */}
      <AnimatePresence mode="wait">
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="organic-card space-y-4 overflow-hidden">
            <h3 className="section-title">Novo Agendamento — {formatDateBR(selectedDate)}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ClientSearch value={form.clientName} onChange={(name) => setForm({ ...form, clientName: name })} />
              <select value={form.barberId} onChange={(e) => setForm({ ...form, barberId: e.target.value })} className="organic-input">
                <option value="">Selecione o Barbeiro</option>
                {activeBarbers.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
              </select>
              <select value="" onChange={(e) => addService(e.target.value)} className="organic-input">
                <option value="">Adicionar Serviço</option>
                {allServices.filter((s) => !selectedServices.includes(s.id)).map((s) => (<option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>))}
              </select>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="organic-input" />
            </div>
            {selectedServices.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedServices.map((sid) => {
                  const svc = allServices.find((s) => s.id === sid);
                  return (
                    <span key={sid} className="flex items-center gap-1.5 text-xs bg-secondary px-3 py-1.5 rounded-full">
                      {svc?.name}
                      <button onClick={() => removeService(sid)} className="hover:text-destructive transition-colors"><X size={12} /></button>
                    </span>
                  );
                })}
                <span className="text-xs text-muted-foreground self-center ml-2">
                  Total: R$ {selectedServices.reduce((acc, sid) => acc + (allServices.find((s) => s.id === sid)?.price || 0), 0).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 pt-1">
              <Checkbox id="completed-check" checked={isCompleted} onCheckedChange={(checked) => setIsCompleted(checked === true)} />
              <label htmlFor="completed-check" className="text-sm text-muted-foreground cursor-pointer select-none">Marcar como já executado</label>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} className="organic-btn-primary">Salvar</button>
              <button onClick={() => { setShowForm(false); setSelectedServices([]); setIsCompleted(false); }} className="organic-btn-secondary">Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Schedule */}
      {activeBarbers.length === 0 ? (
        <div className="organic-card text-center py-12">
          <p className="text-muted-foreground font-light">Nenhum barbeiro ativo cadastrado</p>
        </div>
      ) : (
        <MotionContainer delay={0}>
          <div className="organic-card !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[600px]">
                {/* Barber Headers */}
                <thead>
                  <tr>
                    <th className="w-16 p-2 border-b border-r border-border/50 bg-card sticky left-0 z-10"></th>
                    {activeBarbers.map((barber) => (
                      <th key={barber.id} className="p-3 border-b border-r border-border/50 bg-card last:border-r-0 min-w-[180px]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-secondary flex items-center justify-center">
                            {barber.avatar ? (
                              <img src={barber.avatar} alt={barber.name} className="w-full h-full object-cover" />
                            ) : (
                              <User size={18} className="text-muted-foreground" />
                            )}
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium truncate">{barber.name}</p>
                            <p className="text-xs text-muted-foreground font-light">{barber.phone}</p>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((slot) => {
                    const isHour = slot.endsWith(":00");
                    return (
                      <tr key={slot} className={isHour ? "border-t border-border/40" : ""}>
                        <td className={`text-xs text-muted-foreground text-right pr-3 py-0 h-10 border-r border-border/50 bg-card sticky left-0 z-10 ${isHour ? "font-medium" : "font-light"}`}>
                          {isHour ? slot : ""}
                        </td>
                        {activeBarbers.map((barber) => {
                          const apt = getAppointmentAtSlot(barber.id, slot);
                          const covered = isSlotCovered(barber.id, slot);

                          if (covered) return null; // skip, merged cell above

                          if (apt) {
                            const span = getSpan(apt);
                            const svcIds = getServiceIds(apt);
                            const aptServices = svcIds.map((id) => allServices.find((s) => s.id === id)).filter(Boolean);
                            const totalPrice = aptServices.reduce((acc, s) => acc + s!.price, 0);

                            return (
                              <td
                                key={barber.id}
                                rowSpan={span}
                                className="p-0 border-r border-border/50 last:border-r-0 align-top"
                              >
                                <div
                                  className={`m-0.5 p-2 rounded-lg border h-full cursor-pointer transition-all hover:opacity-80 ${statusColors[apt.status]}`}
                                  onClick={() => {
                                    if (apt.status === "scheduled") {
                                      // Show action options
                                      const action = window.confirm(`${apt.clientName}\n${services.map(s => s!.name).join(", ")}\nR$ ${totalPrice.toFixed(2)}\n\nConcluir atendimento?`);
                                      if (action) {
                                        updateStatus(apt.id, "completed");
                                        toast.success("Atendimento concluído!");
                                      }
                                    }
                                  }}
                                  onContextMenu={(e) => {
                                    e.preventDefault();
                                    if (apt.status === "scheduled") {
                                      const cancel = window.confirm(`Cancelar agendamento de ${apt.clientName}?`);
                                      if (cancel) {
                                        updateStatus(apt.id, "cancelled");
                                        toast.info("Agendamento cancelado");
                                      }
                                    }
                                  }}
                                >
                                  <p className="text-xs font-medium truncate">{apt.time} - {apt.clientName}</p>
                                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                    {services.map((s) => s!.name).join(", ")}
                                  </p>
                                  <p className="text-[10px] font-medium mt-0.5">R$ {totalPrice.toFixed(2)}</p>
                                  <span className={`inline-block text-[9px] mt-1 px-1.5 py-0.5 rounded-full ${
                                    apt.status === "completed" ? "bg-success/20 text-success" :
                                    apt.status === "cancelled" ? "bg-destructive/20 text-destructive" :
                                    "bg-accent/20 text-accent"
                                  }`}>
                                    {statusLabels[apt.status]}
                                  </span>
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={barber.id}
                              className="border-r border-border/50 last:border-r-0 h-10 cursor-pointer hover:bg-secondary/50 transition-colors"
                              onClick={() => handleCellClick(barber.id, slot)}
                            />
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </MotionContainer>
      )}
    </div>
  );
};

export default Schedule;
