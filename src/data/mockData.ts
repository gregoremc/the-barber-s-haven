import { Product, Service, Barber, Appointment, BarberPayment, Bill } from "@/types/barbershop";

export const mockProducts: Product[] = [
  { id: "1", name: "Pomada Modeladora", category: "Styling", costPrice: 18, sellPrice: 45, stock: 12, commission: 10, supplierId: "", supplierDebt: 216 },
  { id: "2", name: "Óleo para Barba", category: "Barba", costPrice: 22, sellPrice: 55, stock: 8, commission: 10, supplierId: "", supplierDebt: 176 },
  { id: "3", name: "Shampoo Masculino", category: "Cabelo", costPrice: 15, sellPrice: 38, stock: 20, commission: 10, supplierId: "", supplierDebt: 300 },
  { id: "4", name: "Balm Pós-Barba", category: "Barba", costPrice: 12, sellPrice: 32, stock: 15, commission: 10, supplierId: "", supplierDebt: 180 },
  { id: "5", name: "Cera Fixadora", category: "Styling", costPrice: 20, sellPrice: 50, stock: 6, commission: 10, supplierId: "", supplierDebt: 120 },
];

export const mockServices: Service[] = [
  { id: "1", name: "Corte Masculino", costPrice: 10, price: 50, duration: 40, description: "Corte completo com máquina e tesoura" },
  { id: "2", name: "Barba", costPrice: 5, price: 35, duration: 30, description: "Barba com toalha quente e navalha" },
  { id: "3", name: "Corte + Barba", costPrice: 12, price: 75, duration: 60, description: "Combo completo corte e barba" },
  { id: "4", name: "Pigmentação", costPrice: 25, price: 80, duration: 45, description: "Pigmentação capilar completa" },
  { id: "5", name: "Sobrancelha", costPrice: 3, price: 20, duration: 15, description: "Design de sobrancelha masculina" },
];

export const mockBarbers: Barber[] = [
  { id: "1", name: "Carlos Silva", cpfCnpj: "123.456.789-00", address: "Rua das Flores, 100 - SP", phone: "(11) 99999-1111", commission: 50, attachments: [] },
  { id: "2", name: "André Santos", cpfCnpj: "987.654.321-00", address: "Av. Paulista, 500 - SP", phone: "(11) 99999-2222", commission: 45, attachments: [] },
  { id: "3", name: "Rafael Lima", cpfCnpj: "456.789.123-00", address: "Rua Augusta, 200 - SP", phone: "(11) 99999-3333", commission: 50, attachments: [] },
];

export const mockAppointments: Appointment[] = [];

export const mockBarberPayments: BarberPayment[] = [];

export const mockBills: Bill[] = [
  { id: "1", description: "Aluguel do Espaço", amount: 3500, dueDate: "2026-03-10", category: "Aluguel", status: "pending" },
  { id: "2", description: "Conta de Luz", amount: 420, dueDate: "2026-03-15", category: "Utilidades", status: "pending" },
  { id: "3", description: "Fornecedor - Produtos", amount: 1800, dueDate: "2026-03-05", category: "Fornecedores", status: "overdue" },
  { id: "4", description: "Internet", amount: 150, dueDate: "2026-03-20", category: "Utilidades", status: "pending" },
  { id: "5", description: "Material de Limpeza", amount: 280, dueDate: "2026-02-25", category: "Manutenção", status: "paid" },
];
