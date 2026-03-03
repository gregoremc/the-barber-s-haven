import { useSyncExternalStore, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight, Eye, DollarSign, ArrowDownLeft, Undo2 } from "lucide-react";
import MotionContainer from "@/components/MotionContainer";
import { paymentsStore } from "@/data/paymentsStore";
import { barbersStore } from "@/data/barbersStore";
import { Barber, BarberPayment } from "@/types/barbershop";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import BarberPaymentModal from "@/components/BarberPaymentModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type GroupedItem = {
  description: string;
  qty: number;
  total: number;
};

const groupPayments = (payments: BarberPayment[]): GroupedItem[] => {
  const map = new Map<string, GroupedItem>();
  payments.forEach((p) => {
    const key = p.description || "Outros";
    const existing = map.get(key);
    if (existing) {
      existing.qty += 1;
      existing.total += p.amount;
    } else {
      map.set(key, { description: key, qty: 1, total: p.amount });
    }
  });
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
};

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const getPaymentAlerts = (barbersList: Barber[]) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  return barbersList
    .filter((b) => b.paymentDay)
    .map((barber) => {
      const payDay = barber.paymentDay!;
      let nextPayment = new Date(currentYear, currentMonth, payDay);
      if (nextPayment < today) {
        nextPayment = new Date(currentYear, currentMonth + 1, payDay);
      }
      const diffTime = nextPayment.getTime() - today.getTime();
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { barber, daysUntil, nextPayment };
    })
    .filter((a) => a.daysUntil <= 7 && a.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil);
};

