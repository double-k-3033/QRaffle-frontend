import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface FadeInWhenVisibleProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  className?: string;
}

export const FadeInWhenVisible: React.FC<FadeInWhenVisibleProps> = ({
  children,
  delay = 0,
  duration = 0.6,
  // y = 30,
  className = "",
}) => {
  return (
    <motion.div
      // initial={{ opacity: 0, y }}
      // whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        duration,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
