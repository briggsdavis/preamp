import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { SITE } from "@/data/site";
import { PageWrapper } from "@/components/site/PageWrapper";
import { RippleStripes } from "@/components/site/RippleStripes";

/** Shared field styling for the cream-on-white inputs used across the form. */
const fieldClass =
  "w-full rounded-xl border-2 border-sand bg-white px-4 py-3 text-espresso placeholder:text-espresso/55 outline-none transition-colors focus:border-gold";

export function Contact() {
  const [formOpen, setFormOpen] = useState(false);
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <PageWrapper>
      <section className="relative overflow-hidden bg-terracotta">
        <div className="absolute inset-0 opacity-20">
          <RippleStripes count={26} fade="none" drift="right" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-32 md:px-8 md:pt-40">
          {/* Two-column: heading + contact details on the left, image + sliding form on the right */}
          <div className="grid gap-10 md:grid-cols-2 md:items-stretch">
            {/* Left — heading + contact details */}
            <motion.div
              initial={{ opacity: 0, x: -30, filter: "blur(12px)" }}
              whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
              className="flex flex-col"
            >
              <p className="font-groovy text-sm uppercase tracking-[0.35em] text-cream/80">
                Say hello
              </p>
              <h1 className="mt-3 font-display text-5xl leading-tight text-cream md:text-7xl">
                Get In Touch
              </h1>

              <p className="mt-8 max-w-md text-lg text-cream/90">
                Pull up to the bar, send a note, or just come hang. Tucked into{" "}
                {SITE.neighborhood}, we'd love to hear what's spinning for you.
              </p>

              <div className="mt-9 space-y-6">
                <div>
                  <p className="font-groovy text-sm uppercase tracking-[0.25em] text-cream/70">
                    Visit
                  </p>
                  <p className="mt-2 text-lg font-semibold text-cream">
                    {SITE.address}
                  </p>
                </div>

                <div>
                  <p className="font-groovy text-sm uppercase tracking-[0.25em] text-cream/70">
                    Call
                  </p>
                  <a
                    href={`tel:${SITE.phone.replace(/[^0-9+]/g, "")}`}
                    className="mt-2 block text-lg font-semibold text-cream transition-colors hover:text-gold"
                  >
                    {SITE.phone}
                  </a>
                </div>

                <div className="rounded-2xl bg-espresso/20 p-5 backdrop-blur-sm">
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

                <div className="flex gap-4">
                  <a
                    href={SITE.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border-2 border-cream/50 px-5 py-2 text-sm font-semibold text-cream transition-all hover:-translate-y-0.5 hover:border-cream hover:bg-cream/10"
                  >
                    Instagram
                  </a>
                  <a
                    href={SITE.tiktok}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border-2 border-cream/50 px-5 py-2 text-sm font-semibold text-cream transition-all hover:-translate-y-0.5 hover:border-cream hover:bg-cream/10"
                  >
                    TikTok
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Right — image with a button that reveals a sliding contact form */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, filter: "blur(12px)" }}
              whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
              className="relative min-h-[480px] overflow-hidden rounded-3xl shadow-2xl md:min-h-0"
            >
              <img
                src="/contactdecor.jpg"
                alt="Pre Amp Coffee Studio"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-espresso/70 via-transparent to-transparent" />

              {/* Button pinned to the bottom of the image */}
              <AnimatePresence>
                {!formOpen && (
                  <motion.div
                    key="form-cta"
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute inset-x-0 bottom-0 flex justify-center p-6"
                  >
                    <button
                      type="button"
                      onClick={() => setFormOpen(true)}
                      className="rounded-full bg-gold px-8 py-3 font-semibold text-espresso shadow-lg shadow-maroon/30 transition-all hover:-translate-y-1 hover:bg-amber"
                    >
                      Contact Form
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form slides up from the bottom of the image */}
              <AnimatePresence>
                {formOpen && (
                  <motion.div
                    key="form-panel"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 28, stiffness: 240 }}
                    className="absolute inset-0 flex flex-col bg-cream-deep/97 p-7 backdrop-blur-md"
                  >
                    <div className="flex items-start justify-between">
                      <h2 className="font-display text-3xl text-espresso">
                        Send a Note
                      </h2>
                      <button
                        type="button"
                        onClick={() => setFormOpen(false)}
                        aria-label="Close contact form"
                        className="rounded-full border-2 border-espresso/30 px-3 py-1 text-espresso transition-colors hover:bg-espresso/10"
                      >
                        ✕
                      </button>
                    </div>

                    {sent ? (
                      <div className="flex flex-1 flex-col items-center justify-center text-center">
                        <p className="font-display text-4xl text-brick">
                          Thanks!
                        </p>
                        <p className="mt-3 max-w-xs text-espresso/80">
                          Your note's on its way. We'll get back to you as soon
                          as we can.
                        </p>
                      </div>
                    ) : (
                      <form
                        onSubmit={handleSubmit}
                        className="mt-5 flex flex-1 flex-col gap-3 overflow-y-auto"
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input
                            required
                            name="firstName"
                            placeholder="First Name"
                            className={fieldClass}
                          />
                          <input
                            required
                            name="lastName"
                            placeholder="Last Name"
                            className={fieldClass}
                          />
                        </div>
                        <input
                          required
                          type="email"
                          name="email"
                          placeholder="Email"
                          className={fieldClass}
                        />
                        <input
                          required
                          type="tel"
                          name="phone"
                          placeholder="Phone Number"
                          className={fieldClass}
                        />
                        <textarea
                          required
                          name="message"
                          placeholder="Message"
                          rows={4}
                          className={`${fieldClass} flex-1 resize-none`}
                        />
                        <button
                          type="submit"
                          className="mt-1 rounded-full bg-brick px-7 py-3 font-semibold text-cream shadow-lg transition-all hover:-translate-y-1 hover:bg-maroon"
                        >
                          Send Message →
                        </button>
                      </form>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Location embed with text alongside */}
      <section className="relative overflow-hidden bg-espresso">
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-2 md:items-center md:px-8">
          <motion.div
            initial={{ opacity: 0, x: -30, filter: "blur(12px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
          >
            <p className="font-groovy text-sm uppercase tracking-[0.35em] text-gold">
              Find the studio
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-cream md:text-5xl">
              Come Find Us
            </h2>
            <p className="mt-5 max-w-md text-lg text-cream/85">
              We're right in the heart of {SITE.neighborhood}. Street parking is
              easy and the records are always on. Swing by, grab a stool, and
              stay a while.
            </p>
            <p className="mt-6 text-lg font-semibold text-cream">
              {SITE.address}
            </p>
            <a
              href={SITE.mapsLink}
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-block rounded-full bg-cream px-7 py-3 font-semibold text-espresso shadow-lg transition-all hover:-translate-y-1 hover:bg-gold"
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
              className="h-full min-h-[360px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </motion.div>
        </div>
      </section>
    </PageWrapper>
  );
}
