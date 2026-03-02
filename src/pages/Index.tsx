import { useState } from "react";
import {
  DollarSign,
  Package,
  Scissors,
  CalendarDays,
  TrendingUp,
  Users,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import MotionContainer from "@/components/MotionContainer";
import { mockAppointments, mockProducts, mockServices, mockBills } from "@/data/mockData";

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

  const toggle = (key: string) => {
    setHiddenCards((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
      return next;
    });
  };

  const todayAppointments = mockAppointments.filter(
    (a) => a.date === "2026-03-02" && a.status === "scheduled"
  ).length;

  const todayCompleted = mockAppointments.filter(
    (a) => a.date === "2026-03-02" && a.status === "completed"
  ).length;

  const totalProductsValue = mockProducts.reduce(
    (acc, p) => acc + p.sellPrice * p.stock,
    0
  );

  const pendingBills = mockBills.filter((b) => b.status !== "paid").reduce(
    (acc, b) => acc + b.amount,
    0
  );

  const monthRevenue = 12450;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-muted-foreground font-light mt-1">
          Visão geral da sua barbearia
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
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
          label="Estoque em Produtos"
          value={`R$ ${totalProductsValue.toLocaleString("pt-BR")}`}
          icon={Package}
          delay={0.1}
          hideable
          hidden={!!hiddenCards.stock}
          onToggleVisibility={() => toggle("stock")}
        />
        <StatCard
          label="Contas Pendentes"
          value={`R$ ${pendingBills.toLocaleString("pt-BR")}`}
          icon={TrendingUp}
          trend="3 contas em aberto"
          delay={0.15}
          hideable
          hidden={!!hiddenCards.bills}
          onToggleVisibility={() => toggle("bills")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MotionContainer delay={0.2}>
          <div className="organic-card space-y-4">
            <h2 className="section-title flex items-center gap-2">
              <CalendarDays size={18} strokeWidth={1.5} />
              Próximos Agendamentos
            </h2>
            <div className="space-y-3">
              {mockAppointments
                .filter((a) => a.status === "scheduled")
                .slice(0, 4)
                .map((apt) => {
                  const service = mockServices.find((s) => s.id === apt.serviceId);
                  return (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between py-3 border-b border-border/40 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{apt.clientName}</p>
                        <p className="text-xs text-muted-foreground font-light">
                          {service?.name} · {apt.time}
                        </p>
                      </div>
                      <span className="text-xs bg-secondary px-3 py-1 rounded-full text-muted-foreground">
                        {apt.date === "2026-03-02" ? "Hoje" : apt.date}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </MotionContainer>

        <MotionContainer delay={0.25}>
          <div className="organic-card space-y-4">
            <h2 className="section-title flex items-center gap-2">
              <Scissors size={18} strokeWidth={1.5} />
              Serviços Populares
            </h2>
            <div className="space-y-3">
              {mockServices.slice(0, 4).map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between py-3 border-b border-border/40 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{service.name}</p>
                    <p className="text-xs text-muted-foreground font-light">
                      {service.duration} min
                    </p>
                  </div>
                  <span className="text-sm font-medium">
                    R$ {service.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </MotionContainer>
      </div>

      <MotionContainer delay={0.3}>
        <div className="organic-card space-y-4">
          <h2 className="section-title flex items-center gap-2">
            <Users size={18} strokeWidth={1.5} />
            Estoque Baixo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockProducts
              .filter((p) => p.stock < 10)
              .map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/50"
                >
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground font-light">
                      {product.category}
                    </p>
                  </div>
                  <span className="text-xs bg-warning/10 text-warning-foreground px-3 py-1 rounded-full font-medium">
                    {product.stock} un
                  </span>
                </div>
              ))}
          </div>
        </div>
      </MotionContainer>
    </div>
  );
};

export default Dashboard;
