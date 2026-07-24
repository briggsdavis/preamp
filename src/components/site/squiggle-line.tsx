import { motion, useMotionValue, useReducedMotion, useScroll, useTransform } from "motion/react"
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react"
import { useInlineEditingMode } from "@/components/cms/inline-editing"
import { cn } from "@/lib/utils"

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
]

interface SquiggleLineProps {
  className?: string
  /** Which side the ribbon enters/exits and bleeds off. */
  side?: "left" | "right"
  /** Centre-line corner radius, in px. */
  cornerRadius?: number
  /** Perpendicular gap between the five strands, in px. */
  gap?: number
  /** Stroke width, in px. */
  strokeWidth?: number
  /** Distance the top/bottom runs sit from the section edges, in px. Keeps the
   * runs up in the section padding so they clear the content. */
  marginY?: number
  /** Horizontal gap between the side gutters and the screen edges, in px, so
   * the ribbon doesn't sit flush against the sides. */
  marginX?: number
  /** When set (>1), the ribbon serpentines left↔right across this many
   * horizontal rows instead of framing the section edges. */
  rows?: number
  /** For serpentine ribbons, travel vertically before the first horizontal run. */
  leadInY?: number
}

interface Pt {
  x: number
  y: number
}

const f = (n: number) => n.toFixed(2)

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
  const insetX = bundleHalf + strokeWidth + 2 + marginX
  const xL = insetX
  const xR = W - insetX

  const topY = marginY
  const botY = H - marginY
  // Shrink the corner radius if the section is too short/narrow for it.
  const effR = Math.min(R, (botY - topY) / 2 - 6, (xR - xL) / 2 - 6)
  const overshoot = effR + 90

  const start = startLeft ? xL : xR
  const other = startLeft ? xR : xL

  const points: Pt[] = [
    { x: start, y: topY - overshoot }, // bleed in from the top
    { x: start, y: topY }, // into the top run
    { x: other, y: topY }, // top run across
    { x: other, y: botY }, // tall connector down the side gutter
    { x: start, y: botY }, // bottom run back across
    { x: start, y: botY + overshoot }, // bleed off the bottom
  ]

  return { points, effR }
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
  const insetX = bundleHalf + strokeWidth + 2 + marginX
  const xL = insetX
  const xR = W - insetX

  const topY = marginY
  const botY = H - marginY
  const rowGap = rows > 1 ? (botY - topY) / (rows - 1) : botY - topY
  const effR = Math.min(R, rowGap / 2 - 6, (xR - xL) / 2 - 6)
  const overshoot = effR + 90

  const firstX = startLeft ? xL : xR
  const points: Pt[] = [{ x: firstX, y: topY - overshoot }] // bleed in from top

  for (let i = 0; i < rows; i++) {
    const y = topY + i * rowGap
    const leftToRight = startLeft ? i % 2 === 0 : i % 2 === 1
    const a = leftToRight ? xL : xR
    const b = leftToRight ? xR : xL
    points.push({ x: a, y }) // start of the run
    points.push({ x: b, y }) // across to the other gutter
  }

  const last = points[points.length - 1]
  points.push({ x: last.x, y: botY + overshoot }) // bleed off the bottom

  return { points, effR }
}

function buildSerpentineWithLeadIn(
  W: number,
  H: number,
  R: number,
  bundleHalf: number,
  strokeWidth: number,
  marginY: number,
  marginX: number,
  rows: number,
  startLeft: boolean,
  leadInY: number,
): { points: Pt[]; effR: number } {
  const insetX = bundleHalf + strokeWidth + 2 + marginX
  const xL = insetX
  const xR = W - insetX

  const topY = marginY
  const botY = H - marginY
  const firstRunY = Math.min(Math.max(leadInY, topY + 60), botY - 60)
  const rowGap = rows > 1 ? (botY - firstRunY) / (rows - 1) : botY - firstRunY
  const effR = Math.min(R, rowGap / 2 - 6, (xR - xL) / 2 - 6)
  const overshoot = effR + 90

  const firstX = startLeft ? xL : xR
  const points: Pt[] = [
    { x: firstX, y: topY - overshoot },
    { x: firstX, y: firstRunY },
  ]

  for (let i = 0; i < rows; i++) {
    const y = firstRunY + i * rowGap
    const leftToRight = startLeft ? i % 2 === 0 : i % 2 === 1
    const a = leftToRight ? xL : xR
    const b = leftToRight ? xR : xL
    if (i > 0) points.push({ x: a, y })
    points.push({ x: b, y })
  }

  const last = points[points.length - 1]
  points.push({ x: last.x, y: botY + overshoot })

  return { points, effR }
}

/**
 * Emit one strand of the ribbon, offset perpendicular by `o`, with rounded
 * corners. Every strand shares each corner's centre, so the strands stay
 * exactly equidistant through the curves (inner radius R-|o|, outer R+|o|).
 */
