import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { TESTIMONIALS } from "@/data/site";

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Advance to the next testimonial every 3 seconds.
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 3000);
    return () => clearInterval(id);
  }, [paused]);

  const t = TESTIMONIALS[index];

  return (
    <section className="relative mx-auto max-w-5xl px-6 py-24 md:px-8">
      <div className="text-center">
        <p className="font-groovy text-sm uppercase tracking-[0.35em] text-terracotta">
          On the record
        </p>
        <h2 className="mt-3 font-groovy text-4xl text-espresso md:text-5xl">
          What the regulars say
        </h2>
      </div>

      <div
        className="relative mx-auto mt-12 flex h-56 max-w-3xl items-center justify-center overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={index}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute px-4 text-center"
          >
            <span className="font-display text-5xl text-gold/60">“</span>
            <p className="font-groovy text-2xl leading-snug text-espresso md:text-3xl">
              {t.quote}
            </p>
            <footer className="mt-5 text-sm uppercase tracking-[0.2em] text-terracotta">
              {t.name} · {t.source}
            </footer>
          </motion.blockquote>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            aria-label={`Show testimonial ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-8 bg-terracotta" : "w-2 bg-espresso/20"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
