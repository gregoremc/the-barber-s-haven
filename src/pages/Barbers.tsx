import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Paperclip, X, User, FileText, Download } from "lucide-react";
import MotionContainer from "@/components/MotionContainer";
import { mockBarbers, mockAppointments, mockServices, mockProducts } from "@/data/mockData";
import { Barber, BarberAttachment } from "@/types/barbershop";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

const Barbers = () => {
  const [barbers, setBarbers] = useState<Barber[]>(mockBarbers);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", cpfCnpj: "", address: "", phone: "", commission: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setForm({ name: "", cpfCnpj: "", address: "", phone: "", commission: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = () => {
    if (!form.name || !form.phone) return;
    if (editingId) {
      setBarbers((prev) =>
        prev.map((b) =>
          b.id === editingId
            ? { ...b, name: form.name, cpfCnpj: form.cpfCnpj, address: form.address, phone: form.phone, commission: Number(form.commission) || b.commission }
            : b
        )
      );
    } else {
      setBarbers((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          name: form.name,
          cpfCnpj: form.cpfCnpj,
          address: form.address,
          phone: form.phone,
          commission: Number(form.commission) || 50,
          attachments: [],
        },
      ]);
    }
    resetForm();
  };

  const handleEdit = (barber: Barber) => {
    setForm({ name: barber.name, cpfCnpj: barber.cpfCnpj || "", address: barber.address || "", phone: barber.phone, commission: String(barber.commission) });
    setEditingId(barber.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setBarbers((prev) => prev.filter((b) => b.id !== id));
    if (selectedBarberId === id) setSelectedBarberId(null);
  };

  const handleFileAttach = (barberId: string, files: FileList | null) => {
    if (!files) return;
    const newAttachments: BarberAttachment[] = Array.from(files).map((file) => ({
      id: String(Date.now()) + Math.random().toString(36).slice(2),
      name: file.name,
      url: URL.createObjectURL(file),
      date: new Date().toLocaleDateString("pt-BR"),
    }));
    setBarbers((prev) =>
      prev.map((b) =>
        b.id === barberId
          ? { ...b, attachments: [...(b.attachments || []), ...newAttachments] }
          : b
      )
    );
  };

  const removeAttachment = (barberId: string, attachmentId: string) => {
    setBarbers((prev) =>
      prev.map((b) =>
        b.id === barberId
          ? { ...b, attachments: (b.attachments || []).filter((a) => a.id !== attachmentId) }
          : b
      )
    );
  };

  // Chart data: monthly services/products for selected barber
  const selectedBarber = barbers.find((b) => b.id === selectedBarberId);

  const getMonthlyChartData = (barberId: string) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // completed appointments this month for this barber
    const barberApts = mockAppointments.filter((a) => {
      if (a.barberId !== barberId || a.status !== "completed") return false;
      const d = new Date(a.date + "T12:00:00");
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const serviceTotals: Record<string, number> = {};
    barberApts.forEach((apt) => {
      const svcIds = apt.serviceIds?.length ? apt.serviceIds : apt.serviceId ? [apt.serviceId] : [];
      svcIds.forEach((sid) => {
        const svc = mockServices.find((s) => s.id === sid);
        if (svc) {
          serviceTotals[svc.name] = (serviceTotals[svc.name] || 0) + svc.price;
        }
      });
    });

    // Products (simulated: each product sold once for demo)
    mockProducts.forEach((p) => {
      serviceTotals[p.name] = (serviceTotals[p.name] || 0) + p.sellPrice;
    });

    return Object.entries(serviceTotals).map(([name, total]) => ({
      name,
      total,
    }));
  };

  const getTotalReceivable = (barberId: string) => {
    const barber = barbers.find((b) => b.id === barberId);
    if (!barber) return 0;
    const now = new Date();
    const barberApts = mockAppointments.filter((a) => {
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

  const chartData = selectedBarberId ? getMonthlyChartData(selectedBarberId) : [];
  const totalReceivable = selectedBarberId ? getTotalReceivable(selectedBarberId) : 0;

  const chartConfig = {
    total: {
      label: "Valor (R$)",
      color: "hsl(28, 40%, 50%)",
    },
  };

  const monthName = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

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
          return (
            <MotionContainer key={barber.id} delay={i * 0.03}>
              <div
                className={`organic-card !p-4 cursor-pointer transition-all duration-200 ${isSelected ? "ring-2 ring-primary/30" : ""}`}
                onClick={() => setSelectedBarberId(isSelected ? null : barber.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{barber.name}</p>
                      <p className="text-xs text-muted-foreground font-light">{barber.phone} · {barber.cpfCnpj || "Sem CPF"}</p>
                      <p className="text-xs text-muted-foreground font-light">{barber.address || "Sem endereço"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">
                      {barber.commission}% comissão
                    </span>
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
                      onClick={(e) => { e.stopPropagation(); handleDelete(barber.id); }}
                      className="p-1.5 rounded-full hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 size={14} className="text-destructive" />
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
                    {mockAppointments.filter((a) => a.barberId === selectedBarberId && a.status === "completed").length}
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
                {chartData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="total" fill="var(--color-total)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
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
