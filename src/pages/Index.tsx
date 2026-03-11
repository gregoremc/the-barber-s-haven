import { useState, useSyncExternalStore } from "react";
import NewAppointmentModal from "@/components/NewAppointmentModal";
import RescheduleModal from "@/components/RescheduleModal";
import {
  DollarSign,
  CalendarDays,
  TrendingUp,
  CheckCircle2,
  ShoppingCart,
  Plus,
  X,
  CalendarClock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StatCard from "@/components/StatCard";
import MotionContainer from "@/components/MotionContainer";
import { billsStore } from "@/data/billsStore";
import { appointmentsStore } from "@/data/appointmentsStore";
import { barbersStore } from "@/data/barbersStore";
import { servicesStore } from "@/data/servicesStore";
import { paymentsStore } from "@/data/paymentsStore";
import { revenueStore } from "@/data/revenueStore";
import { productsStore } from "@/data/productsStore";
import { plansStore } from "@/data/plansStore";
import { toast } from "@/hooks/use-toast";

const HIDDEN_KEY = "dashboard_hidden_cards";

const getHidden = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_KEY) || "{}");
  } catch {
    return {};
  }
};

const Dashboard = () => {
  
  const [hiddenCards, setHiddenCards] = useState<Record<string, boolean>>(getHidden);
  const appointments = useSyncExternalStore(appointmentsStore.subscribe, appointmentsStore.getAppointments);
  const barbers = useSyncExternalStore(barbersStore.subscribe, barbersStore.getBarbers);
  const services = useSyncExternalStore(servicesStore.subscribe, servicesStore.getServices);
  const products = useSyncExternalStore(productsStore.subscribe, productsStore.getProducts);
  useSyncExternalStore(revenueStore.subscribe, revenueStore.getEntries);
  const allPlans = useSyncExternalStore(plansStore.subscribe, plansStore.getPlans);
  const [rescheduleApt, setRescheduleApt] = useState<any>(null);

  const activeBarbers = barbers.filter((b) => b.active !== false);

  // Helper: detect plan for appointment
  const getPlanForAppointment = (apt: any) => {
    if (apt.planId) {
      return allPlans.find((p: any) => p.id === apt.planId) || null;
    }
    return null;
  };

  // Sale modal state
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleProductId, setSaleProductId] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [saleSeller, setSaleSeller] = useState("establishment");

  const openSaleModal = () => {
    setSaleProductId(products.filter((p) => p.stock > 0)[0]?.id || "");
    setSaleQuantity("1");
    setSaleSeller("establishment");
    setShowSaleModal(true);
  };

  const handleSale = () => {
    const product = products.find((p) => p.id === saleProductId);
    if (!product) return;
    const qty = Number(saleQuantity);
    if (qty <= 0 || qty > product.stock) {
      toast({ title: "Quantidade inválida", description: `Estoque disponível: ${product.stock}`, variant: "destructive" });
      return;
    }
    productsStore.updateProduct(product.id, { stock: product.stock - qty });
    const totalSaleValue = product.sellPrice * qty;
    revenueStore.addEntry({
      id: String(Date.now()) + Math.random().toString(36).slice(2),
      type: "product",
      amount: totalSaleValue,
      date: new Date().toISOString().split("T")[0],
      description: `${qty}x ${product.name}`,
    });
    if (saleSeller !== "establishment") {
      const barber = activeBarbers.find((b) => b.id === saleSeller);
      if (barber) {
        const commissionAmount = totalSaleValue * (product.commission / 100);
        paymentsStore.addPayment({
          id: String(Date.now()),
          barberId: barber.id,
          amount: commissionAmount,
          date: new Date().toISOString().split("T")[0],
          description: `Venda: ${qty}x ${product.name} (${product.commission}%)`,
          status: "pending",
        });
      }
    }
    toast({ title: "Venda registrada!", description: `${qty}x ${product.name} — R$ ${totalSaleValue.toFixed(2)}` });
    setShowSaleModal(false);
  };

  const toggle = (key: string) => {
    setHiddenCards((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
      return next;
    });
  };

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();

  const todayAppointments = appointments.filter(
    (a) => a.date === today && a.status === "scheduled"
  ).length;

  const todayCompletedList = appointments.filter(
    (a) => a.date === today && a.status === "completed"
  );
  const todayCompleted = todayCompletedList.length;

  const bills = useSyncExternalStore(billsStore.subscribe, billsStore.getBills);
  const pendingBills = bills.filter((b) => b.status !== "paid").reduce(
    (acc, b) => acc + b.amount,
    0
  );

  // Real monthly revenue from revenueStore
  const monthRevenue = revenueStore.getMonthRevenue(now.getFullYear(), now.getMonth());

  const todayScheduled = appointments.filter(
    (a) => a.date === today && a.status === "scheduled"
  );

  const barberGroups = barbers
    .map((barber) => ({
      barber,
      appointments: todayScheduled
        .filter((a) => a.barberId === barber.id)
        .sort((a, b) => a.time.localeCompare(b.time)),
    }))
    .filter((g) => g.appointments.length > 0);

  const handleComplete = (aptId: string) => {
    const apt = appointments.find((a) => a.id === aptId);
    if (!apt) return;

    const plan = getPlanForAppointment(apt);
    const serviceIds = apt.serviceIds?.length ? apt.serviceIds : [apt.serviceId];

    if (plan) {
      // Plan appointment: use plan price
      const description = `Plano: ${plan.name}`;
      revenueStore.addEntry({
        id: String(Date.now()) + Math.random().toString(36).slice(2),
        type: "plan",
        amount: plan.price,
        date: apt.date,
        description,
      });
      const barber = barbers.find((b) => b.id === apt.barberId);
      if (barber) {
        const commissionAmount = plan.price * (barber.commission / 100);
        if (commissionAmount > 0) {
          paymentsStore.addPayment({
            id: String(Date.now()) + Math.random().toString(36).slice(2),
            barberId: barber.id,
            amount: commissionAmount,
            date: apt.date,
            description: `Comissão: ${description}`,
            status: "pending",
          });
        }
      }
    } else {
      // Regular appointment
      const totalServices = serviceIds.reduce((acc, sid) => {
        const svc = services.find((s) => s.id === sid);
        return acc + (svc?.price || 0);
      }, 0);
      const svcNames = serviceIds.map((sid) => services.find((s) => s.id === sid)?.name).filter(Boolean).join(", ");

      revenueStore.addEntry({
        id: String(Date.now()) + Math.random().toString(36).slice(2),
        type: "service",
        amount: totalServices,
        date: apt.date,
        description: svcNames,
      });

      const barber = barbers.find((b) => b.id === apt.barberId);
      if (barber) {
        const commissionAmount = totalServices * (barber.commission / 100);
        if (commissionAmount > 0) {
          paymentsStore.addPayment({
            id: String(Date.now()) + Math.random().toString(36).slice(2),
            barberId: barber.id,
            amount: commissionAmount,
            date: apt.date,
            description: `Comissão: ${svcNames}`,
            status: "pending",
          });
        }
      }
    }

    appointmentsStore.updateStatus(aptId, "completed");
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-muted-foreground font-light mt-1">
          Visão geral da sua barbearia
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <StatCard
          label="Receita do Mês"
          value={`R$ ${monthRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          trend="Serviços concluídos + vendas"
          trendUp={monthRevenue > 0}
          delay={0}
          hideable
          hidden={!!hiddenCards.revenue}
          onToggleVisibility={() => toggle("revenue")}
        />
        <StatCard
          label="Agendamentos Hoje"
          value={String(todayAppointments)}
          icon={CalendarDays}
          trend={`${todayCompleted} concluído(s)`}
          trendUp
          delay={0.05}
        />
        <StatCard
          label="Contas Pendentes"
          value={`R$ ${pendingBills.toLocaleString("pt-BR")}`}
          icon={TrendingUp}
          trend="3 contas em aberto"
          delay={0.1}
          hideable
          hidden={!!hiddenCards.bills}
          onToggleVisibility={() => toggle("bills")}
        />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-title">Agendamentos de Hoje</h2>
        <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={() => setShowAppointmentModal(true)}
          className="organic-btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Novo Agendamento
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={openSaleModal}
          className="organic-btn-secondary flex items-center gap-2"
        >
          <ShoppingCart size={16} />
          Registrar Venda De Produto
        </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {barberGroups.length > 0 ? (
          barberGroups.map((group, i) => (
            <MotionContainer key={group.barber.id} delay={0.2 + i * 0.05}>
              <div className="organic-card space-y-4">
                <h2 className="section-title flex items-center gap-2">
                  <CalendarDays size={18} strokeWidth={1.5} />
                  {group.barber.name}
                </h2>
                <div className="space-y-3">
                  {group.appointments.map((apt) => {
                    const serviceIds = apt.serviceIds?.length ? apt.serviceIds : [apt.serviceId];
                    const serviceNames = serviceIds
                      .map((sid) => services.find((s) => s.id === sid)?.name)
                      .filter(Boolean)
                      .join(", ");
                    return (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between py-3 border-b border-border/40 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium">{apt.clientName}</p>
                          <p className="text-xs text-muted-foreground font-light">
                            {serviceNames} · {apt.time}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-secondary px-3 py-1 rounded-full text-muted-foreground">
                            {apt.time}
                          </span>
                          <button
                            onClick={() => setRescheduleApt(apt)}
                            className="flex items-center gap-1 text-xs bg-accent/10 text-accent px-3 py-1 rounded-full hover:bg-accent/20 transition-colors"
                            title="Reagendar"
                          >
                            <CalendarClock size={14} />
                          </button>
                          <button
                            onClick={() => handleComplete(apt.id)}
                            className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1 rounded-full hover:bg-primary/20 transition-colors"
                            title="Marcar como concluído"
                          >
                            <CheckCircle2 size={14} />
                            Concluído
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </MotionContainer>
          ))
        ) : (
          <MotionContainer delay={0.2}>
            <div className="organic-card space-y-4">
              <h2 className="section-title flex items-center gap-2">
                <CalendarDays size={18} strokeWidth={1.5} />
                Agendamentos de Hoje
              </h2>
              <p className="text-sm text-muted-foreground">Nenhum agendamento para hoje.</p>
            </div>
          </MotionContainer>
        )}
      </div>

      {/* Completed today */}
      {todayCompletedList.length > 0 && (
        <div>
          <h2 className="section-title mb-4">Concluídos Hoje</h2>
          <MotionContainer delay={0.3}>
            <div className="organic-card space-y-3">
              {todayCompletedList.map((apt) => {
                const barber = barbers.find((b) => b.id === apt.barberId);
                const barberFirstName = barber?.name.split(" ")[0] || "—";
                const serviceIds = apt.serviceIds?.length ? apt.serviceIds : [apt.serviceId];
                const totalValue = serviceIds.reduce((acc, sid) => {
                  const svc = services.find((s) => s.id === sid);
                  return acc + (svc?.price || 0);
                }, 0);
                const svcNames = serviceIds.map((sid) => services.find((s) => s.id === sid)?.name).filter(Boolean).join(", ");
                return (
                  <div key={apt.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{apt.clientName}</p>
                      <p className="text-xs text-muted-foreground">{svcNames} · {barberFirstName}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary">R$ {totalValue.toFixed(2)}</span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-sm font-bold text-primary">
                  R$ {todayCompletedList.reduce((acc, apt) => {
                    const sids = apt.serviceIds?.length ? apt.serviceIds : [apt.serviceId];
                    return acc + sids.reduce((s, sid) => s + (services.find((sv) => sv.id === sid)?.price || 0), 0);
                  }, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </MotionContainer>
        </div>
      )}

      {/* Sale modal */}
      <AnimatePresence>
        {showSaleModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowSaleModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="organic-card w-full max-w-md mx-4 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="section-title">Registrar Venda de Produto</h3>
                <button onClick={() => setShowSaleModal(false)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Produto</label>
                  <select value={saleProductId} onChange={(e) => setSaleProductId(e.target.value)} className="organic-input">
                    {products.filter((p) => p.stock > 0).map((p) => (
                      <option key={p.id} value={p.id}>{p.name} (estoque: {p.stock}) — R$ {p.sellPrice.toFixed(2)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Quantidade</label>
                  <input type="number" min="1" value={saleQuantity} onChange={(e) => setSaleQuantity(e.target.value)} className="organic-input" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Vendedor</label>
                  <select value={saleSeller} onChange={(e) => setSaleSeller(e.target.value)} className="organic-input">
                    <option value="establishment">Estabelecimento</option>
                    {activeBarbers.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                {saleSeller !== "establishment" && saleProductId && (() => {
                  const p = products.find((pr) => pr.id === saleProductId);
                  if (!p) return null;
                  const qty = Number(saleQuantity) || 0;
                  const total = p.sellPrice * qty;
                  const commission = total * (p.commission / 100);
                  return (
                    <div className="p-3 rounded-lg bg-secondary/50 text-sm">
                      <p>Total da venda: <strong>R$ {total.toFixed(2)}</strong></p>
                      <p className="text-muted-foreground">Comissão ({p.commission}%): <strong className="text-foreground">R$ {commission.toFixed(2)}</strong></p>
                    </div>
                  );
                })()}
              </div>
              <div className="flex gap-3">
                <button onClick={handleSale} className="organic-btn-primary flex-1">Confirmar Venda</button>
                <button onClick={() => setShowSaleModal(false)} className="organic-btn-secondary">Cancelar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <NewAppointmentModal open={showAppointmentModal} onClose={() => setShowAppointmentModal(false)} />

      {rescheduleApt && (
        <RescheduleModal
          open={!!rescheduleApt}
          onClose={() => setRescheduleApt(null)}
          appointmentId={rescheduleApt.id}
          currentDate={rescheduleApt.date}
          currentTime={rescheduleApt.time}
          clientName={rescheduleApt.clientName}
        />
      )}
    </div>
  );
};

export default Dashboard;
