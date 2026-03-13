import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface StaggerChildrenProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
  useInView?: boolean;
}

// const containerVariants = {
//   hidden: { opacity: 0 },
//   visible: {
//     opacity: 1,
//     transition: {
//       staggerChildren: 0.1,
//     },
//   },
// };

export const StaggerChildren: React.FC<StaggerChildrenProps> = ({
  children,
  staggerDelay = 0.1,
  className = "",
  useInView = true,
}) => {
  const customVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  return (
    <motion.div
      variants={customVariants}
      initial="hidden"
      {...(useInView ? { whileInView: "visible", viewport: { once: true, amount: 0.1 } } : { animate: "visible" })}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  y?: number;
}

// const itemVariants = {
//   hidden: { opacity: 0, y: 20 },
//   visible: {
//     opacity: 1,
//     y: 0,
//     transition: {
//       duration: 0.5,
//       ease: [0.21, 0.47, 0.32, 0.98],
//     },
//   },
// };

export const StaggerItem: React.FC<StaggerItemProps> = ({ children, className = "", y = 20 }) => {
  const customVariants = {
    hidden: { opacity: 0, y },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    },
  };

  return (
    <motion.div variants={customVariants as any} className={className}>
      {children}
    </motion.div>
  );
};
