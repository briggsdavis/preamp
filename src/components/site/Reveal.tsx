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
 * Reveals its children with a fade + lift as they scroll into view. Used
 * site-wide so every block eases up into place. Only opacity and transform
 * animate — both GPU-composited, so the reveal stays smooth and never forces
 * layout (no blur/filter, which Lighthouse flags as non-composited).
 */
export function Reveal({ children, delay = 0, y = 24, className }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      // Hold off until the element is ~18% up from the bottom edge so it
      // animates where the eye actually is, not the instant it peeks in.
      viewport={{ once: true, margin: "0px 0px -18% 0px" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
