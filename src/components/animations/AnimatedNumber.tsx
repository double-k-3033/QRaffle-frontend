import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  format?: (value: number) => string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 2,
  className = "",
  format = (val) => Math.round(val).toLocaleString(),
}) => {
  const spring = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(spring, format);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={className}>{display}</motion.span>;
};
