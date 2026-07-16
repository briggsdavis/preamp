import { motion } from "framer-motion";

import { SquiggleLine } from "@/components/site/SquiggleLine";
import { imageUrl, useHomeContent } from "@/lib/siteContent";

export function Intro({ showLine = true }: { showLine?: boolean }) {
  const content = useHomeContent().intro;
  return (
    <section className="relative overflow-hidden px-6 py-24 md:py-32">
      {showLine && <SquiggleLine side="left" />}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -18% 0px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-20 mx-auto max-w-3xl text-center"
      >
        <p className="font-groovy text-sm uppercase tracking-[0.35em] text-terracotta">
          {content.kicker}
        </p>
        <h2 className="mt-4 font-groovy text-4xl leading-tight text-espresso md:text-5xl">
          {content.title}
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-espresso/75">
          {content.body}
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {content.images.map((item, index) => (
            <img
              key={index}
              src={imageUrl(item)}
              alt={item.alt}
              loading="lazy"
              decoding="async"
              className="h-[17.5rem] w-full rounded-2xl object-cover shadow-lg shadow-maroon/15 ring-1 ring-espresso/10"
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
