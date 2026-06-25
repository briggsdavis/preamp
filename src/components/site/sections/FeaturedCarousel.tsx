import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import { SITE } from "@/data/site";
import { SquiggleLine } from "@/components/site/SquiggleLine";
import { ErrorBoundary } from "@/components/site/ErrorBoundary";

interface FeaturedItem {
  _id: string;
  name: string;
  price: string;
  description: string;
  image: string | null;
}

function FeaturedCard({ item }: { item: FeaturedItem }) {
  return (
    <motion.article
      whileHover={{ y: -10 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="group flex w-[300px] shrink-0 flex-col overflow-hidden rounded-3xl border border-espresso/10 bg-cream shadow-sm transition-shadow hover:shadow-2xl hover:shadow-maroon/15"
    >
      <div className="h-44 w-full overflow-hidden bg-cream-deep">
        {item.image && (
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-groovy text-2xl leading-tight text-espresso">
            {item.name}
          </h3>
          <span className="shrink-0 font-semibold text-brick">
            {item.price}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-espresso/70">
          {item.description}
        </p>
        <a
          href={SITE.orderUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 block rounded-full bg-terracotta px-5 py-2.5 text-center text-sm font-semibold text-cream shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brick hover:shadow-md"
        >
          Order
        </a>
      </div>
    </motion.article>
  );
}

/** The animated marquee strip of featured items. */
function BestSellersStrip({ items }: { items: FeaturedItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  // Render the list twice so the strip can wrap seamlessly.
  const loop = [...items, ...items];

  const x = useRef(0);
  const setWidth = useRef(0);
  const boostTarget = useRef(0);
  const boost = useRef(0);
  const paused = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const measure = () => {
      const gap = parseFloat(getComputedStyle(track).columnGap || "0") || 0;
      setWidth.current = (track.scrollWidth + gap) / 2;
    };
    measure();
    window.addEventListener("resize", measure);

    const MAX_BOOST = 45;
    let lastScrollY = window.scrollY;
    let lastScrollT = performance.now();
    const onScroll = () => {
      const now = performance.now();
      const dy = Math.abs(window.scrollY - lastScrollY);
      const dt = Math.max(now - lastScrollT, 1);
      const velocity = (dy / dt) * 1000;
      boostTarget.current = Math.min(velocity * 0.03, MAX_BOOST);
      lastScrollY = window.scrollY;
      lastScrollT = now;
    };
    if (!reduce) window.addEventListener("scroll", onScroll, { passive: true });

    const base = reduce ? 0 : 42;
    let last = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      boostTarget.current *= 0.94;
      if (boostTarget.current < 0.1) boostTarget.current = 0;
      boost.current +=
        (boostTarget.current - boost.current) * Math.min(dt * 2.5, 1);

      if (!paused.current) {
        x.current -= (base + boost.current) * dt;
      }

      const w = setWidth.current;
      if (w > 0) {
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
      <SquiggleLine />

      <motion.div
        initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "0px 0px -18% 0px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto mb-12 max-w-6xl px-6 md:px-8"
      >
        <p className="font-groovy text-sm uppercase tracking-[0.35em] text-terracotta">
          Now Pouring
        </p>
        <h2 className="mt-3 font-groovy text-4xl text-espresso md:text-5xl">
          Best Sellers
        </h2>
      </motion.div>

      <div
        className="relative"
        onMouseEnter={() => (paused.current = true)}
        onMouseLeave={() => (paused.current = false)}
      >
        <div
          ref={trackRef}
          className="flex w-max gap-6 px-6 will-change-transform"
        >
          {loop.map((item, i) => (
            <FeaturedCard key={`${item._id}-${i}`} item={item} />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-cream-deep to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-cream-deep to-transparent" />
      </div>
    </section>
  );
}

/** Reads featured menu items; hides the whole section when there are none. */
function FeaturedCarouselInner() {
  const items = useQuery(api.menu.listFeatured) as FeaturedItem[] | undefined;
  if (!items || items.length === 0) return null;
  return <BestSellersStrip items={items} />;
}

export function FeaturedCarousel() {
  return (
    <ErrorBoundary fallback={null}>
      <FeaturedCarouselInner />
    </ErrorBoundary>
  );
}
