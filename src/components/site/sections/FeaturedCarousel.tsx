import { useState } from "react";
import { motion } from "framer-motion";

import { FEATURED, type Drink } from "@/data/site";

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
  const [paused, setPaused] = useState(false);
  const loop = [...FEATURED, ...FEATURED];

  return (
    <section className="overflow-hidden bg-cream-deep py-24">
      <div className="mx-auto mb-12 max-w-6xl px-6 md:px-8">
        <p className="font-groovy text-sm uppercase tracking-[0.35em] text-terracotta">
          Now Pouring
        </p>
        <h2 className="mt-3 font-groovy text-4xl text-espresso md:text-5xl">
          Featured on the bar
        </h2>
      </div>

      <div
        className="relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="flex w-max gap-6 px-6"
          style={{
            animation: "marquee 34s linear infinite",
            animationPlayState: paused ? "paused" : "running",
          }}
        >
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
