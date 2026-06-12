import { RippleStripes } from "@/components/site/RippleStripes";
import { cn } from "@/lib/utils";

interface SideStripesProps {
  /** Number of colored bars in the panel. */
  count?: number;
  /** Panel opacity. */
  opacity?: number;
  className?: string;
}

/**
 * A panel of bold "sunset" bars anchored to the right edge of a section,
 * dissolving leftward into the page. The signature Pre Amp line decoration.
 */
export function SideStripes({
  count = 7,
  opacity = 0.85,
  className,
}: SideStripesProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-0 right-0 z-0 w-3/5 sm:w-1/2 md:w-2/5",
        className,
      )}
      style={{ opacity }}
    >
      <RippleStripes count={count} fade="left" />
    </div>
  );
}
