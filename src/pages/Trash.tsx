import { useSyncExternalStore, useState } from "react";
import { motion } from "framer-motion";
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import MotionContainer from "@/components/MotionContainer";
import ConfirmDelete from "@/components/ConfirmDelete";
import { trashStore, TrashItem } from "@/data/trashStore";

// Restore callbacks registry — pages register their restore handlers
type RestoreHandler = (item: TrashItem) => void;
const restoreHandlers: Record<string, RestoreHandler> = {};

export const registerRestoreHandler = (type: string, handler: RestoreHandler) => {
  restoreHandlers[type] = handler;
};

const typeLabels: Record<string, string> = {
  product: "Produto",
  service: "Serviço",
  client: "Cliente",
  barber: "Barbeiro",
  bill: "Conta",
  appointment: "Agendamento",
};

const Trash = () => {
  const items = useSyncExternalStore(trashStore.subscribe, trashStore.getItems);
  const [clearTarget, setClearTarget] = useState(false);

  const handleRestore = (item: TrashItem) => {
    const handler = restoreHandlers[item.type];
    if (handler) handler(item);
    trashStore.removeItem(item.id);
  };

  const handleClearAll = () => {
    trashStore.clear();
    setClearTarget(false);
  };

  return (
    <div className="space-y-8">
      <ConfirmDelete
        open={clearTarget}
        itemName="todos os itens da lixeira"
        onConfirm={handleClearAll}
        onCancel={() => setClearTarget(false)}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Lixeira</h1>
          <p className="text-muted-foreground font-light mt-1">Itens excluídos — restaure quando precisar</p>
        </div>
        {items.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => setClearTarget(true)}
            className="organic-btn-secondary flex items-center gap-2 text-destructive"
          >
            <Trash2 size={16} />
            Esvaziar Lixeira
          </motion.button>
        )}
      </div>

      <MotionContainer className="organic-card">
        <p className="stat-label">Itens na Lixeira</p>
        <p className="stat-value mt-1">{items.length}</p>
      </MotionContainer>

      {items.length === 0 ? (
        <MotionContainer delay={0.1}>
          <div className="organic-card text-center py-12">
            <Trash2 size={40} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">A lixeira está vazia</p>
          </div>
        </MotionContainer>
      ) : (
        <MotionContainer delay={0.1}>
          <div className="organic-card overflow-hidden !p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-4 text-xs text-muted-foreground font-medium">Nome</th>
                  <th className="text-left p-4 text-xs text-muted-foreground font-medium">Tipo</th>
                  <th className="text-left p-4 text-xs text-muted-foreground font-medium">Excluído em</th>
                  <th className="text-right p-4 text-xs text-muted-foreground font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-border/30 last:border-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="p-4 text-sm font-medium">{item.name}</td>
                    <td className="p-4">
                      <span className="text-xs bg-secondary px-2.5 py-1 rounded-full">
                        {typeLabels[item.type] || item.typeLabel}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{item.deletedAt}</td>
                    <td className="p-4 text-right">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRestore(item)}
                        className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 ml-auto"
                      >
                        <RotateCcw size={13} />
                        Restaurar
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </MotionContainer>
      )}
    </div>
  );
};

export default Trash;
