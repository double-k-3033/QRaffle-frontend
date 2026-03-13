import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "new" | "custom";
  className?: string;
  showSparkle?: boolean;
  rotation?: number;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "custom",
  className = "",
  showSparkle = false,
  rotation = 0,
}) => {
  const baseClasses =
    "inline-flex items-center rounded-full px-2 py-1 text-xs font-bold text-white shadow-lg transition-transform duration-300 group-hover:scale-110 overflow-hidden";

  const variantClasses = {
    new: "bg-red-500",
    custom: "",
  };

  const badgeClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <motion.div
      className="relative"
      style={{ transform: `rotate(${rotation}deg)` }}
      initial={{ scale: 0, rotate: rotation }}
      animate={{ scale: 1, rotate: rotation }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 15,
        delay: 0.5,
      }}
    >
      <motion.span className={badgeClasses}>
        {showSparkle && (
          <>
            {/* Sparkle dots */}
            <motion.div
              className="absolute -top-1 -right-1 h-1 w-1 rounded-full bg-yellow-300"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0,
              }}
            />
            <motion.div
              className="absolute -bottom-1 -left-1 h-1 w-1 rounded-full bg-yellow-300"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0.7,
              }}
            />
            <motion.div
              className="absolute top-0 left-1/2 h-0.5 w-0.5 rounded-full bg-yellow-300"
              animate={{
                scale: [1, 1.8, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: 1.2,
              }}
            />
          </>
        )}
        <span className="relative z-10">{children}</span>
      </motion.span>
    </motion.div>
  );
};

export default Badge;
