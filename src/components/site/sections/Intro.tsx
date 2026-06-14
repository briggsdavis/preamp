import { motion } from "framer-motion";

import { SideStripes } from "@/components/site/SideStripes";

export function Intro() {
  return (
    <section className="relative overflow-hidden px-6 py-24 md:py-32">
      <SideStripes />

      <motion.div
        initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "0px 0px -18% 0px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto max-w-3xl text-center"
      >
        <p className="font-groovy text-sm uppercase tracking-[0.35em] text-terracotta">
          Welcome in
        </p>
        <h2 className="mt-4 font-groovy text-4xl leading-tight text-espresso md:text-5xl">
          A little corner of Squirrel Hill that sounds as good as it tastes.
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-espresso/75">
          Pre Amp is part coffee studio, part listening bar. We obsess over the
          cup, single-origin pourovers, signature espresso drinks, slow-dripped
          cold brew, and we pair every one with the warm crackle of vinyl. Come
          for the coffee, stay for the record that's spinning.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <img
            src="/preampdecor4.jpg"
            alt=""
            className="h-56 w-full rounded-2xl object-cover shadow-lg shadow-maroon/15 ring-1 ring-espresso/10"
          />
          <img
            src="/preampdecor5.jpg"
            alt=""
            className="h-56 w-full rounded-2xl object-cover shadow-lg shadow-maroon/15 ring-1 ring-espresso/10"
          />
        </div>
      </motion.div>
    </section>
  );
}
