import { motion } from "motion/react"
import { Link } from "react-router"
import { SquiggleLine } from "@/components/site/squiggle-line"
import { FAQ_ITEMS } from "@/data/faq"

const PREVIEW_ITEMS = FAQ_ITEMS.slice(0, 3)
const REVEAL_INITIAL = { opacity: 0, y: 24 }
const REVEAL_VISIBLE = { opacity: 1, y: 0 }
const REVEAL_VIEWPORT = { once: true, margin: "0px 0px -18% 0px" }
const HEADER_TRANSITION = { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const }
const CARD_TRANSITIONS = PREVIEW_ITEMS.map((_, index) => ({
  duration: 0.75,
  delay: index * 0.08,
  ease: [0.22, 1, 0.36, 1] as const,
}))

export function FaqPreview() {
  return (
    <section className="relative overflow-hidden bg-cream-deep px-6 py-24 md:px-8 md:py-32">
      <SquiggleLine />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={REVEAL_INITIAL}
          whileInView={REVEAL_VISIBLE}
          viewport={REVEAL_VIEWPORT}
          transition={HEADER_TRANSITION}
          className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="font-groovy text-sm tracking-widest text-terracotta uppercase">
              Good to know
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-espresso md:text-6xl">
              Questions, answered.
            </h2>
          </div>
          <Link
            to="/contact#faq"
            className="w-fit rounded-full bg-terracotta px-7 py-3 font-semibold text-cream shadow-lg transition-all hover:-translate-y-1 hover:bg-maroon"
          >
            Read All FAQs →
          </Link>
        </motion.div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PREVIEW_ITEMS.map((item, index) => (
            <motion.article
              key={item.question}
              initial={REVEAL_INITIAL}
              whileInView={REVEAL_VISIBLE}
              viewport={REVEAL_VIEWPORT}
              transition={CARD_TRANSITIONS[index]}
              className="rounded-3xl border border-espresso/10 bg-cream p-7 shadow-lg shadow-maroon/10"
            >
              <p className="font-groovy text-sm tracking-widest text-terracotta uppercase">
                0{index + 1}
              </p>
              <h3 className="mt-4 font-display text-2xl leading-tight text-espresso">
                {item.question}
              </h3>
              <p className="mt-4 leading-relaxed text-espresso/70">{item.answer}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
