import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Barber } from "@/types/barbershop";
import { paymentsStore } from "@/data/paymentsStore";
import { shopStore } from "@/data/shopStore";
import { printReceipt } from "@/utils/printReceipt";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  barber: Barber;
  type: "payment" | "advance";
  maxAmount?: number; // max payable for payments, undefined for advances
  monthStr: string;
}

const BarberPaymentModal = ({ open, onClose, barber, type, maxAmount, monthStr }: Props) => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  const title = type === "payment" ? "Fazer Pagamento" : "Adiantamento";
  const numAmount = Number(amount);
  const isValid = numAmount > 0 && date;
  const isOverLimit = type === "payment" && maxAmount !== undefined && numAmount > maxAmount;

  const handleConfirm = () => {
    if (!isValid || isOverLimit) return;

    const description = type === "payment"
      ? `Pagamento ao barbeiro`
      : `Adiantamento ao barbeiro`;

    paymentsStore.addDisbursement(barber.id, numAmount, date, type, description);

    const shop = shopStore.getSettings();
    printReceipt({
      type,
      shopName: shop.name,
      barberName: barber.name,
      amount: numAmount,
      date,
    });

    toast({
      title: type === "payment" ? "Pagamento registrado" : "Adiantamento registrado",
      description: `R$ ${numAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} para ${barber.name}`,
    });

    setAmount("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title} — {barber.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {type === "payment" && (
            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground">Saldo pendente no mês</p>
              <p className="text-sm font-medium">
                R$ {maxAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={type === "payment" ? maxAmount : undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="organic-input w-full"
            />
            {isOverLimit && (
              <p className="text-xs text-destructive">
                Valor excede o saldo pendente de R$ {maxAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="organic-input w-full"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConfirm}
              disabled={!isValid || isOverLimit}
              className="organic-btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar e Imprimir
            </motion.button>
            <button onClick={onClose} className="organic-btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarberPaymentModal;
