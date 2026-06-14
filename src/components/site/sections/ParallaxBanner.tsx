import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ParallaxBannerProps {
  image: string;
  kicker?: string;
  heading: string;
  sub?: string;
}

/** Full-bleed image band whose photo drifts against the scroll for depth. */
export function ParallaxBanner({
  image,
  kicker,
  heading,
  sub,
}: ParallaxBannerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["20%", "-20%"]);

  return (
    <section
      ref={ref}
      className="relative flex h-[70vh] items-center justify-center overflow-hidden"
    >
      <motion.div style={{ y }} className="absolute inset-0 -z-10 scale-125">
        <img src={image} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-espresso/55" />
      </motion.div>

      <motion.div
        style={{ y: textY }}
        initial={{ opacity: 0, filter: "blur(14px)" }}
        whileInView={{ opacity: 1, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "0px 0px -18% 0px" }}
        transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-4xl px-6 text-center"
      >
        {kicker && (
          <p className="font-groovy text-sm uppercase tracking-[0.4em] text-amber">
            {kicker}
          </p>
        )}
        <h2 className="mt-4 font-display text-5xl leading-tight text-cream md:text-7xl">
          {heading}
        </h2>
        {sub && (
          <p className="mx-auto mt-5 max-w-2xl text-lg text-cream/85">{sub}</p>
        )}
      </motion.div>
    </section>
  );
}
