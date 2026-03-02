import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface ConfirmDeleteProps {
  open: boolean;
  itemName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDelete = ({ open, itemName, onConfirm, onCancel }: ConfirmDeleteProps) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/20 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="organic-card !p-6 max-w-sm w-full mx-4 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertTriangle size={20} className="text-destructive" />
            </div>
            <h3 className="section-title">Confirmar Exclusão</h3>
          </div>
          <p className="text-sm text-muted-foreground font-light">
            Tem certeza que deseja excluir{itemName ? ` "${itemName}"` : ""}? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3 justify-end">
            <button onClick={onCancel} className="organic-btn-secondary">Cancelar</button>
            <button
              onClick={onConfirm}
              className="organic-btn bg-destructive text-destructive-foreground hover:opacity-90"
            >
              Excluir
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default ConfirmDelete;
