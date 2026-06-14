import { type ReactNode } from "react";
import { motion } from "framer-motion";

interface RevealProps {
  children: ReactNode;
  /** Delay before the element animates in (seconds). */
  delay?: number;
  /** Vertical travel distance in px. */
  y?: number;
  className?: string;
}

/**
 * Reveals its children with a soft blur + fade + lift as they scroll into
 * view. Used site-wide so every block resolves out of a gentle haze.
 */
export function Reveal({ children, delay = 0, y = 24, className }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: "blur(12px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      // Hold off until the element is ~18% up from the bottom edge so it
      // animates where the eye actually is, not the instant it peeks in.
      viewport={{ once: true, margin: "0px 0px -18% 0px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
