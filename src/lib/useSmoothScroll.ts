import { useEffect } from "react";

/**
 * Adds a subtle "weight" to wheel scrolling: instead of snapping to the native
 * scroll position, the page eases toward the target so momentum feels heavier.
 * Deliberately gentle, and disabled for touch input / reduced-motion users.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let target = window.scrollY;
    let current = window.scrollY;
    let animating = false;
    let raf = 0;
    // Easing factor: higher = snappier, lower = heavier. Kept subtle.
    const ease = 0.16;

    const maxScroll = () =>
      document.documentElement.scrollHeight - window.innerHeight;

    const step = () => {
      current += (target - current) * ease;
      if (Math.abs(target - current) < 0.4) {
        current = target;
        window.scrollTo(0, current);
        animating = false;
        return;
      }
      window.scrollTo(0, current);
      raf = requestAnimationFrame(step);
    };

    const onWheel = (e: WheelEvent) => {
      // Let pinch-zoom and modifier scrolls pass through untouched.
      if (e.ctrlKey || e.deltaMode !== 0) return;
      e.preventDefault();
      target = Math.max(0, Math.min(target + e.deltaY, maxScroll()));
      if (!animating) {
        animating = true;
        current = window.scrollY;
        raf = requestAnimationFrame(step);
      }
    };

    // Keep the target in sync when the page is scrolled by other means
    // (keyboard, scrollbar, anchor links, route changes).
    const onScroll = () => {
      if (!animating) target = window.scrollY;
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
}
