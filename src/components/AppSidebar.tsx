import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Scissors,
  CalendarDays,
  Wallet,
  FileText,
  Calculator,
  Users,
  UserCheck,
  Moon,
  Sun,
  Trash2,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/products", icon: Package, label: "Produtos" },
  { to: "/services", icon: Scissors, label: "Serviços" },
  { to: "/schedule", icon: CalendarDays, label: "Agenda" },
  { to: "/payments", icon: Wallet, label: "Pagamentos" },
  { to: "/bills", icon: FileText, label: "Contas" },
  { to: "/calculator", icon: Calculator, label: "Calculadora" },
  { to: "/barbers", icon: UserCheck, label: "Barbeiros" },
  { to: "/clients", icon: Users, label: "Clientes" },
];

const AppSidebar = () => {
  const location = useLocation();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border/50 flex flex-col z-50">
      <div className="p-8">
        <h1 className="text-xl font-medium tracking-tight text-foreground">
          BarberShop
        </h1>
        <p className="text-xs text-muted-foreground mt-1 font-light">
          Gestão Inteligente
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink key={item.to} to={item.to}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon size={18} strokeWidth={1.5} />
                <span>{item.label}</span>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-6 space-y-3">
        <NavLink to="/trash">
          <motion.div
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors duration-200 ${
              location.pathname === "/trash"
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Trash2 size={18} strokeWidth={1.5} />
            <span>Lixeira</span>
          </motion.div>
        </NavLink>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={() => setDark(!dark)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          {dark ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
          <span>{dark ? "Modo Claro" : "Modo Escuro"}</span>
        </motion.button>
        <div className="organic-card !p-4">
          <p className="text-xs text-muted-foreground font-light">Hoje</p>
          <p className="text-sm font-medium mt-1">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
