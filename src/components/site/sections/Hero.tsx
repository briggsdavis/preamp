import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

import { SITE } from "@/data/site";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Layered parallax: background drifts slowly, content lifts, stripes shift.
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] items-center overflow-hidden"
    >
      {/* Photographic ambience, slow parallax */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 -z-20 scale-110">
        <img
          src="/images/preampdecor.jpg"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-espresso/80 via-maroon/55 to-espresso/85" />
        <div className="absolute inset-0 bg-gradient-to-t from-cream via-transparent to-transparent" />
      </motion.div>

      <motion.div
        style={{ y: contentY, opacity: fade }}
        className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-6 pt-28 text-center md:px-8"
      >
        <motion.img
          src="/images/heroprimary.png"
          alt={SITE.name}
          initial={{ opacity: 0, y: 30, filter: "blur(14px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 1.3, duration: 1.2 }}
          className="w-full max-w-2xl drop-shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
        />

        <motion.h1
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 2.0, duration: 1.05 }}
          className="mt-6 max-w-2xl font-groovy text-lg uppercase tracking-[0.18em] text-cream/90 md:text-xl"
        >
          Coffee studio &amp; vinyl listening bar, Squirrel Hill, Pittsburgh
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 2.7, duration: 1.05 }}
          className="mt-9 flex flex-wrap justify-center gap-4"
        >
          <Link
            to="/menu/coffee"
            className="rounded-full bg-gold px-7 py-3 font-semibold text-espresso shadow-lg shadow-maroon/30 transition-all hover:-translate-y-1 hover:bg-amber"
          >
            See the Menu
          </Link>
          <a
            href="#visit"
            className="rounded-full border-2 border-cream/70 px-7 py-3 font-semibold text-cream transition-all hover:-translate-y-1 hover:border-cream hover:bg-cream/10"
          >
            Find Us
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
