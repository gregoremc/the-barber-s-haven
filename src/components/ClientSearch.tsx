import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { Search } from "lucide-react";
import { clientsStore } from "@/data/clientsStore";

interface ClientSearchProps {
  value: string;
  onChange: (name: string) => void;
}

const ClientSearch = ({ value, onChange }: ClientSearchProps) => {
  const clients = useSyncExternalStore(clientsStore.subscribe, clientsStore.getClients);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Buscar cliente..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="organic-input !pl-9"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border/50 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((client) => (
            <button
              key={client.id}
              type="button"
              onClick={() => {
                onChange(client.name);
                setQuery(client.name);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              <span className="font-medium">{client.name}</span>
              <span className="text-xs text-muted-foreground ml-2">{client.phone}</span>
            </button>
          ))}
        </div>
      )}
      {open && query && filtered.length === 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border/50 rounded-xl shadow-lg px-4 py-3">
          <p className="text-xs text-muted-foreground">Nenhum cliente encontrado</p>
        </div>
      )}
    </div>
  );
};

export default ClientSearch;
