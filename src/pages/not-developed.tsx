import { motion } from "motion/react"
import { Link, useLocation } from "react-router"
import { PageWrapper } from "@/components/site/page-wrapper"
import { RippleStripes } from "@/components/site/ripple-stripes"

/** Friendly placeholder for every page that isn't built yet. */
export function NotDeveloped() {
  const { pathname } = useLocation()
  const label = pathname
    .replace(/\//g, " ")
    .replace(/-/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <PageWrapper>
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-espresso text-cream">
        <div className="absolute inset-0 opacity-25">
          <RippleStripes count={28} fade="none" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/60 to-espresso/90" />

        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <motion.div
            initial={false}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto grid h-32 w-32 place-items-center rounded-full bg-espresso-soft shadow-2xl"
          >
            <div className="animate-spin-slow grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-gold to-terracotta">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-espresso text-cream">
                ♪
              </span>
            </div>
          </motion.div>

          {label && (
            <motion.p
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 font-groovy text-sm tracking-[0.35em] text-amber uppercase"
            >
              {label}
            </motion.p>
          )}

          <motion.h1
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 font-display text-5xl leading-tight text-gold md:text-6xl"
          >
            Not Brewed Yet
          </motion.h1>

          <motion.p
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-5 max-w-md text-lg text-cream/80"
          >
            This page is still steeping. We're looking forward to building it. Check back soon for
            the full pour.
          </motion.p>

          <motion.div initial={false} animate={{ opacity: 1, y: 0 }}>
            <Link
              to="/"
              className="mt-9 inline-block rounded-full bg-gold px-8 py-3.5 font-semibold text-espresso shadow-lg shadow-maroon/30 transition-all hover:-translate-y-1 hover:bg-amber"
            >
              ← Back to Home
            </Link>
          </motion.div>
        </div>
      </section>
    </PageWrapper>
  )
}
