import type { CSSProperties } from "react";

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
  /**
   * "bars" (default) keeps the full-height stripes; "wave" gives each stripe
   * its own height so the panel reads like a music waveform.
   */
  variant?: "bars" | "wave";
  /**
   * Slowly slide the whole panel sideways like a conveyor belt, on top of the
   * per-stripe oscillation. "none" (default) leaves it stationary.
   */
  drift?: "left" | "right" | "none";
  /** Gap between stripes, in px. Lower it (with a higher count) for a finer,
   * higher-resolution waveform. */
  gap?: number;
}

/**
 * Audio-waveform style envelope: a gentle arch (taller toward the middle)
 * roughed up with a few layered sines so neighbouring bars jump around like a
 * real music waveform. Deterministic, so it never reshuffles between renders.
 */
function waveHeight(i: number, count: number) {
  const t = count > 1 ? i / (count - 1) : 0.5;
  const envelope = 0.55 + 0.45 * Math.sin(t * Math.PI);
  const detail = Math.abs(
    0.6 * Math.sin(i * 1.3 + 0.4) +
      0.3 * Math.sin(i * 0.7 + 1.1) +
      0.25 * Math.sin(i * 2.1 + 2),
  );
  return Math.min(1, Math.max(0.12, 0.18 + envelope * detail));
}

/**
 * Decorative panel of vertical "sunset" stripes that ripple in a slow wave,
 * a nod to the original Pre Amp site's line motif. Purely ornamental.
 */
export function RippleStripes({
  count = 14,
  className,
  fade = "right",
  variant = "bars",
  drift = "none",
  gap = 6,
}: RippleStripesProps) {
  const maskStyle =
    fade === "none"
      ? undefined
      : {
          WebkitMaskImage: `linear-gradient(to ${fade}, transparent, #000 45%)`,
          maskImage: `linear-gradient(to ${fade}, transparent, #000 45%)`,
        };

  // When drifting we lay down two identical copies so the conveyor can loop
  // seamlessly; everything keys off `i % count` to keep the halves in sync.
  const total = drift === "none" ? count : count * 2;

  const stripe = (i: number) => {
    const k = i % count;
    const style: CSSProperties = {
      background: SUNSET[k % SUNSET.length],
      transformOrigin: "center",
      animation: `stripe-ripple ${4 + (k % 5) * 0.6}s ease-in-out ${
        k * 0.18
      }s infinite, stripe-shimmer ${5 + (k % 4)}s ease-in-out ${
        k * 0.12
      }s infinite`,
    };
    if (variant === "wave") {
      style.height = `${waveHeight(k, count) * 100}%`;
    }
    return (
      <span
        key={i}
        className={cn(
          "block flex-1 rounded-full",
          variant === "wave" ? "self-center" : "h-full",
        )}
        style={style}
      />
    );
  };

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none h-full w-full",
        drift !== "none" && "overflow-hidden",
        className,
      )}
      style={maskStyle}
    >
      <div
        className={cn(
          "flex h-full items-center",
          drift === "none" ? "w-full" : "w-[200%]",
          drift === "left" && "animate-drift-left",
          drift === "right" && "animate-drift-right",
        )}
        style={{ columnGap: `${gap}px` }}
      >
        {Array.from({ length: total }).map((_, i) => stripe(i))}
      </div>
    </div>
  );
}
