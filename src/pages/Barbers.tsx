import { useState, useRef, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Paperclip, X, User, FileText, TrendingUp, TrendingDown, Minus, Power, Users } from "lucide-react";
import MotionContainer from "@/components/MotionContainer";
import { mockServices, mockProducts } from "@/data/mockData";
import { Barber, BarberAttachment } from "@/types/barbershop";
import { barbersStore } from "@/data/barbersStore";
import { appointmentsStore } from "@/data/appointmentsStore";
import { paymentsStore } from "@/data/paymentsStore";
import { toast } from "sonner";

const Barbers = () => {
  const barbers = useSyncExternalStore(barbersStore.subscribe, barbersStore.getBarbers);
  const allPayments = useSyncExternalStore(paymentsStore.subscribe, paymentsStore.getPayments);
  const allAppointments = useSyncExternalStore(appointmentsStore.subscribe, appointmentsStore.getAppointments);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", cpfCnpj: "", address: "", phone: "", commission: "", paymentDay: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const toggleBarberActive = (barber: Barber) => {
    const isActive = barber.active !== false;
    if (isActive) {
      // Trying to deactivate — check pending payments
      const pendingPayments = allPayments.filter((p) => p.barberId === barber.id && p.status === "pending");
      if (pendingPayments.length > 0) {
        toast.error(`Não é possível desativar ${barber.name}. Existem ${pendingPayments.length} pagamento(s) pendente(s).`);
        return;
      }
    }
    barbersStore.updateBarber(barber.id, { active: !isActive });
    toast.success(isActive ? `${barber.name} desativado` : `${barber.name} ativado`);
  };



  const resetForm = () => {
    setForm({ name: "", cpfCnpj: "", address: "", phone: "", commission: "", paymentDay: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = () => {
    if (!form.name || !form.phone) return;
    if (editingId) {
      barbersStore.updateBarber(editingId, {
        name: form.name,
        cpfCnpj: form.cpfCnpj,
        address: form.address,
        phone: form.phone,
        commission: Number(form.commission) || 50,
        paymentDay: Number(form.paymentDay) || undefined,
      });
    } else {
      barbersStore.addBarber({
        id: String(Date.now()),
        name: form.name,
        cpfCnpj: form.cpfCnpj,
        address: form.address,
        phone: form.phone,
        commission: Number(form.commission) || 50,
        paymentDay: Number(form.paymentDay) || undefined,
        attachments: [],
      });
    }
    resetForm();
  };

  const handleEdit = (barber: Barber) => {
    setForm({ name: barber.name, cpfCnpj: barber.cpfCnpj || "", address: barber.address || "", phone: barber.phone, commission: String(barber.commission), paymentDay: barber.paymentDay ? String(barber.paymentDay) : "" });
    setEditingId(barber.id);
    setShowForm(true);
  };



  const handleFileAttach = (barberId: string, files: FileList | null) => {
    if (!files) return;
    const newAttachments: BarberAttachment[] = Array.from(files).map((file) => ({
      id: String(Date.now()) + Math.random().toString(36).slice(2),
      name: file.name,
      url: URL.createObjectURL(file),
      date: new Date().toLocaleDateString("pt-BR"),
    }));
    barbersStore.addAttachment(barberId, newAttachments);
  };

  const removeAttachment = (barberId: string, attachmentId: string) => {
    barbersStore.removeAttachment(barberId, attachmentId);
  };

  const selectedBarber = barbers.find((b) => b.id === selectedBarberId);

  const getMonthlyItems = (barberId: string, monthOffset: number) => {
    const now = new Date();
    const targetMonth = now.getMonth() + monthOffset;
    const targetYear = now.getFullYear() + Math.floor(targetMonth / 12);
    const normalizedMonth = ((targetMonth % 12) + 12) % 12;

    const barberApts = allAppointments.filter((a) => {
      if (a.barberId !== barberId || a.status !== "completed") return false;
      const d = new Date(a.date + "T12:00:00");
      return d.getMonth() === normalizedMonth && d.getFullYear() === targetYear;
    });

    const totals: Record<string, { qty: number; total: number; type: "serviço" | "produto" }> = {};
    barberApts.forEach((apt) => {
      const svcIds = apt.serviceIds?.length ? apt.serviceIds : apt.serviceId ? [apt.serviceId] : [];
      svcIds.forEach((sid) => {
        const svc = mockServices.find((s) => s.id === sid);
        if (svc) {
          if (!totals[svc.name]) totals[svc.name] = { qty: 0, total: 0, type: "serviço" };
          totals[svc.name].qty += 1;
          totals[svc.name].total += svc.price;
        }
      });
    });

    // Simulated product sales for demo
    if (monthOffset === 0) {
      mockProducts.forEach((p) => {
        totals[p.name] = { qty: 1, total: p.sellPrice, type: "produto" };
      });
    }

    return totals;
  };

  const currentItems = selectedBarberId ? getMonthlyItems(selectedBarberId, 0) : {};
  const prevItems = selectedBarberId ? getMonthlyItems(selectedBarberId, -1) : {};

  const getGrowth = (name: string) => {
    const current = currentItems[name]?.total || 0;
    const prev = prevItems[name]?.total || 0;
    if (prev === 0 && current === 0) return 0;
    if (prev === 0) return 100;
    return ((current - prev) / prev) * 100;
  };

  const getTotalReceivable = (barberId: string) => {
    const barber = barbers.find((b) => b.id === barberId);
    if (!barber) return 0;
    const now = new Date();
    const barberApts = allAppointments.filter((a) => {
      if (a.barberId !== barberId || a.status !== "completed") return false;
      const d = new Date(a.date + "T12:00:00");
      return d <= now;
    });

    let total = 0;
    barberApts.forEach((apt) => {
      const svcIds = apt.serviceIds?.length ? apt.serviceIds : apt.serviceId ? [apt.serviceId] : [];
      svcIds.forEach((sid) => {
        const svc = mockServices.find((s) => s.id === sid);
        if (svc) total += svc.price * (barber.commission / 100);
      });
    });
    return total;
  };

  const totalReceivable = selectedBarberId ? getTotalReceivable(selectedBarberId) : 0;
  const monthName = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const allItemNames = Object.keys(currentItems);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">



        <div>
          <h1 className="page-title">Barbeiros</h1>
          <p className="text-muted-foreground font-light mt-1">Cadastro e desempenho</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
          className="organic-btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Novo Barbeiro
        </motion.button>
      </div>

      {/* Active barbers count */}
      <div className="organic-card !py-3 !px-4 flex items-center gap-3 w-fit">
        <Users size={16} className="text-muted-foreground" />
        <span className="text-sm">
          <span className="font-medium">{barbers.filter(b => b.active !== false).length}</span>
          <span className="text-muted-foreground ml-1">barbeiro{barbers.filter(b => b.active !== false).length !== 1 ? "s" : ""} ativo{barbers.filter(b => b.active !== false).length !== 1 ? "s" : ""}</span>
        </span>
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
            <h3 className="section-title">{editingId ? "Editar Barbeiro" : "Novo Barbeiro"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Nome completo"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="organic-input"
              />
              <input
                placeholder="CPF/CNPJ"
                value={form.cpfCnpj}
                onChange={(e) => setForm({ ...form, cpfCnpj: e.target.value })}
                className="organic-input"
              />
              <input
                placeholder="Endereço"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="organic-input"
              />
              <input
                placeholder="Telefone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="organic-input"
              />
              <input
                placeholder="Comissão (%)"
                type="number"
                value={form.commission}
                onChange={(e) => setForm({ ...form, commission: e.target.value })}
                className="organic-input"
              />
              <select
                value={form.paymentDay}
                onChange={(e) => setForm({ ...form, paymentDay: e.target.value })}
                className="organic-input"
              >
                <option value="">Dia de Pagamento</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>Dia {d}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} className="organic-btn-primary">Salvar</button>
              <button onClick={resetForm} className="organic-btn-secondary">Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barbers list */}
      <div className="space-y-3">
        {barbers.map((barber, i) => {
          const isSelected = selectedBarberId === barber.id;
          const isActive = barber.active !== false;
          return (
            <MotionContainer key={barber.id} delay={i * 0.03}>
              <div
                className={`organic-card !p-4 cursor-pointer transition-all duration-200 ${isSelected ? "ring-2 ring-primary/30" : ""} ${!isActive ? "opacity-60" : ""}`}
                onClick={() => setSelectedBarberId(isSelected ? null : barber.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? "bg-primary/10" : "bg-muted"}`}>
                      <User size={18} className={isActive ? "text-primary" : "text-muted-foreground"} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{barber.name}</p>
                        {!isActive && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Inativo</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-light">{barber.phone} · {barber.cpfCnpj || "Sem CPF"}</p>
                      <p className="text-xs text-muted-foreground font-light">{barber.address || "Sem endereço"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">
                      {barber.commission}% comissão
                    </span>
                    {barber.paymentDay && (
                      <span className="text-xs bg-secondary text-muted-foreground px-3 py-1 rounded-full">
                        Pgto dia {barber.paymentDay}
                      </span>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); toggleBarberActive(barber); }}
                      className={`p-1.5 rounded-full transition-colors ${isActive ? "hover:bg-success/10" : "hover:bg-destructive/10"}`}
                      title={isActive ? "Desativar barbeiro" : "Ativar barbeiro"}
                    >
                      <Power size={14} className={isActive ? "text-success" : "text-destructive"} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); handleEdit(barber); }}
                      className="p-1.5 rounded-full hover:bg-secondary transition-colors"
                    >
                      <Edit2 size={14} className="text-muted-foreground" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.setAttribute("data-barber-id", barber.id);
                        fileInputRef.current?.click();
                      }}
                      className="p-1.5 rounded-full hover:bg-secondary transition-colors"
                      title="Anexar arquivo"
                    >
                      <Paperclip size={14} className="text-muted-foreground" />
                    </motion.button>
                  </div>
                </div>

                {/* Attachments */}
                {(barber.attachments?.length ?? 0) > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {barber.attachments!.map((att) => (
                      <span key={att.id} className="flex items-center gap-1.5 text-xs bg-secondary px-3 py-1.5 rounded-full">
                        <FileText size={12} />
                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="hover:underline" onClick={(e) => e.stopPropagation()}>
                          {att.name}
                        </a>
                        <span className="text-muted-foreground">({att.date})</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeAttachment(barber.id, att.id); }}
                          className="hover:text-destructive transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </MotionContainer>
          );
        })}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const barberId = fileInputRef.current?.getAttribute("data-barber-id");
          if (barberId) handleFileAttach(barberId, e.target.files);
          e.target.value = "";
        }}
      />

      {/* Selected barber details: chart + receivable */}
      <AnimatePresence mode="wait">
        {selectedBarber && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MotionContainer delay={0}>
                <div className="organic-card text-center">
                  <p className="stat-label">Total a Receber até Hoje</p>
                  <p className="stat-value text-accent">R$ {totalReceivable.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedBarber.name} · {selectedBarber.commission}% comissão</p>
                </div>
              </MotionContainer>
              <MotionContainer delay={0.05}>
                <div className="organic-card text-center">
                  <p className="stat-label">Atendimentos Concluídos</p>
                  <p className="stat-value">
                    {allAppointments.filter((a) => a.barberId === selectedBarberId && a.status === "completed").length}
                  </p>
                </div>
              </MotionContainer>
              <MotionContainer delay={0.1}>
                <div className="organic-card text-center">
                  <p className="stat-label">Arquivos Anexados</p>
                  <p className="stat-value">{selectedBarber.attachments?.length || 0}</p>
                </div>
              </MotionContainer>
            </div>

            <MotionContainer delay={0.15}>
              <div className="organic-card">
                <h3 className="section-title mb-4 capitalize">Vendas — {monthName}</h3>
                {allItemNames.length > 0 ? (
                  <div className="space-y-3">
                    {allItemNames.map((name) => {
                      const item = currentItems[name];
                      const growth = getGrowth(name);
                      return (
                        <div key={name} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{name}</p>
                            <p className="text-xs text-muted-foreground font-light">
                              {item.type === "serviço" ? `${item.qty}x serviço` : `${item.qty}x produto`}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="text-sm font-medium">R$ {item.total.toFixed(2)}</p>
                            <div className={`flex items-center gap-1 text-xs font-medium min-w-[70px] justify-end ${
                              growth > 0 ? "text-success" : growth < 0 ? "text-destructive" : "text-muted-foreground"
                            }`}>
                              {growth > 0 ? <TrendingUp size={14} /> : growth < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                              <span>{growth > 0 ? "+" : ""}{growth.toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-sm font-medium">Total do mês</p>
                      <p className="text-sm font-medium text-accent">
                        R$ {Object.values(currentItems).reduce((acc, i) => acc + i.total, 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-8">Nenhuma venda registrada neste mês</p>
                )}
              </div>
            </MotionContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Barbers;
