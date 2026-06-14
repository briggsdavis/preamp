import { motion } from "framer-motion";

import { SITE } from "@/data/site";
import { RippleStripes } from "@/components/site/RippleStripes";

export function LocationCTA() {
  return (
    <section id="visit" className="relative overflow-hidden bg-terracotta">
      <div className="absolute inset-0 opacity-25">
        <RippleStripes count={26} fade="none" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-24 md:grid-cols-2 md:items-stretch md:px-8">
        <motion.div
          initial={{ opacity: 0, x: -30, filter: "blur(12px)" }}
          whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
        >
          <p className="font-groovy text-sm uppercase tracking-[0.35em] text-cream/80">
            Come hang
          </p>
          <h2 className="mt-3 font-display text-5xl leading-tight text-cream md:text-6xl">
            Find Us
          </h2>
          <p className="mt-5 max-w-md text-lg text-cream/90">
            Tucked into {SITE.neighborhood}. Pull up, grab a stool, and tell us
            what's spinning.
          </p>

          <div className="mt-7 space-y-1 text-cream">
            <p className="text-lg font-semibold">{SITE.address}</p>
            <p className="text-cream/85">{SITE.phone}</p>
          </div>

          <div className="mt-6 rounded-2xl bg-espresso/20 p-5 backdrop-blur-sm">
            <p className="font-groovy text-sm uppercase tracking-[0.2em] text-cream/80">
              Hours
            </p>
            <ul className="mt-3 space-y-1.5">
              {SITE.hours.map((h) => (
                <li
                  key={h.day}
                  className="flex justify-between gap-6 text-sm text-cream/90"
                >
                  <span className="font-medium">{h.day}</span>
                  <span>{h.time}</span>
                </li>
              ))}
            </ul>
          </div>

          <a
            href={SITE.mapsLink}
            target="_blank"
            rel="noreferrer"
            className="mt-7 inline-block rounded-full bg-cream px-7 py-3 font-semibold text-terracotta shadow-lg transition-all hover:-translate-y-1 hover:bg-gold hover:text-espresso"
          >
            Get Directions →
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, filter: "blur(12px)" }}
          whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="overflow-hidden rounded-3xl border-4 border-cream/60 shadow-2xl"
        >
          <iframe
            title="Pre Amp Coffee Studio location map"
            src={SITE.mapsEmbed}
            className="h-full min-h-[420px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </motion.div>
      </div>
    </section>
  );
}
