import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Crown,
  Moon,
  Sun,
  Trash2,
  Settings,
  X,
} from "lucide-react";
import { shopStore } from "@/data/shopStore";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/products", icon: Package, label: "Fornecedores/Produtos" },
  { to: "/services", icon: Scissors, label: "Serviços" },
  { to: "/plans", icon: Crown, label: "Planos" },
  { to: "/schedule", icon: CalendarDays, label: "Agenda" },
  { to: "/payments", icon: Wallet, label: "Pagamentos" },
  { to: "/bills", icon: FileText, label: "Contas" },
  { to: "/calculator", icon: Calculator, label: "Calculadora" },
  { to: "/barbers", icon: UserCheck, label: "Barbeiros" },
  { to: "/clients", icon: Users, label: "Clientes" },
];

const COLLAPSED_WIDTH = 72;
const EXPANDED_WIDTH = 256;

const AppSidebar = () => {
  const location = useLocation();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const shop = useSyncExternalStore(shopStore.subscribe, shopStore.getSettings);
  const [settingsForm, setSettingsForm] = useState({ name: shop.name, subtitle: shop.subtitle, openTime: shop.openTime, closeTime: shop.closeTime, weekendOpenTime: shop.weekendOpenTime, weekendCloseTime: shop.weekendCloseTime, workingDays: { ...shop.workingDays } });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hovered, setHovered] = useState(false);

  const expanded = hovered;

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  const openSettings = () => {
    setSettingsForm({ name: shop.name, subtitle: shop.subtitle, openTime: shop.openTime, closeTime: shop.closeTime, weekendOpenTime: shop.weekendOpenTime, weekendCloseTime: shop.weekendCloseTime, workingDays: { ...shop.workingDays } });
    setShowSettings(true);
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    shopStore.update({ logoUrl: url });
    e.target.value = "";
  };

  const handleSaveSettings = () => {
    shopStore.update({ name: settingsForm.name || "BarberShop", subtitle: settingsForm.subtitle });
    setShowSettings(false);
  };

  return (
    <>
      <motion.aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        animate={{ width: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="fixed left-0 top-0 h-screen bg-card border-r border-border/50 flex flex-col z-50 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 flex items-center gap-3" style={{ minHeight: 80 }}>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
            {shop.logoUrl ? (
              <img src={shop.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Scissors size={20} strokeWidth={1.5} className="text-primary" />
            )}
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl font-medium tracking-tight text-foreground truncate whitespace-nowrap">
                      {shop.name}
                    </h1>
                    <p className="text-xs text-muted-foreground font-light truncate whitespace-nowrap">
                      {shop.subtitle}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 45 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    onClick={openSettings}
                    className="p-1.5 rounded-lg hover:bg-secondary transition-colors flex-shrink-0"
                    title="Configurações"
                  >
                    <Settings size={15} className="text-muted-foreground" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink key={item.to} to={item.to}>
                <motion.div
                  whileHover={{ x: expanded ? 4 : 0 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  title={!expanded ? item.label : undefined}
                >
                  <item.icon size={18} strokeWidth={1.5} className="flex-shrink-0" />
                  <AnimatePresence>
                    {expanded && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 space-y-2">
          <NavLink to="/trash">
            <motion.div
              whileHover={{ x: expanded ? 4 : 0 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors duration-200 ${
                location.pathname === "/trash"
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
              title={!expanded ? "Lixeira" : undefined}
            >
              <Trash2 size={18} strokeWidth={1.5} className="flex-shrink-0" />
              <AnimatePresence>
                {expanded && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    Lixeira
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </NavLink>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => setDark(!dark)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title={!expanded ? (dark ? "Modo Claro" : "Modo Escuro") : undefined}
          >
            {dark ? <Sun size={18} strokeWidth={1.5} className="flex-shrink-0" /> : <Moon size={18} strokeWidth={1.5} className="flex-shrink-0" />}
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  {dark ? "Modo Claro" : "Modo Escuro"}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="organic-card !p-4">
                  <p className="text-xs text-muted-foreground font-light">Hoje</p>
                  <p className="text-sm font-medium mt-1 whitespace-nowrap">
                    {new Date().toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed inset-0 z-[61] flex items-center justify-center pointer-events-none"
            >
              <div className="w-full max-w-md pointer-events-auto organic-card space-y-5 mx-4">
                <div className="flex items-center justify-between">
                  <h3 className="section-title">Configurações da Barbearia</h3>
                  <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                    <X size={16} className="text-muted-foreground" />
                  </button>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-2xl bg-secondary border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center overflow-hidden transition-colors cursor-pointer"
                  >
                    {shop.logoUrl ? (
                      <img src={shop.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Scissors size={32} strokeWidth={1.5} className="text-muted-foreground" />
                    )}
                  </motion.button>
                  <p className="text-xs text-muted-foreground">Clique para alterar a logo</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoSelect}
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1 block">Nome da Barbearia</label>
                    <input
                      value={settingsForm.name}
                      onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                      className="organic-input"
                      placeholder="Nome da barbearia"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1 block">Subtítulo</label>
                    <input
                      value={settingsForm.subtitle}
                      onChange={(e) => setSettingsForm({ ...settingsForm, subtitle: e.target.value })}
                      className="organic-input"
                      placeholder="Ex: Gestão Inteligente"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={handleSaveSettings} className="organic-btn-primary flex-1">Salvar</button>
                  <button onClick={() => setShowSettings(false)} className="organic-btn-secondary flex-1">Cancelar</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AppSidebar;
