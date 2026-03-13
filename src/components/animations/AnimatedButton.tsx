import { motion, type TargetAndTransition } from "framer-motion";
import { type ReactNode } from "react";

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  whileHover?: TargetAndTransition;
  whileTap?: TargetAndTransition;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onClick,
  disabled = false,
  className = "",
  whileHover = { scale: 1.02, transition: { duration: 0.2 } },
  whileTap = { scale: 0.98 },
  ...props
}) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={className}
      whileHover={!disabled ? whileHover : undefined}
      whileTap={!disabled ? whileTap : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};
