import { useState, useMemo, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, AlertCircle, CheckCircle2, RefreshCw, FolderOpen, Paperclip, ChevronLeft, ChevronRight, FastForward, PartyPopper, X, FileText, AlertTriangle } from "lucide-react";
import MotionContainer from "@/components/MotionContainer";
import { Bill, BillAttachment } from "@/types/barbershop";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ptBR } from "date-fns/locale";
import { billsStore } from "@/data/billsStore";

const statusConfig = {
  pending: { label: "Pendente", className: "bg-warning/10 text-warning-foreground" },
  paid: { label: "Pago", className: "bg-success/10 text-success" },
  overdue: { label: "Vencida", className: "bg-destructive/10 text-destructive" },
};

const Bills = () => {
  const bills = useSyncExternalStore(billsStore.subscribe, billsStore.getBills);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", dueDate: "", category: "", isRecurring: false, recurringMonths: 1 });
  const [activeTab, setActiveTab] = useState<"all" | "recurring" | "single">("all");
  const [showDocFolder, setShowDocFolder] = useState<string | null>(null);
  const [docMonth, setDocMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [attachName, setAttachName] = useState("");
  const [celebrateGroup, setCelebrateGroup] = useState<string | null>(null);
  const [confirmAnticipate, setConfirmAnticipate] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());

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

  const monthBills = useMemo(() => {
    return bills.filter((b) => {
      if (!b.dueDate) return false;
      const billMonth = b.dueDate.substring(0, 7); // "YYYY-MM"
      return billMonth === selectedMonthStr;
    });
  }, [bills, selectedMonthStr]);

  const totalPending = monthBills.filter((b) => b.status !== "paid").reduce((a, b) => a + b.amount, 0);
  const totalPaid = monthBills.filter((b) => b.status === "paid").reduce((a, b) => a + b.amount, 0);
  const overdueCount = monthBills.filter((b) => b.status === "overdue").length;

  const filteredBills = useMemo(() => {
    if (activeTab === "recurring") return monthBills.filter((b) => b.isRecurring);
    if (activeTab === "single") return monthBills.filter((b) => !b.isRecurring);
    return monthBills;
  }, [monthBills, activeTab]);

  const handleSave = () => {
    if (!form.description || !form.amount) return;
    if (form.isRecurring && form.recurringMonths > 1) {
      const groupId = String(Date.now());
      const baseDate = form.dueDate ? new Date(form.dueDate + "T12:00:00") : new Date();
      const newBills: Bill[] = [];
      for (let i = 0; i < form.recurringMonths; i++) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + i);
        const dueDate = d.toISOString().split("T")[0];
        newBills.push({
          id: `${groupId}-${i}`,
          description: `${form.description} (${i + 1}/${form.recurringMonths})`,
          amount: Number(form.amount),
          dueDate,
          category: form.category,
          status: "pending",
          isRecurring: true,
          recurringMonths: form.recurringMonths,
          recurringGroupId: groupId,
          installmentNumber: i + 1,
          attachments: [],
        });
      }
      billsStore.addBills(newBills);
    } else {
      billsStore.addBill({
        id: String(Date.now()),
        description: form.description,
        amount: Number(form.amount),
        dueDate: form.dueDate,
        category: form.category,
        status: "pending",
        isRecurring: false,
        attachments: [],
      });
    }
    setShowForm(false);
    setForm({ description: "", amount: "", dueDate: "", category: "", isRecurring: false, recurringMonths: 1 });
  };

  const markPaid = (id: string) => {
    billsStore.markPaid(id);
    const updatedBills = billsStore.getBills();
    const bill = updatedBills.find((b) => b.id === id);
    if (bill?.isRecurring && bill.recurringGroupId) {
      const group = updatedBills.filter((b) => b.recurringGroupId === bill.recurringGroupId);
      if (group.every((b) => b.status === "paid")) {
        setCelebrateGroup(bill.recurringGroupId);
      }
    }
  };

  const anticipatePayments = (groupId: string) => {
    billsStore.anticipateGroup(groupId);
    const updatedBills = billsStore.getBills();
    const group = updatedBills.filter((b) => b.recurringGroupId === groupId);
    if (group.every((b) => b.status === "paid")) {
      setCelebrateGroup(groupId);
    }
  };

  const getNextUnpaidCount = (groupId: string) => {
    return bills.filter((b) => b.recurringGroupId === groupId && b.status !== "paid").length;
  };

  const handleAttach = (billId: string) => {
    if (!attachName.trim()) return;
    const attachment: BillAttachment = {
      id: String(Date.now()),
      name: attachName.trim(),
      url: "#",
      date: docMonth,
    };
    billsStore.addAttachment(billId, attachment);
    setAttachName("");
  };

  const removeAttachment = (billId: string, attachId: string) => {
    billsStore.removeAttachment(billId, attachId);
  };

  const changeDocMonth = (dir: number) => {
    const [y, m] = docMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setDocMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const docMonthLabel = () => {
    const [y, m] = docMonth.split("-").map(Number);
    return new Date(y, m - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  const currentDocBill = bills.find((b) => b.id === showDocFolder);
  const currentMonthAttachments = (currentDocBill?.attachments || []).filter((a) => a.date === docMonth);

  const recurringGroups = useMemo(() => {
    const groups: Record<string, Bill[]> = {};
    bills.forEach((b) => {
      if (b.recurringGroupId) {
        if (!groups[b.recurringGroupId]) groups[b.recurringGroupId] = [];
        groups[b.recurringGroupId].push(b);
      }
    });
    return groups;
  }, [bills]);

  const tabs = [
    { key: "all" as const, label: "Todas" },
    { key: "recurring" as const, label: "Recorrentes" },
    { key: "single" as const, label: "Avulsas" },
  ];

  return (
    <div className="space-y-8">
      {/* Celebration modal */}
      <AnimatePresence>
        {celebrateGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm"
            onClick={() => setCelebrateGroup(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="organic-card max-w-md text-center space-y-4 p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center">
                <PartyPopper size={48} className="text-success" />
              </div>
              <h2 className="section-title text-success">Parabéns! 🎉</h2>
              <p className="text-muted-foreground text-sm">
                Você quitou todas as contas referentes a esse item. Todas as parcelas foram pagas com sucesso!
              </p>
              <button onClick={() => setCelebrateGroup(null)} className="organic-btn-primary">
                Fechar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm anticipate modal */}
      <AnimatePresence>
        {confirmAnticipate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/20 backdrop-blur-sm"
            onClick={() => setConfirmAnticipate(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="organic-card !p-6 max-w-sm w-full mx-4 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-accent/10">
                  <AlertTriangle size={20} className="text-accent" />
                </div>
                <h3 className="section-title">Confirmar Antecipação</h3>
              </div>
              <p className="text-sm text-muted-foreground font-light">
                Tem certeza que deseja quitar todas as parcelas pendentes de uma vez? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setConfirmAnticipate(null)} className="organic-btn-secondary">Cancelar</button>
                <button
                  onClick={() => { anticipatePayments(confirmAnticipate); setConfirmAnticipate(null); }}
                  className="organic-btn-primary"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document folder modal */}
      <AnimatePresence>
        {showDocFolder && currentDocBill && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm"
            onClick={() => setShowDocFolder(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="organic-card w-full max-w-lg space-y-5 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="section-title flex items-center gap-2">
                  <FolderOpen size={18} className="text-accent" />
                  Documentos — {currentDocBill.description}
                </h3>
                <button onClick={() => setShowDocFolder(null)} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              {/* Month nav */}
              <div className="flex items-center justify-between">
                <button onClick={() => changeDocMonth(-1)} className="organic-btn-ghost p-2">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-medium capitalize">{docMonthLabel()}</span>
                <button onClick={() => changeDocMonth(1)} className="organic-btn-ghost p-2">
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Attachments */}
              <div className="space-y-2 min-h-[80px]">
                {currentMonthAttachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum documento neste mês.</p>
                ) : (
                  currentMonthAttachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-accent" />
                        <span className="text-sm font-medium">{att.name}</span>
                      </div>
                      <button
                        onClick={() => removeAttachment(currentDocBill.id, att.id)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add attachment */}
              <div className="flex gap-2">
                <input
                  placeholder="Nome do arquivo"
                  value={attachName}
                  onChange={(e) => setAttachName(e.target.value)}
                  className="organic-input flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleAttach(currentDocBill.id)}
                />
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleAttach(currentDocBill.id)}
                  className="organic-btn-primary flex items-center gap-1"
                >
                  <Paperclip size={14} /> Anexar
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={selectedMonth}
              onSelect={(date) => date && setSelectedMonth(new Date(date.getFullYear(), date.getMonth(), 1))}
              locale={ptBR}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
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

      {/* Stats */}
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

      {/* Form */}
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

            {/* Recurring toggle */}
            <div className="flex items-center gap-3 pt-2">
              <Checkbox
                id="recurring"
                checked={form.isRecurring}
                onCheckedChange={(checked) => setForm({ ...form, isRecurring: !!checked, recurringMonths: checked ? 2 : 1 })}
              />
              <label htmlFor="recurring" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                <RefreshCw size={14} className="text-accent" />
                Conta recorrente
              </label>
            </div>

            <AnimatePresence>
              {form.isRecurring && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground">Período (meses):</label>
                    <select
                      value={form.recurringMonths}
                      onChange={(e) => setForm({ ...form, recurringMonths: Number(e.target.value) })}
                      className="organic-input w-24"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>{m}x</option>
                      ))}
                    </select>
                    <span className="text-xs text-muted-foreground">
                      Total: R$ {((Number(form.amount) || 0) * form.recurringMonths).toLocaleString("pt-BR")}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3">
              <button onClick={handleSave} className="organic-btn-primary">Salvar</button>
              <button onClick={() => setShowForm(false)} className="organic-btn-secondary">Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`text-sm px-4 py-2 rounded-full transition-all ${
              activeTab === t.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Anticipate recurring section */}
      {activeTab !== "single" && Object.entries(recurringGroups).some(([, g]) => g.some((b) => b.status !== "paid")) && (
        <MotionContainer delay={0.1}>
          <div className="organic-card space-y-3">
            <h3 className="section-title flex items-center gap-2">
              <FastForward size={16} className="text-accent" />
              Antecipar Recorrências
            </h3>
            <div className="space-y-2">
              {Object.entries(recurringGroups)
                .filter(([, g]) => g.some((b) => b.status !== "paid"))
                .map(([groupId, group]) => {
                  const unpaid = getNextUnpaidCount(groupId);
                  const baseName = group[0].description.replace(/\s*\(\d+\/\d+\)/, "");
                  return (
                    <div key={groupId} className="flex items-center justify-between bg-secondary/40 rounded-xl px-4 py-3">
                      <div>
                        <span className="text-sm font-medium">{baseName}</span>
                        <span className="text-xs text-muted-foreground ml-2">({unpaid} parcela{unpaid > 1 ? "s" : ""} restante{unpaid > 1 ? "s" : ""})</span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setConfirmAnticipate(groupId)}
                        className="text-xs text-accent flex items-center gap-1 font-medium"
                      >
                        <FastForward size={14} /> Quitar todas
                      </motion.button>
                    </div>
                  );
                })}
            </div>
          </div>
        </MotionContainer>
      )}

      {/* Table */}
      <MotionContainer delay={0.15}>
        <div className="organic-card overflow-hidden !p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Descrição</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-medium hidden md:table-cell">Categoria</th>
                <th className="text-right p-4 text-xs text-muted-foreground font-medium">Valor</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-medium hidden md:table-cell">Vencimento</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Status</th>
                <th className="text-right p-4 text-xs text-muted-foreground font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill) => {
                const status = statusConfig[bill.status];
                return (
                  <motion.tr
                    key={bill.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-border/30 last:border-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="p-4 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {bill.isRecurring && <RefreshCw size={12} className="text-accent" />}
                        {bill.description}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">{bill.category}</td>
                    <td className="p-4 text-sm text-right font-medium">R$ {bill.amount.toLocaleString("pt-BR")}</td>
                    <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                      {bill.dueDate ? new Date(bill.dueDate + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowDocFolder(bill.id)}
                          className="text-muted-foreground hover:text-accent"
                          title="Documentos"
                        >
                          <FolderOpen size={14} />
                        </motion.button>
                        {bill.status !== "paid" && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => markPaid(bill.id)}
                            className="text-xs text-success flex items-center gap-1"
                          >
                            <CheckCircle2 size={14} /> Pagar
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {filteredBills.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                    Nenhuma conta encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </MotionContainer>
    </div>
  );
};

export default Bills;
