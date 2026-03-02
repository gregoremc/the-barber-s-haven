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
  phone: string;
  commission: number; // percentage
  avatar?: string;
}

export interface Appointment {
  id: string;
  barberId: string;
  clientName: string;
  serviceId: string;
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

export interface Bill {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  category: string;
  status: 'pending' | 'paid' | 'overdue';
}