function strandPath(points: Pt[], R: number, o: number): string {
  const n = points.length
  const seg = points.slice(0, -1).map((p, i) => {
    const dx = points[i + 1].x - p.x
    const dy = points[i + 1].y - p.y
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len
    const uy = dy / len
    return { ux, uy, px: -uy, py: ux } // px,py = left-hand normal
  })

  const s0 = seg[0]
  let d = `M ${f(points[0].x + o * s0.px)},${f(points[0].y + o * s0.py)}`

  for (let i = 1; i < n - 1; i++) {
    const a = seg[i - 1]
    const b = seg[i]
    const P = points[i]
    const tin = { x: P.x - a.ux * R + o * a.px, y: P.y - a.uy * R + o * a.py }
    const tout = { x: P.x + b.ux * R + o * b.px, y: P.y + b.uy * R + o * b.py }
    const cross = a.ux * b.uy - a.uy * b.ux // ±1 for the 90° turns
    const r = R - cross * o
    // Convex (racetrack) corners: the bundle bulges outward through each turn.
    const sweep = cross < 0 ? 0 : 1
    d += ` L ${f(tin.x)},${f(tin.y)}`
    d += ` A ${f(r)} ${f(r)} 0 0 ${sweep} ${f(tout.x)},${f(tout.y)}`
  }

  const sl = seg[n - 2]
  d += ` L ${f(points[n - 1].x + o * sl.px)},${f(points[n - 1].y + o * sl.py)}`
  return d
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
  leadInY,
}: SquiggleLineProps) {
  const editing = useInlineEditingMode()
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const [size, setSize] = useState({ w: 0, h: 0 })

  // Measure the section so the path is built in real pixels: that keeps the
  // corners perfectly circular and the strands evenly spaced at any aspect.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize((prev) =>
        Math.abs(prev.w - width) < 1 && Math.abs(prev.h - height) < 1
          ? prev
          : { w: width, h: height },
      )
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const mid = (RIBBON.length - 1) / 2
  const bundleHalf = mid * gap

  // On narrow (mobile) viewports the centred copy nearly fills the width, so
  // the tall connector run - inset by `marginX` - strikes through the text
  // (e.g. the "Welcome in" section). There, bleed the vertical runs off the
  // left/right edges instead (insetX ≈ 0) so the ribbon frames the section at
  // the page edges rather than crossing the content.
  const effMarginX = size.w > 0 && size.w < 768 ? -(bundleHalf + strokeWidth + 2) : marginX

  const paths = useMemo(() => {
    if (size.w < 10 || size.h < 10) return null
    const { points, effR } =
      rows && rows > 1 && leadInY
        ? buildSerpentineWithLeadIn(
            size.w,
            size.h,
            cornerRadius,
            bundleHalf,
            strokeWidth,
            marginY,
            effMarginX,
            rows,
            side !== "right",
            leadInY,
          )
        : rows && rows > 1
          ? buildSerpentine(
              size.w,
              size.h,
              cornerRadius,
              bundleHalf,
              strokeWidth,
              marginY,
              effMarginX,
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
              effMarginX,
              side !== "right",
            )
    return RIBBON.map((_, i) => strandPath(points, effR, (i - mid) * gap))
  }, [
    size.w,
    size.h,
    cornerRadius,
    bundleHalf,
    strokeWidth,
    marginY,
    effMarginX,
    gap,
    mid,
    side,
    rows,
    leadInY,
  ])

  // Draw the ribbon on as the section scrolls through the viewport.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })
  const drawn = useTransform(scrollYProgress, [0.05, 1], [0, 1])
  const pathLength = reduce || editing ? 1 : drawn

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 z-0 overflow-hidden", className)}
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
  )
}

const ZIGZAG_CONNECTOR_POINTS: Pt[] = [
  { x: 117, y: 168 }, // Coffee top-center.
  { x: 117, y: 125 },
  { x: 372, y: 125 }, // Runs behind Food to its bottom-center.
  { x: 372, y: 285 },
  { x: 627, y: 285 }, // Runs behind Vinyl to its top-center.
  { x: 627, y: 125 },
  { x: 782, y: 125 }, // Extends beneath the left edge of Drinks.
]

/** Five-strand connector for the four-image zigzag on the About page. */
export function ZigzagConnectorLine({
  className,
  startTarget,
  endTarget,
}: {
  className?: string
  startTarget: RefObject<HTMLElement | null>
  endTarget: RefObject<HTMLElement | null>
}) {
  const editing = useInlineEditingMode()
  const ref = useRef<HTMLDivElement>(null)
  const clipId = useId().replaceAll(":", "")
  const reduce = useReducedMotion()
  const drawn = useMotionValue(reduce || editing ? 1 : 0)
  const revealWidth = useTransform(drawn, [0, 1], [0, 1000])
  const mid = (RIBBON.length - 1) / 2
  const paths = RIBBON.map((_, index) => strandPath(ZIGZAG_CONNECTOR_POINTS, 34, (index - mid) * 8))

  useEffect(() => {
    if (reduce || editing) {
      drawn.set(1)
      return
    }

    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const coffee = startTarget.current
        const drinks = endTarget.current
        if (!coffee || !drinks) return

        const viewportHeight = window.innerHeight
        const scrollTop = window.scrollY
        const coffeeRect = coffee.getBoundingClientRect()
        const drinksRect = drinks.getBoundingClientRect()
        const startScroll = scrollTop + coffeeRect.top - viewportHeight
        const endScroll = scrollTop + drinksRect.top + drinksRect.height / 2 - viewportHeight / 2
        const distance = Math.max(endScroll - startScroll, 1)
        const progress = (scrollTop - startScroll) / distance
        drawn.set(Math.min(1, Math.max(0, progress)))
      })
    }

    const observer = new ResizeObserver(update)
    if (startTarget.current) observer.observe(startTarget.current)
    if (endTarget.current) observer.observe(endTarget.current)
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    update()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [drawn, editing, endTarget, reduce, startTarget])

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 z-0", className)}
    >
      <svg
        className="h-full w-full overflow-visible"
        viewBox="0 0 1000 400"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <motion.rect x={0} y={0} width={reduce || editing ? 1000 : revealWidth} height={400} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          {paths.map((d, index) => (
            <path
              key={index}
              d={d}
              stroke={RIBBON[index]}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      </svg>
    </div>
  )
}
