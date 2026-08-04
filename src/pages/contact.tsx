import { api } from "@convex/_generated/api"
import { useMutation } from "convex/react"
import { motion, AnimatePresence } from "motion/react"
import { useMemo, useState, type FormEvent } from "react"
import { useLocation } from "react-router"
import { FaqList } from "@/components/site/faq-list"
import { MapEmbed } from "@/components/site/map-embed"
import { PageWrapper } from "@/components/site/page-wrapper"
import { RippleStripes } from "@/components/site/ripple-stripes"
import { SocialIcon } from "@/components/site/social-icons"
import { FAQ_ITEMS } from "@/data/faq"
import { CONTACT_TOPICS, type ContactTopic } from "@/lib/contact-topics"
import { useGlobalContent } from "@/lib/site-content"

/** Shared field styling for the cream-on-white inputs used across the form. */
const fieldClass =
  "w-full rounded-xl border-2 border-sand bg-white px-4 py-3 text-espresso placeholder:text-espresso/55 outline-none transition-colors focus:border-gold"

const TOPIC_DESCRIPTIONS: Record<ContactTopic, string> = {
  general: "Questions, feedback, collaborations, or anything else on your mind.",
  "menu-inquiry": "Ask about ingredients, dietary needs, availability, or our current menu.",
  "vinyl-request": "Tell us what record or artist you'd love to hear at the listening bar.",
}

const FAQ_REVEAL_INITIAL = { opacity: 0, y: 24 }
const FAQ_REVEAL_VISIBLE = { opacity: 1, y: 0 }
const FAQ_HEADER_VIEWPORT = { once: true, margin: "0px 0px -18% 0px" }
const FAQ_LIST_VIEWPORT = { once: true, margin: "0px 0px -10% 0px" }
const FAQ_REVEAL_TRANSITION = { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const }