const Payments = () => {
  const payments = useSyncExternalStore(paymentsStore.subscribe, paymentsStore.getPayments);
  const barbers = useSyncExternalStore(barbersStore.subscribe, barbersStore.getBarbers);
  const [detailBarber, setDetailBarber] = useState<Barber | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ barberId: "", amount: "", date: "", description: "" });
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [paymentModal, setPaymentModal] = useState<{ barber: Barber; type: "payment" | "advance" } | null>(null);
  const [undoConfirm, setUndoConfirm] = useState<{ id: string; label: string } | null>(null);

  const selectedMonthStr = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, "0")}`;

  const navigateMonth = (dir: number) => {
    setSelectedMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + dir);
      return next;
    });
  };

  const goToCurrentMonth = () => setSelectedMonth(new Date());

  const isCurrentMonth = () => {
    const now = new Date();
    return now.getFullYear() === selectedMonth.getFullYear() && now.getMonth() === selectedMonth.getMonth();
  };

  const formatMonthLabel = (date: Date) =>
    date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const activeBarbers = barbers.filter((b) => b.active !== false);
  const alerts = getPaymentAlerts(activeBarbers);

  const monthPayments = useMemo(() => {
    return payments.filter((p) => {
      if (!p.date) return false;
      if (p.type === "payment" || p.type === "advance") return false;
      return p.date.substring(0, 7) === selectedMonthStr;
    });
  }, [payments, selectedMonthStr]);

  const monthDisbursements = useMemo(() => {
    return payments.filter((p) => {
      if (!p.date) return false;
      if (p.type !== "payment" && p.type !== "advance") return false;
      return p.date.substring(0, 7) === selectedMonthStr;
    });
  }, [payments, selectedMonthStr]);

  const monthAdvances = useMemo(() => {
    return payments.filter((p) => {
      if (!p.date) return false;
      if (p.type !== "advance") return false;
      return p.date.substring(0, 7) === selectedMonthStr;
    });
  }, [payments, selectedMonthStr]);

  const totalPaid = monthDisbursements.filter((p) => p.type === "payment").reduce((a, p) => a + p.amount, 0);
  const totalPending = (() => {
    let sum = 0;
    activeBarbers.forEach((b) => {
      sum += paymentsStore.getBarberBalance(b.id, selectedMonthStr);
    });
    return sum;
  })();
  const totalAdvances = monthAdvances.reduce((a, p) => a + p.amount, 0);

  const handleSave = () => {
    if (!form.barberId || !form.amount) return;
    paymentsStore.addPayment({
      id: String(Date.now()),
      barberId: form.barberId,
      amount: Number(form.amount),
      date: form.date,
      description: form.description,
      status: "pending",
    });
    setShowForm(false);
    setForm({ barberId: "", amount: "", date: "", description: "" });
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

      {/* Month Navigation */}
      <div className="flex items-center justify-between organic-card !py-3 !px-5">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigateMonth(-1)}
          className="p-2 rounded-xl hover:bg-secondary transition-colors"
        >
          <ChevronLeft size={20} className="text-muted-foreground" />
        </motion.button>
        <Popover>
          <PopoverTrigger asChild>
            <button className="text-center cursor-pointer hover:opacity-80 transition-opacity">
              <p className="text-sm font-medium capitalize">{formatMonthLabel(selectedMonth)}</p>
              {!isCurrentMonth() && (
                <button onClick={(e) => { e.stopPropagation(); goToCurrentMonth(); }} className="text-xs text-primary hover:underline mt-0.5">
                  Voltar para mês atual
                </button>
              )}
              {isCurrentMonth() && (
                <p className="text-xs text-muted-foreground mt-0.5">Mês atual</p>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4 pointer-events-auto" align="center">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setPickerYear((y) => y - 1)} className="p-1 rounded hover:bg-secondary transition-colors">
                <ChevronLeft size={16} className="text-muted-foreground" />
              </button>
              <span className="text-sm font-medium">{pickerYear}</span>
              <button onClick={() => setPickerYear((y) => y + 1)} className="p-1 rounded hover:bg-secondary transition-colors">
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MONTH_NAMES.map((name, i) => {
                const isSelected = selectedMonth.getFullYear() === pickerYear && selectedMonth.getMonth() === i;
                const now = new Date();
                const isCurrent = now.getFullYear() === pickerYear && now.getMonth() === i;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedMonth(new Date(pickerYear, i, 1))}
                    className={cn(
                      "text-xs py-2 px-1 rounded-lg transition-all font-medium",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : isCurrent
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {name.substring(0, 3)}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigateMonth(1)}
          className="p-2 rounded-xl hover:bg-secondary transition-colors"
        >
          <ChevronRight size={20} className="text-muted-foreground" />
        </motion.button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MotionContainer className="organic-card">
          <p className="stat-label">Total Pago</p>
          <p className="stat-value mt-1 text-success">R$ {totalPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </MotionContainer>
        <MotionContainer delay={0.05} className="organic-card">
          <p className="stat-label">Pendente</p>
          <p className={cn("stat-value mt-1", totalPending >= 0 ? "text-warning" : "text-destructive")}>
            R$ {totalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </MotionContainer>
        <MotionContainer delay={0.1} className="organic-card">
          <p className="stat-label">Adiantamentos no Mês</p>
          <p className="stat-value mt-1 text-primary">R$ {totalAdvances.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </MotionContainer>
      </div>

      {/* Payment day alerts */}
      {alerts.length > 0 && (
        <MotionContainer delay={0.15}>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.barber.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                  alert.daysUntil === 0
                    ? "bg-destructive/10 border-destructive/30"
                    : alert.daysUntil <= 3
                    ? "bg-warning/10 border-warning/30"
                    : "bg-accent/10 border-accent/30"
                }`}
              >
                <AlertTriangle size={16} className={
                  alert.daysUntil === 0 ? "text-destructive" : alert.daysUntil <= 3 ? "text-warning" : "text-accent"
                } />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {alert.daysUntil === 0
                      ? `Hoje é dia de pagamento de ${alert.barber.name}!`
                      : `Pagamento de ${alert.barber.name} em ${alert.daysUntil} dia${alert.daysUntil > 1 ? "s" : ""}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Dia {alert.barber.paymentDay} · {alert.nextPayment.toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </MotionContainer>
      )}

      {/* New Payment Form */}
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
                {activeBarbers.map((b) => (
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

      {/* Barber Cards - ALL active barbers */}
      {activeBarbers.map((barber, i) => {
        const barberPayments = monthPayments.filter((p) => p.barberId === barber.id);
        const barberDisbursements = monthDisbursements.filter((p) => p.barberId === barber.id);
        const grouped = groupPayments(barberPayments);
        const totalBarber = barberPayments.reduce((a, p) => a + p.amount, 0);
        const totalDisbursed = barberDisbursements.reduce((a, p) => a + p.amount, 0);
        const pendingBalance = paymentsStore.getBarberBalance(barber.id, selectedMonthStr);
        const hasData = barberPayments.length > 0 || barberDisbursements.length > 0;

        return (
          <MotionContainer key={barber.id} delay={i * 0.05}>
            <div className="organic-card space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Users size={18} strokeWidth={1.5} className="text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">{barber.name}</h3>
                    <p className="text-xs text-muted-foreground font-light">
                      Comissão: {barber.commission}%
                      {barberPayments.length > 0 && ` · ${barberPayments.length} lançamento${barberPayments.length > 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPaymentModal({ barber, type: "payment" })}
                    disabled={pendingBalance <= 0}
                    className="organic-btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <DollarSign size={14} />
                    Pagar
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPaymentModal({ barber, type: "advance" })}
                    className="organic-btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5"
                  >
                    <ArrowDownLeft size={14} />
                    Adiantamento
                  </motion.button>
                  {hasData && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDetailBarber(barber)}
                      className="organic-btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5"
                    >
                      <Eye size={14} />
                      Detalhes
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Separate pending and paid stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-2.5 rounded-lg bg-secondary/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Comissões</p>
                  <p className="text-sm font-medium mt-0.5">R$ {totalBarber.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-secondary/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pago/Adiant.</p>
                  <p className="text-sm font-medium text-success mt-0.5">R$ {totalDisbursed.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-secondary/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pendente</p>
                  <p className={cn("text-sm font-medium mt-0.5", pendingBalance > 0 ? "text-warning" : pendingBalance < 0 ? "text-destructive" : "text-success")}>
                    R$ {pendingBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Grouped items preview */}
              {grouped.length > 0 && (
                <div className="space-y-1">
                  {grouped.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                      <p className="text-sm text-foreground truncate max-w-[60%]">{item.description}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">{item.qty}x</span>
                        <span className="text-sm font-medium w-24 text-right">R$ {item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  ))}
                  {grouped.length > 5 && (
                    <button
                      onClick={() => setDetailBarber(barber)}
                      className="text-xs text-primary hover:underline mt-1"
                    >
                      +{grouped.length - 5} itens · Ver todos
                    </button>
                  )}
                </div>
              )}

              {!hasData && (
                <p className="text-xs text-muted-foreground text-center py-3 font-light">Nenhum lançamento neste mês</p>
              )}
            </div>
          </MotionContainer>
        );
      })}

      {/* Detail Modal */}
      <Dialog open={!!detailBarber} onOpenChange={(open) => !open && setDetailBarber(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {detailBarber?.name} — {formatMonthLabel(selectedMonth)}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            {detailBarber && (() => {
              const bp = monthPayments.filter((p) => p.barberId === detailBarber.id);
              const bd = monthDisbursements.filter((p) => p.barberId === detailBarber.id);
              const totalCommissions = bp.reduce((a, p) => a + p.amount, 0);
              const totalDisbursedDetail = bd.reduce((a, p) => a + p.amount, 0);
              const balance = paymentsStore.getBarberBalance(detailBarber.id, selectedMonthStr);
              return (
                <div className="space-y-4 pb-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground">Comissões</p>
                      <p className="text-sm font-medium">R$ {totalCommissions.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground">Pago/Adiant.</p>
                      <p className="text-sm font-medium text-success">R$ {totalDisbursedDetail.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground">Saldo</p>
                      <p className={cn("text-sm font-medium", balance > 0 ? "text-warning" : balance < 0 ? "text-destructive" : "text-success")}>
                        R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* Disbursements */}
                  {bd.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Pagamentos e Adiantamentos</p>
                      {bd.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {payment.type === "advance" ? "Adiantamento" : "Pagamento"}{payment.description ? ` — ${payment.description}` : ""}
                            </p>
                            <p className="text-xs text-muted-foreground font-light">
                              {payment.date ? new Date(payment.date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-3 shrink-0">
                            <span className="text-sm font-medium text-success">- R$ {payment.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setUndoConfirm({
                                id: payment.id,
                                label: `${payment.type === "advance" ? "Adiantamento" : "Pagamento"} de R$ ${payment.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                              })}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                              title="Desfazer"
                            >
                              <Undo2 size={14} />
                            </motion.button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Commissions */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Comissões</p>
                    {bp.length > 0 ? bp.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{payment.description}</p>
                          <p className="text-xs text-muted-foreground font-light">
                            {payment.date ? new Date(payment.date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-3 shrink-0">
                          <span className="text-sm font-medium">R$ {payment.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                          {payment.status === "paid" && (
                            <span className="text-xs text-success flex items-center gap-1">
                              <CheckCircle2 size={14} /> Pago
                            </span>
                          )}
                        </div>
                      </div>
                    )) : (
                      <p className="text-xs text-muted-foreground text-center py-3 font-light">Nenhuma comissão neste mês</p>
                    )}
                  </div>
                </div>
              );
            })()}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Payment / Advance Modal */}
      {paymentModal && (
        <BarberPaymentModal
          open={!!paymentModal}
          onClose={() => setPaymentModal(null)}
          barber={paymentModal.barber}
          type={paymentModal.type}
          maxAmount={paymentModal.type === "advance" ? undefined : Math.max(0, paymentsStore.getBarberBalance(paymentModal.barber.id, selectedMonthStr))}
          monthStr={selectedMonthStr}
        />
      )}

      {/* Undo Confirm */}
      <AlertDialog open={!!undoConfirm} onOpenChange={(open) => !open && setUndoConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {undoConfirm?.label ? `"${undoConfirm.label}"` : "este lançamento"}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (undoConfirm) {
                  paymentsStore.removeDisbursement(undoConfirm.id);
                  toast.success("Lançamento desfeito com sucesso");
                  setUndoConfirm(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Payments;
