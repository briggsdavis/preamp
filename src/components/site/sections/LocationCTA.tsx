import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { SITE } from "@/data/site";
import { RippleStripes } from "@/components/site/RippleStripes";
import { MapEmbed } from "@/components/site/MapEmbed";
import { useTrack } from "@/lib/analytics";

export function LocationCTA() {
  const track = useTrack();
  return (
    <section id="visit" className="relative overflow-hidden bg-terracotta">
      <div className="absolute inset-0 opacity-25">
        <RippleStripes count={26} fade="none" drift="left" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-24 md:grid-cols-2 md:items-stretch md:px-8">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
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

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={SITE.orderUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                track("order_click", {
                  clickSource: "location",
                  destination: SITE.orderUrl,
                })
              }
              className="inline-block rounded-full bg-espresso px-7 py-3 font-semibold text-cream shadow-lg transition-all hover:-translate-y-1 hover:bg-maroon"
            >
              Order Ahead →
            </a>
            <a
              href={SITE.mapsLink}
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                track("cta_click", {
                  cta: "directions",
                  destination: SITE.mapsLink,
                })
              }
              className="inline-block rounded-full bg-cream px-7 py-3 font-semibold text-terracotta shadow-lg transition-all hover:-translate-y-1 hover:bg-gold hover:text-espresso"
            >
              Get Directions →
            </a>
          </div>

          <div className="mt-8 rounded-2xl bg-cream/12 p-5 backdrop-blur-sm">
            <p className="font-display text-2xl text-cream">
              Request a vinyl to be played
            </p>
            <p className="mt-2 text-sm leading-relaxed text-cream/80">
              Send us the record, artist, or song you want to hear on the bar.
            </p>
            <Link
              to="/contact?topic=vinyl-request&form=open"
              onClick={() =>
                track("cta_click", {
                  cta: "vinyl-request",
                  destination: "/contact?topic=vinyl-request&form=open",
                })
              }
              className="mt-4 inline-block rounded-full bg-gold px-6 py-2.5 font-semibold text-espresso shadow-lg transition-all hover:-translate-y-1 hover:bg-amber"
            >
              Request Vinyl →
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="overflow-hidden rounded-3xl border-4 border-cream/60 shadow-2xl"
        >
          <MapEmbed
            title="Pre Amp Coffee Studio location map"
            src={SITE.mapsEmbed}
            className="h-full min-h-[420px] w-full"
          />
        </motion.div>
      </div>
    </section>
  );
}
