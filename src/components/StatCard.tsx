import { motion } from "framer-motion";
import { LucideIcon, Eye, EyeOff } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  delay?: number;
  hideable?: boolean;
  hidden?: boolean;
  onToggleVisibility?: () => void;
}

const StatCard = ({ label, value, icon: Icon, trend, trendUp, delay = 0, hideable = false, hidden = false, onToggleVisibility }: StatCardProps) => {
  const visible = !hidden;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, delay }}
      className="organic-card-hover"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="stat-label">{label}</p>
            {hideable && (
              <button
                onClick={onToggleVisibility}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {visible ? <Eye size={14} strokeWidth={1.5} /> : <EyeOff size={14} strokeWidth={1.5} />}
              </button>
            )}
          </div>
          <p className="stat-value mt-2">{visible ? value : "••••••"}</p>
          {trend && (
            <p className={`text-xs mt-2 font-light ${trendUp ? "text-success" : "text-destructive"}`}>
              {visible ? trend : ""}
            </p>
          )}
        </div>
        <div className="p-3 rounded-xl bg-secondary">
          <Icon size={20} strokeWidth={1.5} className="text-muted-foreground" />
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
