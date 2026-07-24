import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState } from "react"
import { useTrack } from "@/lib/analytics"
import { useGlobalContent } from "@/lib/site-content"

/**
 * A slim, mobile-only "Order" bar pinned to the bottom of the viewport. It
 * slides in after the visitor scrolls past the hero and can be dismissed for
 * the rest of the session (so repeat scrolling doesn't nag). The desktop navbar
 * keeps its own "Order now" button, so this is hidden at md+.
 */

const DISMISS_KEY = "preamp_orderbar_dismissed" // session-scoped

export function StickyOrderBar() {
  const track = useTrack()
  const global = useGlobalContent()
  const [scrolled, setScrolled] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // If it was dismissed this session, never attach the listener - `scrolled`
    // stays false and the bar never appears (no setState in the effect body).
    try {
      if (window.sessionStorage.getItem(DISMISS_KEY) === "1") return
    } catch {
      /* storage blocked - just show it */
    }
    const onScroll = () => setScrolled(window.scrollY > 520)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  function dismiss() {
    setDismissed(true)
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1")
    } catch {
      /* ignore */
    }
  }

  return (
    <AnimatePresence>
      {scrolled && !dismissed && (
        <motion.div
          initial={{ y: 90 }}
          animate={{ y: 0 }}
          exit={{ y: 90 }}
          transition={{ type: "spring", damping: 26, stiffness: 260 }}
          className="fixed inset-x-0 bottom-0 z-40 md:hidden"
        >
          <div className="mx-3 mb-3 flex items-center gap-3 rounded-2xl border border-espresso/10 bg-cream/95 p-2 pl-4 shadow-xl shadow-maroon/25 backdrop-blur">
            <p className="flex-1 text-sm leading-tight font-semibold text-espresso">
              Order Pre Amp on Toast
            </p>
            <a
              href={global.orderUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                track("order_click", {
                  clickSource: "sticky-mobile",
                  destination: global.orderUrl,
                })
              }
              className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-cream transition-colors hover:bg-brick"
            >
              Order
            </a>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss ordering bar"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-espresso/50 transition-colors hover:bg-espresso/10 hover:text-espresso"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
