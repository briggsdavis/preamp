import { cn } from "@/lib/utils";

const SUNSET = [
  "var(--color-gold)",
  "var(--color-amber)",
  "var(--color-orange)",
  "var(--color-terracotta)",
  "var(--color-brick)",
  "var(--color-maroon)",
];

interface RippleStripesProps {
  /** Number of stripes to render. */
  count?: number;
  /** Extra classes for the wrapper (e.g. positioning, opacity). */
  className?: string;
  /** Fade direction so stripes dissolve into the page. */
  fade?: "left" | "right" | "none";
}

/**
 * Decorative panel of vertical "sunset" stripes that ripple in a slow wave —
 * a nod to the original Pre Amp site's line motif. Purely ornamental.
 */
export function RippleStripes({
  count = 14,
  className,
  fade = "right",
}: RippleStripesProps) {
  const maskStyle =
    fade === "none"
      ? undefined
      : {
          WebkitMaskImage: `linear-gradient(to ${fade}, transparent, #000 45%)`,
          maskImage: `linear-gradient(to ${fade}, transparent, #000 45%)`,
        };

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none flex h-full w-full gap-[6px]", className)}
      style={maskStyle}
    >
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="block h-full flex-1 rounded-full"
          style={{
            background: SUNSET[i % SUNSET.length],
            transformOrigin: "center",
            animation: `stripe-ripple ${4 + (i % 5) * 0.6}s ease-in-out ${
              i * 0.18
            }s infinite, stripe-shimmer ${5 + (i % 4)}s ease-in-out ${
              i * 0.12
            }s infinite`,
          }}
        />
      ))}
    </div>
  );
}
