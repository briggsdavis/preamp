import { RippleStripes } from "@/components/site/RippleStripes";
import { cn } from "@/lib/utils";

interface SectionLinesProps {
  /** Number of vertical lines to render. */
  count?: number;
  /** Overall opacity of the motif (kept low so it stays subtle). */
  opacity?: number;
  className?: string;
}

/**
 * The Pre Amp "lines" motif: a faint, full-bleed panel of rippling vertical
 * stripes dropped behind otherwise-plain sections so the flickering rhythm
 * shows up almost everywhere on the site, just barely.
 */
export function SectionLines({
  count = 30,
  opacity = 0.07,
  className,
}: SectionLinesProps) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 -z-0", className)}
      style={{ opacity }}
    >
      <RippleStripes count={count} fade="none" />
    </div>
  );
}
