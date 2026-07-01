import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * The five-strand "sunset" ribbon, ramped orange → brown to match the brand
 * artwork (no yellow). Index 0 is the outer strand (lighter orange) - the top
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
  /** Distance the top/bottom runs sit from the section edges, in px. Keeps the
   * runs up in the section padding so they clear the content. */
  marginY?: number;
  /** Horizontal gap between the side gutters and the screen edges, in px, so
   * the ribbon doesn't sit flush against the sides. */
  marginX?: number;
  /** When set (>1), the ribbon serpentines left↔right across this many
   * horizontal rows instead of framing the section edges. */
  rows?: number;
}

interface Pt {
  x: number;
  y: number;
}

const f = (n: number) => n.toFixed(2);

/**
 * Build the centre-line of the ribbon as a "frame": one horizontal run tucked
 * into the top margin and one into the bottom margin, joined by a single tall
 * connector running down one side gutter, with the ends bleeding off the top
 * and bottom edges. Keeping the runs in the margins and the connector at the
 * edge means the ribbon never crosses the centred section content.
 */
function buildWaypoints(
  W: number,
  H: number,
  R: number,
  bundleHalf: number,
  strokeWidth: number,
  marginY: number,
  marginX: number,
  startLeft: boolean,
): { points: Pt[]; effR: number } {
  const insetX = bundleHalf + strokeWidth + 2 + marginX;
  const xL = insetX;
  const xR = W - insetX;

  const topY = marginY;
  const botY = H - marginY;
  // Shrink the corner radius if the section is too short/narrow for it.
  const effR = Math.min(R, (botY - topY) / 2 - 6, (xR - xL) / 2 - 6);
  const overshoot = effR + 90;

  const start = startLeft ? xL : xR;
  const other = startLeft ? xR : xL;

  const points: Pt[] = [
    { x: start, y: topY - overshoot }, // bleed in from the top
    { x: start, y: topY }, // into the top run
    { x: other, y: topY }, // top run across
    { x: other, y: botY }, // tall connector down the side gutter
    { x: start, y: botY }, // bottom run back across
    { x: start, y: botY + overshoot }, // bleed off the bottom
  ];

  return { points, effR };
}

/**
 * Build the centre-line as a serpentine: horizontal runs stacked down the
 * section, joined by rounded U-turns that alternate between the left and right
 * gutters, so the ribbon snakes left↔right as it travels down. The ends bleed
 * off the top and bottom edges.
 */
function buildSerpentine(
  W: number,
  H: number,
  R: number,
  bundleHalf: number,
  strokeWidth: number,
  marginY: number,
  marginX: number,
  rows: number,
  startLeft: boolean,
): { points: Pt[]; effR: number } {
  const insetX = bundleHalf + strokeWidth + 2 + marginX;
  const xL = insetX;
  const xR = W - insetX;

  const topY = marginY;
  const botY = H - marginY;
  const rowGap = rows > 1 ? (botY - topY) / (rows - 1) : botY - topY;
  const effR = Math.min(R, rowGap / 2 - 6, (xR - xL) / 2 - 6);
  const overshoot = effR + 90;

  const firstX = startLeft ? xL : xR;
  const points: Pt[] = [{ x: firstX, y: topY - overshoot }]; // bleed in from top

  for (let i = 0; i < rows; i++) {
    const y = topY + i * rowGap;
    const leftToRight = startLeft ? i % 2 === 0 : i % 2 === 1;
    const a = leftToRight ? xL : xR;
    const b = leftToRight ? xR : xL;
    points.push({ x: a, y }); // start of the run
    points.push({ x: b, y }); // across to the other gutter
  }

  const last = points[points.length - 1];
  points.push({ x: last.x, y: botY + overshoot }); // bleed off the bottom

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
    // Convex (racetrack) corners: the bundle bulges outward through each turn.
    const sweep = cross < 0 ? 0 : 1;
    d += ` L ${f(tin.x)},${f(tin.y)}`;
    d += ` A ${f(r)} ${f(r)} 0 0 ${sweep} ${f(tout.x)},${f(tout.y)}`;
  }

  const sl = seg[n - 2];
  d += ` L ${f(points[n - 1].x + o * sl.px)},${f(points[n - 1].y + o * sl.py)}`;
  return d;
}

/**
 * A decorative five-strand sunset ribbon that snakes through a section as a
 * rounded "racetrack" - straight runs with rounded U-turns - and draws itself
 * on as the section scrolls through the viewport. Sits full-bleed behind the
 * section content on the cream/beige sections.
 */
export function SquiggleLine({
  className,
  side = "left",
  cornerRadius = 72,
  gap = 9,
  strokeWidth = 3,
  marginY = 52,
  marginX = 28,
  rows,
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
    const { points, effR } =
      rows && rows > 1
        ? buildSerpentine(
            size.w,
            size.h,
            cornerRadius,
            bundleHalf,
            strokeWidth,
            marginY,
            marginX,
            rows,
            side !== "right",
          )
        : buildWaypoints(
            size.w,
            size.h,
            cornerRadius,
            bundleHalf,
            strokeWidth,
            marginY,
            marginX,
            side !== "right",
          );
    return RIBBON.map((_, i) => strandPath(points, effR, (i - mid) * gap));
  }, [size.w, size.h, cornerRadius, bundleHalf, strokeWidth, marginY, marginX, gap, mid, side, rows]);

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