export function Contact() {
  const global = useGlobalContent()
  const location = useLocation()
  const requestedTopic = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const topic = params.get("topic")
    return CONTACT_TOPICS.some((option) => option.value === topic) ? (topic as ContactTopic) : null
  }, [location.search])
  const shouldOpenForm = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return !!requestedTopic || params.get("form") === "open"
  }, [location.search, requestedTopic])
  const submitContact = useMutation(api.inquiries.submitContact)
  const [formOpen, setFormOpen] = useState(shouldOpenForm)
  const [topic, setTopic] = useState<ContactTopic>(requestedTopic ?? "general")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setSending(true)
    setError(null)
    try {
      await submitContact({
        firstName: String(fd.get("firstName") ?? ""),
        lastName: String(fd.get("lastName") ?? ""),
        email: String(fd.get("email") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        topic,
        message: String(fd.get("message") ?? ""),
      })
      setSent(true)
    } catch {
      setError("Something went wrong sending your note. Please try again.")
      setSending(false)
    }
  }

  return (
    <PageWrapper>
      <section className="relative overflow-hidden bg-terracotta">
        <div className="absolute inset-0 opacity-20">
          <RippleStripes count={26} fade="none" drift="right" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pt-32 pb-24 md:px-8 md:pt-40">
          {/* Two-column: heading + contact details on the left, image + sliding form on the right */}
          <div className="grid gap-10 md:grid-cols-2 md:items-stretch">
            {/* Left - heading + contact details */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
              className="flex flex-col"
            >
              <p className="font-groovy text-sm tracking-[0.35em] text-cream/80 uppercase">
                Say hello
              </p>
              <h1 className="mt-3 font-display text-5xl leading-tight text-cream md:text-7xl">
                Get In Touch
              </h1>

              <p className="mt-8 max-w-md text-lg text-cream/90">
                Pull up to the bar, send a note, or just come hang. Tucked into{" "}
                {global.neighborhood}, we'd love to hear what's spinning for you.
              </p>

              <div className="mt-9 space-y-6">
                <div>
                  <p className="font-groovy text-sm tracking-[0.25em] text-cream/70 uppercase">
                    Visit
                  </p>
                  <p className="mt-2 text-lg font-semibold text-cream">{global.address}</p>
                </div>

                <div>
                  <p className="font-groovy text-sm tracking-[0.25em] text-cream/70 uppercase">
                    Call
                  </p>
                  <a
                    href={`tel:${global.phone.replace(/[^0-9+]/g, "")}`}
                    className="mt-2 block text-lg font-semibold text-cream transition-colors hover:text-gold"
                  >
                    {global.phone}
                  </a>
                </div>

                <div className="rounded-2xl bg-espresso/20 p-5 backdrop-blur-sm">
                  <p className="font-groovy text-sm tracking-[0.2em] text-cream/80 uppercase">
                    Hours
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {global.hours.map((h) => (
                      <li key={h.day} className="flex justify-between gap-6 text-sm text-cream/90">
                        <span className="font-medium">{h.day}</span>
                        <span>{h.time}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {global.email && (
                  <div>
                    <p className="font-groovy text-sm tracking-[0.25em] text-cream/70 uppercase">
                      Email
                    </p>
                    <a
                      href={`mailto:${global.email}`}
                      className="mt-2 block text-lg font-semibold text-cream hover:text-gold"
                    >
                      {global.email}
                    </a>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  {global.socials.map((social) => (
                    <a
                      key={`${social.platform}-${social.url}`}
                      href={social.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-full border-2 border-cream/50 px-4 py-2 text-sm font-semibold text-cream transition-all hover:-translate-y-0.5 hover:border-cream hover:bg-cream/10"
                    >
                      <SocialIcon platform={social.platform} className="h-4 w-4" />
                      {social.label}
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right - image with a button that reveals a sliding contact form */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
              className="relative min-h-[720px] overflow-hidden rounded-3xl shadow-2xl sm:min-h-[680px] md:min-h-0"
            >
              <img
                src="/images/contactdecor.webp"
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
                    className="absolute inset-0 flex flex-col overflow-y-auto bg-cream-deep/97 p-5 backdrop-blur-md md:p-7"
                  >
                    <div className="flex items-start justify-between">
                      <h2 className="font-display text-3xl text-espresso">Send a Note</h2>
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
                        <p className="font-display text-4xl text-brick">Thanks!</p>
                        <p className="mt-3 max-w-xs text-espresso/80">
                          Your note's on its way. We'll get back to you as soon as we can.
                        </p>
                      </div>
                    ) : (
                      <form
                        onSubmit={handleSubmit}
                        className="mt-5 flex flex-1 flex-col gap-3 overflow-y-auto pb-2"
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
                        <div>
                          <label
                            htmlFor="contact-topic"
                            className="mb-1.5 block text-sm font-semibold text-espresso md:hidden"
                          >
                            What can we help with?
                          </label>
                          <select
                            id="contact-topic"
                            required
                            name="topic"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value as ContactTopic)}
                            className={fieldClass}
                          >
                            {CONTACT_TOPICS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1.5 text-sm leading-snug text-espresso/65 md:hidden">
                            {TOPIC_DESCRIPTIONS[topic]}
                          </p>
                        </div>
                        <textarea
                          required
                          name="message"
                          placeholder="Message"
                          rows={4}
                          className={`${fieldClass} min-h-40 flex-none resize-none md:min-h-0 md:flex-1`}
                        />
                        {error && <p className="text-sm font-semibold text-maroon">{error}</p>}
                        <button
                          type="submit"
                          disabled={sending}
                          className="mt-1 shrink-0 rounded-full bg-brick px-7 py-3 font-semibold text-cream shadow-lg transition-all hover:-translate-y-1 hover:bg-maroon disabled:opacity-60"
                        >
                          {sending ? "Sending…" : "Send Message →"}
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
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
          >
            <p className="font-groovy text-sm tracking-[0.35em] text-gold uppercase">
              Find the studio
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-cream md:text-5xl">
              Come Find Us
            </h2>
            <p className="mt-5 max-w-md text-lg text-cream/85">
              We're right in the heart of {global.neighborhood}. Street parking is easy and the
              records are always on. Swing by, grab a stool, and stay a while.
            </p>
            <p className="mt-6 text-lg font-semibold text-cream">{global.address}</p>
            <a
              href={global.mapsLink}
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-block rounded-full bg-cream px-7 py-3 font-semibold text-espresso shadow-lg transition-all hover:-translate-y-1 hover:bg-gold"
            >
              Get Directions →
            </a>
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
              src={global.mapsEmbed}
              className="h-full min-h-[360px] w-full"
            />
          </motion.div>
        </div>
      </section>

      <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-24 bg-cream-deep">
        <div className="mx-auto max-w-5xl px-6 py-24 md:px-8 md:py-32">
          <motion.div
            initial={FAQ_REVEAL_INITIAL}
            whileInView={FAQ_REVEAL_VISIBLE}
            viewport={FAQ_HEADER_VIEWPORT}
            transition={FAQ_REVEAL_TRANSITION}
            className="mb-12 text-center"
          >
            <p className="font-groovy text-sm tracking-widest text-terracotta uppercase">
              Before you visit
            </p>
            <h2
              id="faq-heading"
              className="mt-3 font-display text-4xl leading-tight text-espresso md:text-6xl"
            >
              Frequently Asked Questions
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-espresso/70">
              Everything you need to know about the coffee, food, studio, and stopping by.
            </p>
          </motion.div>

          <motion.div
            initial={FAQ_REVEAL_INITIAL}
            whileInView={FAQ_REVEAL_VISIBLE}
            viewport={FAQ_LIST_VIEWPORT}
            transition={FAQ_REVEAL_TRANSITION}
          >
            <FaqList items={FAQ_ITEMS} />
          </motion.div>
        </div>
      </section>
    </PageWrapper>
  )
}
