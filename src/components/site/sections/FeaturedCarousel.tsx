import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

import { FEATURED, type Drink } from "@/data/site";
import { SideStripes } from "@/components/site/SideStripes";

function DrinkCard({ drink }: { drink: Drink }) {
  return (
    <motion.article
      whileHover={{ y: -10 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="group w-[300px] shrink-0 rounded-3xl border border-espresso/10 bg-cream p-7 shadow-sm transition-shadow hover:shadow-2xl hover:shadow-maroon/15"
    >
      {/* Vinyl-style disc that spins on hover */}
      <div className="relative mx-auto grid h-40 w-40 place-items-center">
        <div
          className="absolute inset-0 rounded-full transition-transform duration-700 group-hover:rotate-[120deg]"
          style={{
            background: `radial-gradient(circle at center, var(--color-espresso) 0 18%, ${drink.hue} 18% 100%)`,
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,.15)",
          }}
        >
          {/* groove rings */}
          <div className="absolute inset-3 rounded-full border border-espresso/15" />
          <div className="absolute inset-6 rounded-full border border-espresso/10" />
          <div className="absolute inset-10 rounded-full border border-espresso/10" />
        </div>
        <div className="absolute h-3 w-3 rounded-full bg-cream" />
      </div>

      <span className="mt-6 inline-block rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-terracotta">
        {drink.badge}
      </span>
      <h3 className="mt-3 font-groovy text-2xl leading-tight text-espresso">
        {drink.name}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-espresso/70">
        {drink.blurb}
      </p>
      <p className="mt-3 text-xs uppercase tracking-wide text-espresso/45">
        {drink.notes}
      </p>
    </motion.article>
  );
}

export function FeaturedCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  // Render the list twice so the strip can wrap seamlessly.
  const loop = [...FEATURED, ...FEATURED];

  // rAF-driven marquee. Translating ourselves (rather than a CSS animation)
  // lets us (a) wrap on an exactly-measured set width to kill the end-of-loop
  // jump, and (b) ease the speed up a touch while you're actively scrolling.
  const x = useRef(0);
  const setWidth = useRef(0);
  const boostTarget = useRef(0); // where the extra speed wants to be
  const boost = useRef(0); // eased extra speed actually applied
  const paused = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // One "set" repeat distance = half the full strip plus a single gap,
    // since the strip is the list duplicated with a gap between every item.
    const measure = () => {
      const gap = parseFloat(getComputedStyle(track).columnGap || "0") || 0;
      setWidth.current = (track.scrollWidth + gap) / 2;
    };
    measure();
    window.addEventListener("resize", measure);

    // Scroll velocity nudges a small, gently-decaying boost target so the
    // strip drifts a touch faster while you scroll, never lurching.
    const MAX_BOOST = 45; // px/s of extra speed at most (~base speed)
    let lastScrollY = window.scrollY;
    let lastScrollT = performance.now();
    const onScroll = () => {
      const now = performance.now();
      const dy = Math.abs(window.scrollY - lastScrollY);
      const dt = Math.max(now - lastScrollT, 1);
      const velocity = (dy / dt) * 1000; // px per second
      boostTarget.current = Math.min(velocity * 0.03, MAX_BOOST);
      lastScrollY = window.scrollY;
      lastScrollT = now;
    };
    if (!reduce) window.addEventListener("scroll", onScroll, { passive: true });

    const base = reduce ? 0 : 42; // px per second at rest (self-scroll)
    let last = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // The boost target relaxes back to zero, and the applied boost eases
      // toward it slowly — so any speed change ramps in and out gradually.
      boostTarget.current *= 0.94;
      if (boostTarget.current < 0.1) boostTarget.current = 0;
      boost.current += (boostTarget.current - boost.current) * Math.min(dt * 2.5, 1);

      if (!paused.current) {
        x.current -= (base + boost.current) * dt;
      }

      const w = setWidth.current;
      if (w > 0) {
        // Keep x within (-w, 0] so the duplicate keeps the strip filled and
        // the wrap point lands on identical content (no visible glitch).
        if (x.current <= -w) x.current += w;
        if (x.current > 0) x.current -= w;
      }
      track.style.transform = `translate3d(${x.current}px, 0, 0)`;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-cream-deep py-24">
      <SideStripes />

      <motion.div
        initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "0px 0px -18% 0px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto mb-12 max-w-6xl px-6 md:px-8"
      >
        <p className="font-groovy text-sm uppercase tracking-[0.35em] text-terracotta">
          Now Pouring
        </p>
        <h2 className="mt-3 font-groovy text-4xl text-espresso md:text-5xl">
          Featured on the bar
        </h2>
      </motion.div>

      <div
        className="relative"
        onMouseEnter={() => (paused.current = true)}
        onMouseLeave={() => (paused.current = false)}
      >
        <div ref={trackRef} className="flex w-max gap-6 px-6 will-change-transform">
          {loop.map((drink, i) => (
            <DrinkCard key={`${drink.name}-${i}`} drink={drink} />
          ))}
        </div>
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-cream-deep to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-cream-deep to-transparent" />
      </div>
    </section>
  );
}
