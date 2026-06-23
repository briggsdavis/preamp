import { useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

import { PageWrapper } from "@/components/site/PageWrapper";
import { SquiggleLine } from "@/components/site/SquiggleLine";
import { RippleStripes } from "@/components/site/RippleStripes";

/** A reusable alternating image/text feature row with a hover-zoom image. */
function FeatureSection({
  kicker,
  title,
  children,
  image,
  imageAlt = "",
  reverse = false,
  dark = false,
  cta,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
  image: string;
  imageAlt?: string;
  reverse?: boolean;
  dark?: boolean;
  cta?: { label: string; to: string };
}) {
  return (
    <section
      className={`relative overflow-hidden ${
        dark ? "bg-espresso text-cream" : "bg-cream text-espresso"
      }`}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 md:grid-cols-2 md:gap-16 md:py-28 md:px-8">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, filter: "blur(12px)" }}
          whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className={`group relative overflow-hidden rounded-3xl shadow-2xl shadow-maroon/20 ${
            reverse ? "md:order-2" : ""
          }`}
        >
          <img
            src={image}
            alt={imageAlt}
            className="h-[300px] w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110 md:h-[460px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-espresso/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </motion.div>

        {/* Copy */}
        <motion.div
          initial={{ opacity: 0, x: reverse ? -30 : 30, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className={reverse ? "md:order-1" : ""}
        >
          <p
            className={`font-groovy text-sm uppercase tracking-[0.35em] ${
              dark ? "text-gold" : "text-terracotta"
            }`}
          >
            {kicker}
          </p>
          <h2 className="mt-3 font-display text-4xl leading-tight md:text-5xl">
            {title}
          </h2>
          <div
            className={`mt-5 space-y-4 text-lg ${
              dark ? "text-cream/85" : "text-espresso/80"
            }`}
          >
            {children}
          </div>
          {cta && (
            <Link
              to={cta.to}
              className="mt-7 inline-block rounded-full bg-gold px-7 py-3 font-semibold text-espresso shadow-lg shadow-maroon/20 transition-all hover:-translate-y-1 hover:bg-amber"
            >
              {cta.label}
            </Link>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/** Line icons for the value cards - inherit color via currentColor. */
function PrecisionIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
      <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" />
    </svg>
  );
}

function WarmthIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* rising steam */}
      <path d="M8.5 2.2c-.7.9-.7 1.9 0 2.8M12 2.2c-.7.9-.7 1.9 0 2.8M15.5 2.2c-.7.9-.7 1.9 0 2.8" />
      {/* mug */}
      <path d="M4 8.5h12.5v4.5a5.5 5.5 0 0 1-5.5 5.5H9.5A5.5 5.5 0 0 1 4 13V8.5z" />
      {/* handle */}
      <path d="M16.5 9.5h2.2a2.4 2.4 0 0 1 0 4.8h-2.2" />
      {/* saucer */}
      <path d="M5 21h11" />
    </svg>
  );
}

function RhythmIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 17V5l10-2v12" />
      <circle cx="6.5" cy="17" r="2.5" />
      <circle cx="16.5" cy="15" r="2.5" />
      <path d="M9 9l10-2" />
    </svg>
  );
}

