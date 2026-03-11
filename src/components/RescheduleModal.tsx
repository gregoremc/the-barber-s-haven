import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { appointmentsStore } from "@/data/appointmentsStore";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  appointmentId: string;
  currentDate: string;
  currentTime: string;
  clientName: string;
}

const RescheduleModal = ({ open, onClose, appointmentId, currentDate, currentTime, clientName }: Props) => {
  const [newDate, setNewDate] = useState(currentDate);
  const [newTime, setNewTime] = useState(currentTime);

  const handleReschedule = () => {
    if (!newDate || !newTime) return;
    if (newDate === currentDate && newTime === currentTime) {
      toast.info("Nenhuma alteração feita");
      onClose();
      return;
    }

    appointmentsStore.updateAppointment(appointmentId, {
      date: newDate,
      time: newTime,
    });

    toast.success(`${clientName} reagendado para ${new Date(newDate + "T12:00:00").toLocaleDateString("pt-BR")} às ${newTime}`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CalendarClock size={18} />
            Reagendar — {clientName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Nova data</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="organic-input w-full"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Novo horário</label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="organic-input w-full"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleReschedule} className="organic-btn-primary flex-1">Reagendar</button>
          <button onClick={onClose} className="organic-btn-secondary">Cancelar</button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleModal;
