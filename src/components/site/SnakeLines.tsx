import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

/**
 * The Pre Amp "snaking line" motif: a single continuous bundle of parallel
 * sunset-colored lines that serpentines down the full length of the page,
 * weaving left↔right with big rounded U-turns — a nod to the printed menu.
 *
 * One global path is generated to fill the measured size of the page shell, so
 * the same pipe threads behind every section. A travelling highlight pulses
 * along each line to give the bundle a gentle, flowing motion.
 */

const LINE_COLORS = [
  "var(--color-gold)",
  "var(--color-orange)",
  "var(--color-terracotta)",
  "var(--color-brick)",
  "var(--color-maroon)",
];

const LINE_GAP = 7; // distance between adjacent parallel lines
const TURN_RADIUS = 150; // U-turn radius; horizontal rows sit 2× this apart
const MARGIN = 40; // inset of the bundle from the layer edges
const STROKE = 3.5;

/**
 * Build one line of the serpentine for a given perpendicular `offset` from the
 * bundle's centerline. Straight runs shift by ±offset; the U-turns become
 * concentric arcs (radius R∓offset) sharing a center, so the lines stay exactly
 * parallel and nest cleanly through every corner.
 */
function buildSnake(offset: number, w: number, h: number): string {
  const R = TURN_RADIUS;
  const gap = 2 * R;
  const xL = MARGIN + R;
  const xR = w - MARGIN - R;
  if (xR <= xL) return "";

  const y0 = MARGIN + R;
  const rows: number[] = [];
  for (let y = y0; y <= h - MARGIN - R; y += gap) rows.push(y);
  if (rows.length === 0) rows.push(y0);

  let d = "";
  for (let k = 0; k < rows.length; k++) {
    const leftToRight = k % 2 === 0;
    const sign = leftToRight ? 1 : -1; // offset flips direction each run
    const yRun = rows[k] + sign * offset;
    const startX = leftToRight ? xL : xR;
    const endX = leftToRight ? xR : xL;

    if (k === 0) d += `M ${startX.toFixed(1)} ${yRun.toFixed(1)} `;
    d += `L ${endX.toFixed(1)} ${yRun.toFixed(1)} `;

    if (k < rows.length - 1) {
      const nextSign = (k + 1) % 2 === 0 ? 1 : -1;
      const nextYRun = rows[k + 1] + nextSign * offset;
      const radius = leftToRight ? R - offset : R + offset;
      const sweep = leftToRight ? 1 : 0; // right turn clockwise, left ccw
      d +=
        `A ${radius.toFixed(1)} ${radius.toFixed(1)} 0 0 ${sweep} ` +
        `${endX.toFixed(1)} ${nextYRun.toFixed(1)} `;
    }
  }
  return d;
}

export function SnakeLines({
  containerRef,
}: {
  containerRef: RefObject<HTMLElement | null>;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Track the page shell's full size (it grows with content, images, fonts).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [containerRef]);

  const offsets = useMemo(() => {
    const n = LINE_COLORS.length;
    return LINE_COLORS.map((_, i) => (i - (n - 1) / 2) * LINE_GAP);
  }, []);

  const paths = useMemo(
    () =>
      size.w && size.h
        ? offsets.map((o) => buildSnake(o, size.w, size.h))
        : [],
    [offsets, size],
  );

  if (!paths.length) return null;

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      width="100%"
      height="100%"
      viewBox={`0 0 ${size.w} ${size.h}`}
      preserveAspectRatio="none"
      style={{ opacity: 0.9 }}
    >
      {/* Solid parallel lines */}
      {paths.map((d, i) => (
        <path
          key={`l${i}`}
          d={d}
          fill="none"
          stroke={LINE_COLORS[i]}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
      ))}
      {/* Travelling highlight that flows along each line */}
      {paths.map((d, i) => (
        <path
          key={`f${i}`}
          d={d}
          fill="none"
          stroke="#fff4e2"
          strokeOpacity={0.85}
          strokeWidth={STROKE + 0.5}
          strokeLinecap="round"
          pathLength={1000}
          className="snake-flow"
          style={
            {
              animationDuration: `${9 + i * 0.8}s`,
              animationDelay: `${i * 1.15}s`,
            } as CSSProperties
          }
        />
      ))}
    </svg>
  );
}
