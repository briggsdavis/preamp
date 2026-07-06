import { motion } from "framer-motion";

import { RD_RESTAURANTS, type Restaurant } from "@/data/site";
import { SquiggleLine } from "@/components/site/SquiggleLine";

const HUES = [
  "var(--color-gold)",
  "var(--color-amber)",
  "var(--color-orange)",
  "var(--color-terracotta)",
  "var(--color-brick)",
  "var(--color-maroon)",
];

function initials(name: string) {
  return name
    .replace(/[^a-zA-Z ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function RestaurantTile({ r, i }: { r: Restaurant; i: number }) {
  const hue = HUES[i % HUES.length];
  const Inner = (
    <div className="relative aspect-square overflow-hidden rounded-xl border border-espresso/10 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-maroon/20">
      {r.image ? (
        <img
          src={r.image}
          alt={r.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        // On-brand placeholder until a real Facebook image is supplied.
        <div
          className="grid h-full w-full place-items-center"
          style={{
            background: `radial-gradient(circle at 30% 25%, ${hue} 0%, var(--color-espresso) 95%)`,
          }}
        >
          <span className="font-display text-2xl text-cream/90 md:text-3xl">
            {initials(r.name)}
          </span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-espresso/85 to-transparent p-2 pt-6">
        <p className="truncate text-center text-[11px] font-semibold tracking-wide text-cream/95">
          {r.name}
        </p>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -18% 0px" }}
      transition={{ duration: 0.75, delay: (i % 7) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      {r.href ? (
        <a href={r.href} target="_blank" rel="noreferrer" className="block">
          {Inner}
        </a>
      ) : (
        Inner
      )}
    </motion.div>
  );
}

/** "Proud to be part of..." sister-restaurant showcase at the foot of the site. */
export function RestaurantGroup() {
  return (
    <section className="relative overflow-hidden bg-cream-deep py-20">
      <SquiggleLine />

      <div className="relative mx-auto max-w-7xl px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -18% 0px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <p className="font-groovy text-sm uppercase tracking-[0.35em] text-terracotta">
            The Family
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl font-groovy text-3xl leading-tight text-espresso md:text-4xl">
            Proud to be part of Richard Dishon's restaurant group.
          </h2>
        </motion.div>

        <div className="mt-12 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 md:gap-4 lg:grid-cols-7">
          {RD_RESTAURANTS.map((r, i) => (
            <RestaurantTile key={r.name} r={r} i={i} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -18% 0px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 text-center"
        >
          <a
            href="https://richarddeshantz.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-full bg-terracotta px-7 py-3 font-semibold text-cream shadow-lg shadow-maroon/20 transition-all hover:-translate-y-1 hover:bg-brick"
          >
            Visit the restaurant group →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
