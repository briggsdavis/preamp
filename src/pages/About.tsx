import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

import { cn } from "@/lib/utils";
import { PageWrapper } from "@/components/site/PageWrapper";
import { RippleStripes } from "@/components/site/RippleStripes";

/**
 * The four things Pre Amp is about, each shown as a retro, analog-styled poster:
 * a photo washed with fine grain and a light haze, with the title set at the top
 * and a line of body copy at the bottom. Laid out as a masonry of varying
 * heights, so the tiles stagger like a print spread.
 */
interface AboutCard {
  kicker: string;
  title: string;
  body: string;
  image: string;
  imageAlt: string;
  to?: string;
  accent: string; // tailwind text color for the kicker
  height: string; // tailwind heights that stagger the masonry
}

const CARDS: AboutCard[] = [
  {
    kicker: "The Coffee",
    title: "Coffee we use",
    body: "Single-origin Passenger beans, pulled and poured like a fine spirit.",
    image: "/images/menu-coffeepacket.webp",
    imageAlt: "A bag of Passenger coffee beans",
    to: "/menu/coffee",
    accent: "text-gold",
    height: "h-[440px] md:h-[520px]",
  },
  {
    kicker: "The Craft",
    title: "Made from scratch",
    body: "House-made syrups and infusions in every cup, built by hand at the bar.",
    image: "/images/menu-coffeepouring.webp",
    imageAlt: "A barista crafting a drink at the bar",
    to: "/menu/coffee",
    accent: "text-amber",
    height: "h-[340px] md:h-[380px]",
  },
  {
    kicker: "The Vibe",
    title: "Spinning records daily",
    body: "Vinyl on the turntable from open to close. Brews and beats, always in rhythm.",
    image: "/images/eventvinyls.webp",
    imageAlt: "Vinyl records at the studio",
    to: "/events",
    accent: "text-terracotta",
    height: "h-[360px] md:h-[420px]",
  },
  {
    kicker: "The Food",
    title: "A rotating kitchen",
    body: "Focaccia sandwiches, fresh sides, and pastries that change with the week.",
    image: "/images/menu-sandwich.webp",
    imageAlt: "A focaccia sandwich from the kitchen",
    to: "/menu/food",
    accent: "text-gold",
    height: "h-[300px] md:h-[340px]",
  },
];

/** Fine film-grain texture, layered over each poster for the analog look. */
const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** One analog-styled poster tile: title on top, body copy on the bottom. */
function VisualCard({ card, index }: { card: AboutCard; index: number }) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: (index % 2) * 0.1 }}
      className={cn(
        "group relative overflow-hidden rounded-[1.75rem] border border-cream/15 shadow-2xl shadow-maroon/25",
        card.height,
      )}
    >
      <img
        src={card.image}
        alt={card.imageAlt}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
      />
      {/* Very light white haze for the faded, sun-bleached print feel. */}
      <div className="pointer-events-none absolute inset-0 bg-white/15 mix-blend-soft-light" />
      {/* Subtle film grain layered on top. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay"
        style={{ backgroundImage: GRAIN_URL }}
      />
      {/* Top + bottom darkening so the copy stays legible on any photo. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-espresso/70 via-espresso/5 to-espresso/80" />

      <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-7">
        <div>
          <p
            className={cn(
              "font-groovy text-[0.7rem] uppercase tracking-[0.35em]",
              card.accent,
            )}
          >
            {card.kicker}
          </p>
          <h3 className="mt-2 font-display text-3xl leading-tight text-cream drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] md:text-4xl">
            {card.title}
          </h3>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-cream/85 drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]">
          {card.body}
        </p>
      </div>
    </motion.div>
  );

  return card.to ? (
    <Link to={card.to} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export function About() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <PageWrapper>
      {/* Hero banner */}
      <section
        ref={heroRef}
        className="relative flex min-h-[82vh] items-center justify-center overflow-hidden"
      >
        <motion.div style={{ y: bgY }} className="absolute inset-0 -z-10 scale-110">
          <img
            src="/images/artworkheadon.webp"
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-espresso/75 via-maroon/55 to-espresso/85" />
        </motion.div>

        <motion.div
          style={{ opacity: fade }}
          className="relative mx-auto max-w-3xl px-6 text-center"
        >
          <p className="font-groovy text-sm uppercase tracking-[0.4em] text-cream/80">
            Pre Amp Coffee Studio · Pittsburgh
          </p>
          <h1 className="mt-4 font-display text-6xl text-cream drop-shadow-[0_4px_24px_rgba(0,0,0,0.4)] md:text-8xl">
            Our Story
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-cream/90">
            Coffee, craft, records, and a kitchen that never sits still - a
            listening bar in the heart of Squirrel Hill.
          </p>
        </motion.div>

        {/* waveform shimmer along the bottom of the hero */}
        <div className="absolute inset-x-0 bottom-0 h-24 opacity-30">
          <RippleStripes count={120} fade="none" variant="wave" gap={3} />
        </div>
      </section>

      {/* The four things we're about - quick, visual, no walls of text */}
      <section className="relative overflow-hidden bg-cream-deep py-24 md:py-32">
        <div className="relative mx-auto max-w-7xl px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <p className="font-groovy text-sm uppercase tracking-[0.35em] text-terracotta">
              What We're About
            </p>
            <h2 className="mt-3 font-display text-4xl text-espresso md:text-6xl">
              Four Things, No Filler
            </h2>
          </motion.div>

          <div className="mx-auto mt-14 max-w-4xl gap-6 [column-fill:_balance] sm:columns-2">
            {CARDS.map((card, i) => (
              <div key={card.kicker} className="mb-6 break-inside-avoid">
                <VisualCard card={card} index={i} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative overflow-hidden bg-terracotta py-24 text-center">
        <div className="absolute inset-0 opacity-25">
          <RippleStripes count={26} fade="none" drift="right" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative mx-auto max-w-2xl px-6"
        >
          <h2 className="font-display text-5xl text-cream md:text-6xl">
            Come Hang With Us
          </h2>
          <p className="mt-4 text-lg text-cream/90">
            5840 Forbes Ave, Squirrel Hill. Pull up a stool and tell us what's
            spinning.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/contact"
              className="rounded-full bg-cream px-7 py-3 font-semibold text-terracotta shadow-lg transition-all hover:-translate-y-1 hover:bg-gold hover:text-espresso"
            >
              Get In Touch
            </Link>
            <Link
              to="/menu/coffee"
              className="rounded-full border-2 border-cream/70 px-7 py-3 font-semibold text-cream transition-all hover:-translate-y-1 hover:border-cream hover:bg-cream/10"
            >
              See the Menu
            </Link>
          </div>
        </motion.div>
      </section>
    </PageWrapper>
  );
}
