import { useState, useSyncExternalStore } from "react";
import {
  DollarSign,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import MotionContainer from "@/components/MotionContainer";
import { mockBills } from "@/data/mockData";
import { appointmentsStore } from "@/data/appointmentsStore";
import { barbersStore } from "@/data/barbersStore";
import { servicesStore } from "@/data/servicesStore";
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

  const toggle = (key: string) => {
    setHiddenCards((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
      return next;
    });
  };

  const today = new Date().toISOString().slice(0, 10);

  const todayAppointments = appointments.filter(
    (a) => a.date === today && a.status === "scheduled"
  ).length;

  const todayCompleted = appointments.filter(
    (a) => a.date === today && a.status === "completed"
  ).length;

  const pendingBills = mockBills.filter((b) => b.status !== "paid").reduce(
    (acc, b) => acc + b.amount,
    0
  );

  const monthRevenue = 12450;

  // Today's scheduled appointments grouped by barber
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
          value={`R$ ${monthRevenue.toLocaleString("pt-BR")}`}
          icon={DollarSign}
          trend="+12% vs mês anterior"
          trendUp
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
                        <span className="text-xs bg-secondary px-3 py-1 rounded-full text-muted-foreground">
                          {apt.time}
                        </span>
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
    </div>
  );
};

export default Dashboard;
