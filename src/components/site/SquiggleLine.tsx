import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * The five-strand "sunset" ribbon, ramped orange → brown to match the brand
 * artwork (no yellow). Index 0 is the outer strand (lighter orange) — the top
 * of a left-to-right run and the outside of every curve.
 */
const RIBBON = [
  "var(--color-gold)",
  "var(--color-orange)",
  "var(--color-terracotta)",
  "var(--color-brick)",
  "var(--color-maroon)",
];

interface SquiggleLineProps {
  className?: string;
  /** Which side the ribbon enters/exits and bleeds off. */
  side?: "left" | "right";
  /** Centre-line corner radius, in px. */
  cornerRadius?: number;
  /** Perpendicular gap between the five strands, in px. */
  gap?: number;
  /** Stroke width, in px. */
  strokeWidth?: number;
  /** Target vertical distance between horizontal runs, in px (drives density). */
  rowGap?: number;
}

interface Pt {
  x: number;
  y: number;
}

const f = (n: number) => n.toFixed(2);

/**
 * Build the centre-line of a serpentine "racetrack": straight horizontal runs
 * stacked down the section, joined by U-turns alternating left/right. The first
 * and last segments overshoot the top/bottom edges so the ribbon bleeds off.
 */
function buildWaypoints(
  W: number,
  H: number,
  R: number,
  bundleHalf: number,
  strokeWidth: number,
  rowGapTarget: number,
  startLeft: boolean,
): { points: Pt[]; effR: number } {
  const insetX = bundleHalf + strokeWidth + 2;
  const xL = insetX;
  const xR = W - insetX;

  const padY = R + bundleHalf + strokeWidth + 6;
  const span = Math.max(0, H - 2 * padY);

  // Pick the number of runs from the section height, then keep the U-turns from
  // colliding by guaranteeing a straight vertical between the two corners.
  let n = Math.max(2, Math.round(span / rowGapTarget) + 1);
  let rowGap = span / (n - 1);
  while (n > 2 && rowGap < 2 * R + 24) {
    n -= 1;
    rowGap = span / (n - 1);
  }
  // Shrink the corner radius if the section is too short for the chosen radius.
  const effR = Math.min(R, rowGap / 2 - 6, (xR - xL) / 2 - 6);

  const ys = Array.from({ length: n }, (_, j) => padY + j * rowGap);
  const overshoot = effR + 80;

  const points: Pt[] = [];
  let curX = startLeft ? xL : xR;
  const other = (x: number) => (x === xL ? xR : xL);

  points.push({ x: curX, y: ys[0] - overshoot }); // bleed in from the top
  for (let j = 0; j < n; j++) {
    points.push({ x: curX, y: ys[j] }); // start of run (top of a connector)
    const endX = other(curX);
    points.push({ x: endX, y: ys[j] }); // end of run
    curX = endX;
  }
  points.push({ x: curX, y: ys[n - 1] + overshoot }); // bleed off the bottom

  return { points, effR };
}

/**
 * Emit one strand of the ribbon, offset perpendicular by `o`, with rounded
 * corners. Every strand shares each corner's centre, so the strands stay
 * exactly equidistant through the curves (inner radius R-|o|, outer R+|o|).
 */
function strandPath(points: Pt[], R: number, o: number): string {
  const n = points.length;
  const seg = points.slice(0, -1).map((p, i) => {
    const dx = points[i + 1].x - p.x;
    const dy = points[i + 1].y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    return { ux, uy, px: -uy, py: ux }; // px,py = left-hand normal
  });

  const s0 = seg[0];
  let d = `M ${f(points[0].x + o * s0.px)},${f(points[0].y + o * s0.py)}`;

  for (let i = 1; i < n - 1; i++) {
    const a = seg[i - 1];
    const b = seg[i];
    const P = points[i];
    const tin = { x: P.x - a.ux * R + o * a.px, y: P.y - a.uy * R + o * a.py };
    const tout = { x: P.x + b.ux * R + o * b.px, y: P.y + b.uy * R + o * b.py };
    const cross = a.ux * b.uy - a.uy * b.ux; // ±1 for the 90° turns
    const r = R - cross * o;
    const sweep = cross < 0 ? 1 : 0;
    d += ` L ${f(tin.x)},${f(tin.y)}`;
    d += ` A ${f(r)} ${f(r)} 0 0 ${sweep} ${f(tout.x)},${f(tout.y)}`;
  }

  const sl = seg[n - 2];
  d += ` L ${f(points[n - 1].x + o * sl.px)},${f(points[n - 1].y + o * sl.py)}`;
  return d;
}

/**
 * A decorative five-strand sunset ribbon that snakes through a section as a
 * rounded "racetrack" — straight runs with rounded U-turns — and draws itself
 * on as the section scrolls through the viewport. Sits full-bleed behind the
 * section content on the cream/beige sections.
 */
export function SquiggleLine({
  className,
  side = "left",
  cornerRadius = 64,
  gap = 9,
  strokeWidth = 3,
  rowGap = 260,
}: SquiggleLineProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Measure the section so the path is built in real pixels: that keeps the
  // corners perfectly circular and the strands evenly spaced at any aspect.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((prev) =>
        Math.abs(prev.w - width) < 1 && Math.abs(prev.h - height) < 1
          ? prev
          : { w: width, h: height },
      );
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const mid = (RIBBON.length - 1) / 2;
  const bundleHalf = mid * gap;

  const paths = useMemo(() => {
    if (size.w < 10 || size.h < 10) return null;
    const { points, effR } = buildWaypoints(
      size.w,
      size.h,
      cornerRadius,
      bundleHalf,
      strokeWidth,
      rowGap,
      side !== "right",
    );
    return RIBBON.map((_, i) => strandPath(points, effR, (i - mid) * gap));
  }, [size.w, size.h, cornerRadius, bundleHalf, strokeWidth, rowGap, gap, mid, side]);

  // Draw the ribbon on as the section scrolls through the viewport.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const drawn = useTransform(scrollYProgress, [0.05, 1], [0, 1]);
  const pathLength = reduce ? 1 : drawn;

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden",
        className,
      )}
    >
      {paths && (
        <svg
          className="h-full w-full"
          viewBox={`0 0 ${size.w} ${size.h}`}
          width={size.w}
          height={size.h}
          fill="none"
        >
          {paths.map((d, i) => (
            <motion.path
              key={i}
              d={d}
              stroke={RIBBON[i]}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              style={{ pathLength }}
            />
          ))}
        </svg>
      )}
    </div>
  );
}
