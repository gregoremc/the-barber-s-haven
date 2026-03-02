export interface Product {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
}

export interface Service {
  id: string;
  name: string;
  costPrice: number;
  price: number;
  duration: number; // minutes
  description: string;
}

export interface Barber {
  id: string;
  name: string;
  cpfCnpj: string;
  address: string;
  phone: string;
  commission: number; // percentage
  paymentDay?: number; // day of month (1-31)
  avatar?: string;
  attachments?: BarberAttachment[];
  active?: boolean; // defaults to true
}

export interface BarberAttachment {
  id: string;
  name: string;
  url: string;
  date: string;
}

export interface Appointment {
  id: string;
  barberId: string;
  clientName: string;
  serviceId: string; // legacy single
  serviceIds?: string[]; // multiple services
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface BarberPayment {
  id: string;
  barberId: string;
  amount: number;
  date: string;
  description: string;
  status: 'pending' | 'paid';
}

export interface BillAttachment {
  id: string;
  name: string;
  url: string;
  date: string; // YYYY-MM
}

export interface Bill {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  category: string;
  status: 'pending' | 'paid' | 'overdue';
  isRecurring?: boolean;
  recurringMonths?: number; // 1-12
  recurringGroupId?: string; // links installments together
  installmentNumber?: number; // which installment (1-based)
  attachments?: BillAttachment[];
}
