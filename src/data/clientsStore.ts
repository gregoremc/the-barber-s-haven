export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
}

const initialClients: Client[] = [
  { id: "1", name: "João Pedro", phone: "(11) 99999-0001", email: "joao@email.com", notes: "Cliente frequente" },
  { id: "2", name: "Marcos Oliveira", phone: "(11) 99999-0002", email: "marcos@email.com", notes: "" },
  { id: "3", name: "Lucas Mendes", phone: "(11) 99999-0003", email: "lucas@email.com", notes: "Prefere corte degradê" },
  { id: "4", name: "Felipe Costa", phone: "(11) 99999-0004", email: "felipe@email.com", notes: "" },
  { id: "5", name: "Bruno Alves", phone: "(11) 99999-0005", email: "bruno@email.com", notes: "Alérgico a alguns produtos" },
];

type Listener = () => void;

let clients: Client[] = [...initialClients];
const listeners = new Set<Listener>();

const notify = () => listeners.forEach((l) => l());

export const clientsStore = {
  getClients: () => clients,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  addClient: (client: Client) => {
    clients = [...clients, client];
    notify();
  },
  updateClient: (id: string, data: Partial<Client>) => {
    clients = clients.map((c) => (c.id === id ? { ...c, ...data } : c));
    notify();
  },
  deleteClient: (id: string) => {
    clients = clients.filter((c) => c.id !== id);
    notify();
  },
};
