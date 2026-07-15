import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

import { PageWrapper } from "@/components/site/PageWrapper";
import { RippleStripes } from "@/components/site/RippleStripes";

const ABOUT_DECOR_IMAGES = [
  {
    src: "/images/aboutdecor1.jpg",
    alt: "Interior detail at Pre Amp Coffee Studio",
  },
  {
    src: "/images/aboutdecor2.jpg",
    alt: "Pre Amp Coffee Studio decor detail",
  },
  {
    src: "/images/aboutdecor3.jpg",
    alt: "Coffee studio seating and decor",
  },
  {
    src: "/images/aboutdecor4.jpg",
    alt: "Analog decor at Pre Amp Coffee Studio",
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

      {/* About feature image */}
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

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7 }}
            className="mx-auto mt-14 max-w-5xl overflow-hidden rounded-[1.75rem] border border-espresso/10 shadow-2xl shadow-maroon/20"
          >
            <img
              src="/images/vinyl.png"
              alt="Vinyl records at Pre Amp Coffee Studio"
              loading="lazy"
              decoding="async"
              className="h-auto w-full object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* Meet the owner - Danny Ryan */}
      <section className="relative overflow-hidden bg-cream py-24 md:py-32">
        <div className="relative mx-auto max-w-5xl px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="grid items-center gap-10 md:grid-cols-[auto_1fr] md:gap-14"
          >
            {/* Left: circular portrait with name + title */}
            <div className="flex flex-col items-center text-center">
              <div className="relative h-[19.5rem] w-[19.5rem] overflow-hidden rounded-full border-4 border-gold/60 shadow-2xl shadow-maroon/25 md:h-[22.5rem] md:w-[22.5rem]">
                <img
                  src="/images/danny.jpg"
                  alt="Danny Ryan, owner of Pre Amp Coffee Studio"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="mt-6 font-display text-3xl text-espresso">
                Danny Ryan
              </h3>
              <p className="mt-1 font-groovy text-sm uppercase tracking-[0.25em] text-terracotta">
                Restaurant Owner & Operator
              </p>
            </div>

            {/* Right: introduction */}
            <div>
              <p className="font-groovy text-sm uppercase tracking-[0.35em] text-terracotta">
                Meet the Owner
              </p>
              <h2 className="mt-3 font-display text-3xl leading-tight text-espresso md:text-4xl">
                A Decade in the Making
              </h2>
              <div className="mt-5 space-y-4 text-base text-espresso/80">
                <p>
                  After dedicating a decade to working in restaurants, cafes, and
                  a roastery in New York City, I finally decided to pack up my
                  family and embark on a new chapter: opening my own cafe in
                  Pittsburgh in 2020. However, the pandemic had other plans for
                  us, and, in a twist of fate, things worked out better than I
                  could have ever imagined or anticipated.
                </p>
                <p>
                  While seeking work during the pandemic's uncertainty, I had the
                  fortune of meeting Tolga and Rick. They brought me on as their
                  coffee lead at Coop De Ville, and from there, the rest is
                  history. Their unwavering trust led to a partnership focused on
                  creating the ultimate coffee experience in Pittsburgh, a dream I
                  couldn't have achieved on my own. With their incredible support
                  and belief, I've been able to build and realize my vision:
                  establishing what I believe will be the best coffee shop in
                  Pittsburgh.
                </p>
                <p>
                  My passion for coffee ignited in 2009, sparked by a $6 cup of
                  coffee on a Clover machine from Cafe Grumpy in NYC. I was
                  utterly captivated and surprised by the complexity, rich
                  flavors, and compelling stories held within each bean.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="mx-auto mt-14 grid max-w-7xl grid-cols-2 gap-4 md:-mx-24 md:grid-cols-4 md:gap-5">
            {ABOUT_DECOR_IMAGES.map((image, index) => (
              <motion.div
                key={image.src}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.65, delay: index * 0.08 }}
                className="aspect-square overflow-hidden rounded-[1.5rem] border border-sand/80 bg-cream-deep shadow-lg shadow-maroon/10"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </motion.div>
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
              to="/contact?topic=vinyl-request&form=open"
              className="rounded-full bg-gold px-7 py-3 font-semibold text-espresso shadow-lg transition-all hover:-translate-y-1 hover:bg-amber"
            >
              Request Vinyl
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
