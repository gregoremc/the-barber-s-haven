import { motion } from "framer-motion";
import { ReactNode } from "react";

interface MotionContainerProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

const MotionContainer = ({ children, delay = 0, className = "" }: MotionContainerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default MotionContainer;
