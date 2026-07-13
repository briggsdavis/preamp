import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

import { SITE } from "@/data/site";
import { PageWrapper } from "@/components/site/PageWrapper";
import { SquiggleLine } from "@/components/site/SquiggleLine";
import { RippleStripes } from "@/components/site/RippleStripes";
import { useSeo } from "@/lib/seo";

/**
 * Cold Brew landing page - a pre-launch home for our Kyoto-style cold brew.
 * The hero + story are live now; the catering / delivery / retail blocks are
 * "coming soon" placeholders wired to flip on for the upcoming cold brew launch.
 */

/** A pre-launch feature card: title, blurb, and a "coming soon" ribbon. */
function ComingSoonCard({
  emoji,
  title,
  blurb,
}: {
  emoji: string;
  title: string;
  blurb: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="group relative overflow-hidden rounded-3xl border border-cream/10 bg-espresso-soft/60 p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:border-gold/40 hover:bg-espresso-soft"
    >
      <span className="absolute right-4 top-4 rounded-full bg-gold/20 px-3 py-1 font-groovy text-[0.65rem] uppercase tracking-[0.15em] text-gold">
        Coming soon
      </span>
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-3xl transition-transform duration-300 group-hover:scale-110 group-hover:bg-gold/25">
        {emoji}
      </span>
      <h3 className="mt-5 font-display text-2xl text-cream">{title}</h3>
      <p className="mt-3 text-cream/75">{blurb}</p>
    </motion.div>
  );
}

export function ColdBrew() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  useSeo({
    title: `Kyoto Cold Brew · ${SITE.name} ${SITE.tagline}`,
    description:
      "Slow-dripped Kyoto-style cold brew from Pre Amp Coffee Studio in Squirrel Hill - clean, syrupy, and made drip by drip. Office catering, home delivery, and bottles coming soon.",
    canonicalPath: "/cold-brew",
    image: "/images/menu-coffeemachine.webp",
  });

  return (
    <PageWrapper>
      {/* Hero banner */}
      <section
        ref={heroRef}
        className="relative flex min-h-[78vh] items-center justify-center overflow-hidden"
      >
        <motion.div style={{ y: bgY }} className="absolute inset-0 -z-10 scale-110">
          <img
            src="/images/menu-coffeemachine.webp"
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-espresso/75 via-maroon/55 to-espresso/85" />
        </motion.div>

        <motion.div
          style={{ opacity: fade }}
          className="relative mx-auto max-w-3xl px-6 pt-28 text-center"
        >
          <p className="font-groovy text-sm uppercase tracking-[0.4em] text-cream/80">
            Slow-dripped · Pre-Launch
          </p>
          <h1 className="mt-4 font-display text-6xl text-cream drop-shadow-[0_4px_24px_rgba(0,0,0,0.4)] md:text-8xl">
            Kyoto Cold Brew
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-cream/90">
            Twelve hours, one drop at a time. Clean, syrupy, impossibly smooth -
            and about to get a whole lot bigger.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href={SITE.orderUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-gold px-7 py-3 font-semibold text-espresso shadow-lg shadow-black/20 transition-all hover:-translate-y-1 hover:bg-amber"
            >
              Order In-Store →
            </a>
            <a
              href="#whats-coming"
              className="rounded-full border-2 border-cream/70 px-7 py-3 font-semibold text-cream transition-all hover:-translate-y-1 hover:border-cream hover:bg-cream/10"
            >
              What's Coming
            </a>
          </div>
        </motion.div>

        <div className="absolute inset-x-0 bottom-0 h-24 opacity-30">
          <RippleStripes count={120} fade="none" variant="wave" gap={3} />
        </div>
      </section>

      {/* The story of the drip */}
      <section className="relative overflow-hidden bg-cream-deep py-24 md:py-32">
        <SquiggleLine side="right" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 md:grid-cols-2 md:gap-16 md:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="group relative overflow-hidden rounded-3xl shadow-2xl shadow-maroon/20"
          >
            <img
              src="/images/menu-coffeebeans.webp"
              alt="Fresh coffee beans for cold brew"
              loading="lazy"
              decoding="async"
              className="h-[300px] w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110 md:h-[460px]"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-groovy text-sm uppercase tracking-[0.35em] text-terracotta">
              The Method
            </p>
            <div className="mt-5 space-y-4 text-lg text-espresso/80">
              <p>
                Kyoto-style cold brew is the slow road: ice-cold water falling
                one drop at a time through a tall tower of fresh Passenger
                grounds. No heat, no rush - just twelve patient hours.
              </p>
              <p>
                The result is a cup that's clean, low-acid, and almost syrupy,
                with the sweetness turned all the way up. Drink it neat over a
                big cube, or let a splash of milk carry it home.
              </p>
            </div>
            <a
              href={SITE.orderUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-block rounded-full bg-terracotta px-7 py-3 font-semibold text-cream shadow-lg shadow-maroon/20 transition-all hover:-translate-y-1 hover:bg-brick"
            >
              Order Now →
            </a>
          </motion.div>
        </div>
      </section>

      {/* What's coming - pre-launch placeholders */}
      <section
        id="whats-coming"
        className="relative scroll-mt-24 overflow-hidden bg-espresso py-24 md:py-32"
      >
        <div className="absolute inset-0 opacity-20">
          <RippleStripes count={26} fade="none" drift="left" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 md:px-8">
          <div className="text-center">
            <p className="font-groovy text-sm uppercase tracking-[0.35em] text-gold">
              The Big Launch
            </p>
            <h2 className="mt-3 font-display text-4xl text-cream md:text-5xl">
              More Ways to Get Your Fix
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-cream/75">
              We're scaling the drip. These are on the way - check back soon, or
              ask the bar to put you on the list.
            </p>
          </div>
          <div className="mt-14 grid gap-7 md:grid-cols-3">
            <ComingSoonCard
              emoji="🏢"
              title="Office Catering"
              blurb="Kegs and carafes of cold brew delivered to your team. Keep the whole office wired and happy through the afternoon slump."
            />
            <ComingSoonCard
              emoji="🚲"
              title="Home Delivery"
              blurb="Fresh cold brew brought right to your door on a schedule that fits your week. Never run dry on a Monday again."
            />
            <ComingSoonCard
              emoji="🍾"
              title="Bottles & Growlers"
              blurb="Take the studio home. Grab-and-go bottles and refillable growlers to stock your own fridge with the good stuff."
            />
          </div>
        </div>
      </section>

      {/* Where can you get it? */}
      <section className="relative overflow-hidden bg-cream py-24 md:py-32">
        <div className="relative mx-auto max-w-3xl px-6 text-center md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-groovy text-sm uppercase tracking-[0.35em] text-terracotta">
              Where to Get It
            </p>
            <h2 className="mt-3 font-display text-4xl text-espresso md:text-5xl">
              Available Now at the Bar
            </h2>
            <p className="mt-5 text-lg text-espresso/80">
              Right now, the Kyoto Cold Brew pours fresh at the studio -
              {" "}
              {SITE.address}. Pull up a stool, order at the counter, or grab one
              on your way through. Catering, delivery, and bottles land here the
              moment they're ready.
            </p>
          </motion.div>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href={SITE.orderUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-terracotta px-7 py-3 font-semibold text-cream shadow-lg shadow-maroon/20 transition-all hover:-translate-y-1 hover:bg-brick"
            >
              Order Online →
            </a>
            <a
              href={SITE.mapsLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border-2 border-espresso/30 px-7 py-3 font-semibold text-espresso transition-all hover:-translate-y-1 hover:border-espresso hover:bg-espresso/5"
            >
              Get Directions
            </a>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
