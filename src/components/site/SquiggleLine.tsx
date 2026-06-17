import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * The five-strand "sunset" ribbon, from deep maroon out to warm amber, exactly
 * the line motif from the brand artwork. Drawn outermost-to-innermost so the
 * dark strand sits on the inside of each curve.
 */
const RIBBON = [
  "var(--color-maroon)",
  "var(--color-brick)",
  "var(--color-orange)",
  "var(--color-gold)",
  "var(--color-amber)",
];

interface SquiggleLineProps {
  className?: string;
  /** Horizontal sway of the ribbon, in viewBox units (half-width = 50). */
  amplitude?: number;
  /** How many full weaves fit down the section. */
  waves?: number;
  /** Perpendicular gap between the five strands, in viewBox units. */
  spacing?: number;
  /** Stroke width in screen pixels (non-scaling). */
  strokeWidth?: number;
}

const VIEW_W = 100;
const VIEW_H = 100;
const STEPS = 64;

/**
 * Build a smooth vertical squiggle as a polyline of many short segments
 * (rounded joins make it read as a continuous curve). `offset` shifts the
 * whole strand sideways so the five strands run parallel.
 */
function wavePath(amplitude: number, waves: number, offset: number) {
  const pts: string[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    const y = -5 + t * (VIEW_H + 10); // overshoot top & bottom so it bleeds off
    const x = VIEW_W / 2 + offset + amplitude * Math.sin(t * waves * Math.PI * 2);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M ${pts.join(" L ")}`;
}

/**
 * A decorative five-strand sunset ribbon that squiggles down a section and
 * draws itself on as the section scrolls through the viewport. Replaces the
 * older oscillating vertical-stripe motif on the cream/beige sections.
 */
export function SquiggleLine({
  className,
  amplitude = 30,
  waves = 2,
  spacing = 2.2,
  strokeWidth = 3,
}: SquiggleLineProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Bind to the section the squiggle lives in, so each section draws its own
  // single, unbroken stroke as it scrolls through. Start drawing a touch after
  // the section enters and finish before it leaves, so the whole stroke is
  // revealed on screen rather than off the bottom edge.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const drawn = useTransform(scrollYProgress, [0.05, 0.65], [0, 1]);
  const pathLength = reduce ? 1 : drawn;

  // Centre the five strands so the bundle sits on the band's midline.
  const mid = (RIBBON.length - 1) / 2;

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        // A vertical band down the right side, away from the centred headings,
        // so the ribbon reads as one gentle line descending the section.
        "pointer-events-none absolute inset-y-0 right-0 -z-0 w-[46%] sm:w-[36%] md:w-[28%]",
        className,
      )}
    >
      <svg
        className="h-full w-full"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        fill="none"
      >
        {RIBBON.map((color, i) => (
          <motion.path
            key={i}
            d={wavePath(amplitude, waves, (i - mid) * spacing)}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            style={{ pathLength }}
          />
        ))}
      </svg>
    </div>
  );
}
