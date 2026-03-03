import { useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import ClientSearch from "@/components/ClientSearch";
import { mockServices } from "@/data/mockData";
import { barbersStore } from "@/data/barbersStore";
import { appointmentsStore } from "@/data/appointmentsStore";
import { paymentsStore } from "@/data/paymentsStore";
import { revenueStore } from "@/data/revenueStore";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

const formatDateBR = (date: Date) =>
  date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

interface Props {
  open: boolean;
  onClose: () => void;
}

const NewAppointmentModal = ({ open, onClose }: Props) => {
  const barbersList = useSyncExternalStore(barbersStore.subscribe, barbersStore.getBarbers);
  const [form, setForm] = useState({ barberId: "", clientName: "", time: "" });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const today = new Date();
  const dateStr = today.toISOString().split("T")[0];

  const addService = (id: string) => {
    if (id && !selectedServices.includes(id)) {
      setSelectedServices((prev) => [...prev, id]);
    }
  };

  const removeService = (id: string) => {
    setSelectedServices((prev) => prev.filter((s) => s !== id));
  };

  const reset = () => {
    setForm({ barberId: "", clientName: "", time: "" });
    setSelectedServices([]);
    setIsCompleted(false);
  };

  const handleSave = () => {
    if (!form.clientName || !form.barberId || selectedServices.length === 0) {
      toast({ title: "Preencha todos os campos", description: "Cliente, barbeiro e ao menos um serviço são obrigatórios.", variant: "destructive" });
      return;
    }
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
    toast({ title: "Agendamento criado!", description: `${form.clientName} — ${formatDateBR(today)}` });
    reset();
    onClose();
  };

  const generateCommissionPayment = (barberId: string, serviceIds: string[], date: string) => {
    const barber = barbersList.find((b) => b.id === barberId);
    if (!barber) return;
    const totalServices = serviceIds.reduce((acc, sid) => {
      const svc = mockServices.find((s) => s.id === sid);
      return acc + (svc?.price || 0);
    }, 0);
    const svcNames = serviceIds.map((sid) => mockServices.find((s) => s.id === sid)?.name).filter(Boolean).join(", ");
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

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="organic-card w-full max-w-lg mx-4 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="section-title">Novo Agendamento — {formatDateBR(today)}</h3>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ClientSearch value={form.clientName} onChange={(name) => setForm({ ...form, clientName: name })} />
                <select
                  value={form.barberId}
                  onChange={(e) => setForm({ ...form, barberId: e.target.value })}
                  className="organic-input"
                >
                  <option value="">Selecione o Barbeiro</option>
                  {barbersList.filter((b) => b.active !== false).map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value=""
                  onChange={(e) => addService(e.target.value)}
                  className="organic-input"
                >
                  <option value="">Adicionar Serviço</option>
                  {mockServices
                    .filter((s) => !selectedServices.includes(s.id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>
                    ))}
                </select>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="organic-input"
                />
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
                  id="modal-completed-check"
                  checked={isCompleted}
                  onCheckedChange={(checked) => setIsCompleted(checked === true)}
                />
                <label htmlFor="modal-completed-check" className="text-sm text-muted-foreground cursor-pointer select-none">
                  Marcar como já executado (cliente sem agendamento)
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleSave} className="organic-btn-primary flex-1">Salvar</button>
              <button onClick={handleClose} className="organic-btn-secondary">Cancelar</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewAppointmentModal;