const VALUES = [
  {
    Icon: PrecisionIcon,
    title: "Precision",
    body: "Every espresso shot is treated like a fine spirit, with house-made syrups, unique infusions, balanced like a master bartender would.",
  },
  {
    Icon: WarmthIcon,
    title: "Warmth",
    body: "Our space hums with the aroma of beans roasted to perfection, welcoming every kind of coffee lover up to the bar.",
  },
  {
    Icon: RhythmIcon,
    title: "Rhythm",
    body: "Vinyl spinning all day. Brews and beats, woven together so every visit hits the perfect note.",
  },
];

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
            src="/artworkheadon.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-espresso/75 via-maroon/55 to-espresso/85" />
        </motion.div>

        <motion.div
          style={{ opacity: fade }}
          className="relative mx-auto max-w-3xl px-6 text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.2, duration: 1 }}
            className="font-groovy text-sm uppercase tracking-[0.4em] text-cream/80"
          >
            Pre Amp Coffee Studio · Pittsburgh
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24, filter: "blur(14px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.4, duration: 1 }}
            className="mt-4 font-display text-6xl text-cream drop-shadow-[0_4px_24px_rgba(0,0,0,0.4)] md:text-8xl"
          >
            Our Story
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.7, duration: 1 }}
            className="mx-auto mt-6 max-w-xl text-lg text-cream/90"
          >
            Every sip hits the perfect note. A coffee studio and vinyl listening
            bar in the heart of Squirrel Hill.
          </motion.p>
        </motion.div>

        {/* waveform shimmer along the bottom of the hero */}
        <div className="absolute inset-x-0 bottom-0 h-24 opacity-30">
          <RippleStripes count={120} fade="none" variant="wave" gap={3} />
        </div>
      </section>

      {/* About Us - base section with the squiggle ribbon */}
      <section className="relative overflow-hidden bg-cream-deep py-24 md:py-32">
        <SquiggleLine side="right" />
        <div className="relative mx-auto max-w-3xl px-6 text-center md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-groovy text-sm uppercase tracking-[0.35em] text-terracotta">
              About Us
            </p>
            <h2 className="mt-3 font-display text-4xl text-espresso md:text-6xl">
              Every Sip Hits the Note
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-espresso/80">
              At Pre Amp, every sip hits the perfect note. Our space hums with
              the warmth of vinyl spinning and the aroma of beans roasted to
              perfection, welcoming every kind of coffee lover. Step up to our
              bar and watch our baristas, true coffee mixologists,
              meticulously craft your drink. Each espresso shot is treated like
              a fine spirit, blended with house-made syrups, unique infusions,
              and balanced with the precision of a master bartender. From bold
              and complex to smooth and sweet, every cup is a handcrafted liquid
              experience designed to awaken your senses.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values / philosophy - hover cards */}
      <section className="relative overflow-hidden bg-espresso py-24 md:py-32">
        <div className="absolute inset-0 opacity-20">
          <RippleStripes count={26} fade="none" drift="left" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 md:px-8">
          <div className="text-center">
            <p className="font-groovy text-sm uppercase tracking-[0.35em] text-gold">
              Our Philosophy
            </p>
            <h2 className="mt-3 font-display text-4xl text-cream md:text-5xl">
              What We Pour Into It
            </h2>
          </div>
          <div className="mt-14 grid gap-7 md:grid-cols-3">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group rounded-3xl border border-cream/10 bg-espresso-soft/60 p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:border-gold/40 hover:bg-espresso-soft"
              >
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-gold transition-transform duration-300 group-hover:scale-110 group-hover:bg-gold/25">
                  <v.Icon className="h-8 w-8" />
                </span>
                <h3 className="mt-5 font-display text-2xl text-cream">
                  {v.title}
                </h3>
                <p className="mt-3 text-cream/75">{v.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Origin - Danny Ryan */}
      <FeatureSection
        kicker="Our Origin"
        title="Meet Danny Ryan"
        image="/menu-coffeepouring.jpg"
        imageAlt="Pouring espresso at the Pre Amp bar"
      >
        <p>
          After a decade in restaurants, cafes, and a roastery in New York City,
          Danny packed up his family for a new chapter: opening a cafe in
          Pittsburgh in 2020. The pandemic had other plans, and in a twist of
          fate, things worked out better than he could have imagined.
        </p>
        <p>
          While seeking work, he met Tolga and Rick, who brought him on as
          coffee lead at Coup De Ville. Their trust grew into a partnership
          focused on creating the ultimate coffee experience in Pittsburgh, a
          dream he couldn't have achieved alone.
        </p>
        <p>
          His passion ignited in 2009 over a $6 cup brewed on a Clover machine
          at Cafe Grumpy in NYC, captivated by the complexity, rich flavors,
          and stories held within each bean.
        </p>
      </FeatureSection>

      {/* Coffee */}
      <FeatureSection
        kicker="The Coffee"
        title="Espresso, Treated Like a Spirit"
        image="/menu-coffeeshot.jpg"
        imageAlt="A handcrafted espresso drink"
        reverse
        dark
        cta={{ label: "Explore the Coffee →", to: "/menu/coffee" }}
      >
        <p>
          House-made syrups, unique infusions, and a bartender's balance go into
          every cup. Bold and complex or smooth and sweet, our baristas build
          each drink like a fine cocktail.
        </p>
        <p>
          From the signature Smokey Robinson to a bright Yuzu Espresso Tonic and
          the slow-dripped Kyoto Cold Brew, there's a note for every palate.
        </p>
      </FeatureSection>

      {/* Food */}
      <FeatureSection
        kicker="The Kitchen"
        title="Made to Pair With Your Cup"
        image="/menu-sandwich.jpg"
        imageAlt="A focaccia sandwich from the kitchen"
        cta={{ label: "See the Food →", to: "/menu/food" }}
      >
        <p>
          Our kitchen turns out house focaccia sandwiches, fresh sides, and
          comfort plates, all built to sit alongside whatever you're sipping.
        </p>
        <p className="text-base text-espresso/70">
          Kitchen hours: Wed – Sat 11am – 6pm · Sun 11am – 4pm (closed Mon &amp;
          Tue).
        </p>
      </FeatureSection>

      {/* Music & vinyl - with the waveform rhythm decoration */}
      <section className="relative overflow-hidden bg-espresso text-cream">
        {/* music rhythm band across the top */}
        <div className="absolute inset-x-0 top-0 h-28 opacity-30">
          <RippleStripes count={140} fade="none" variant="wave" gap={3} />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 pb-24 pt-36 md:grid-cols-2 md:gap-16 md:px-8">
          <motion.div
            initial={{ opacity: 0, x: -30, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-groovy text-sm uppercase tracking-[0.35em] text-gold">
              The Sound
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight md:text-5xl">
              Records Spinning, All Day
            </h2>
            <div className="mt-5 space-y-4 text-lg text-cream/85">
              <p>
                Pre Amp is as much a listening bar as it is a cafe. The needle
                drops the moment we open, and the warmth of vinyl carries
                through every pour.
              </p>
              <p>
                Crate-dig with us, catch a guest selector, or just let the
                playlist set the pace while your drink comes together at the
                bar. Brews and beats. That's the whole idea.
              </p>
            </div>
            <Link
              to="/events"
              className="mt-7 inline-block rounded-full border-2 border-cream/60 px-7 py-3 font-semibold text-cream transition-all hover:-translate-y-1 hover:border-cream hover:bg-cream/10"
            >
              See What's On →
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94, filter: "blur(12px)" }}
            whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="group overflow-hidden rounded-3xl shadow-2xl shadow-black/30">
              <img
                src="/eventvinyls.jpg"
                alt="Vinyl records"
                className="h-64 w-full object-cover transition-transform duration-[1.2s] group-hover:scale-110 md:h-80"
              />
            </div>
            <div className="group mt-8 overflow-hidden rounded-3xl shadow-2xl shadow-black/30">
              <img
                src="/eventspeakers.jpg"
                alt="Speakers in the studio"
                className="h-64 w-full object-cover transition-transform duration-[1.2s] group-hover:scale-110 md:h-80"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative overflow-hidden bg-terracotta py-24 text-center">
        <div className="absolute inset-0 opacity-25">
          <RippleStripes count={26} fade="none" drift="right" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
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
