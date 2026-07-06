import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

import { PageWrapper } from "@/components/site/PageWrapper";
import { RippleStripes } from "@/components/site/RippleStripes";

/**
 * The four things Pre Amp is about, told with a short phrase and a photo each.
 * Images are the closest stand-ins already in the repo — swap `image` for the
 * real shot noted in `photoNote` when it's ready.
 */
interface AboutCard {
  kicker: string;
  phrase: string;
  image: string;
  imageAlt: string;
  photoNote: string;
  to?: string;
  accent: string; // tailwind text color for the kicker
}

const CARDS: AboutCard[] = [
  {
    kicker: "The Coffee",
    phrase: "Coffee we use",
    image: "/images/menu-coffeepacket.webp",
    imageAlt: "A bag of Passenger coffee beans",
    photoNote: "Real shot: a bag of Passenger Coffee",
    to: "/menu/coffee",
    accent: "text-gold",
  },
  {
    kicker: "The Craft",
    phrase: "Made from scratch",
    image: "/images/menu-coffeepouring.webp",
    imageAlt: "A barista crafting a drink at the bar",
    photoNote: "Real shot: weighing out house-made syrups for a drink",
    to: "/menu/coffee",
    accent: "text-amber",
  },
  {
    kicker: "The Vibe",
    phrase: "Spinning records daily",
    image: "/images/eventvinyls.webp",
    imageAlt: "Vinyl records at the studio",
    photoNote: "Real shot / loop: the turntable always playing vinyl",
    to: "/events",
    accent: "text-terracotta",
  },
  {
    kicker: "The Food",
    phrase: "A rotating kitchen",
    image: "/images/menu-sandwich.webp",
    imageAlt: "A focaccia sandwich from the kitchen",
    photoNote: "Real shot: the ever-changing food / pastry lineup",
    to: "/menu/food",
    accent: "text-gold",
  },
];

/** One big photo tile with a short caption overlaid, retro-styled. */
function VisualCard({ card, index }: { card: AboutCard; index: number }) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: (index % 2) * 0.1 }}
      className="group relative h-[320px] overflow-hidden rounded-[2rem] border-4 border-cream/10 shadow-2xl shadow-maroon/25 md:h-[420px]"
    >
      {/* photoNote: {card.photoNote} */}
      <img
        src={card.image}
        alt={card.imageAlt}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-7 md:p-8">
        <p
          className={`font-groovy text-xs uppercase tracking-[0.35em] ${card.accent}`}
        >
          {card.kicker}
        </p>
        <h3 className="mt-2 font-display text-3xl text-cream drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] md:text-4xl">
          {card.phrase}
        </h3>
      </div>
      {card.to && (
        <span className="absolute right-6 top-6 flex h-10 w-10 translate-y-1 items-center justify-center rounded-full bg-cream/90 text-lg text-espresso opacity-0 shadow transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          →
        </span>
      )}
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
            Coffee, craft, records, and a kitchen that never sits still — a
            listening bar in the heart of Squirrel Hill.
          </p>
        </motion.div>

        {/* waveform shimmer along the bottom of the hero */}
        <div className="absolute inset-x-0 bottom-0 h-24 opacity-30">
          <RippleStripes count={120} fade="none" variant="wave" gap={3} />
        </div>
      </section>

      {/* The four things we're about — quick, visual, no walls of text */}
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

          <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {CARDS.map((card, i) => (
              <VisualCard key={card.kicker} card={card} index={i} />
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
