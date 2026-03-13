import { motion } from "framer-motion";

interface AnimatedProgressBarProps {
  progress: number;
  className?: string;
  barClassName?: string;
  duration?: number;
  delay?: number;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  className = "bg-muted h-2 w-full rounded-full",
  barClassName = "from-primary to-accent h-2 rounded-full bg-gradient-to-r",
  duration = 1.5,
  delay = 0.5,
}) => {
  return (
    <div className={className}>
      <motion.div
        className={barClassName}
        initial={{ width: 0 }}
        whileInView={{ width: `${progress}%` }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{
          duration,
          delay,
          ease: [0.21, 0.47, 0.32, 0.98],
        }}
      />
    </div>
  );
};
