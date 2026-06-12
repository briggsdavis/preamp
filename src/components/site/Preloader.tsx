import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Brief black load-in sequence shown on the first paint of the site: a vinyl
 * disc spins up, the wordmark resolves, a gold line sweeps, then the whole
 * curtain lifts away. Kept short and minimal so it never gets in the way.
 */
export function Preloader() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // Lock scrolling under the curtain while it's up.
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => setDone(true), reduce ? 150 : 1300);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence onExitComplete={() => (document.body.style.overflow = "")}>
      {!done && (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-espresso"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Vinyl disc */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative grid h-20 w-20 place-items-center rounded-full bg-espresso-soft shadow-2xl"
          >
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-gold to-terracotta animate-spin-slow">
              <span className="absolute inset-2 rounded-full border border-cream/20" />
              <span className="h-3 w-3 rounded-full bg-espresso" />
            </div>
          </motion.div>

          {/* Wordmark */}
          <motion.p
            initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="mt-6 font-display text-3xl tracking-[0.15em] text-gold"
          >
            Pre Amp
          </motion.p>

          {/* Sweeping line motif */}
          <motion.span
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.6, ease: "easeOut" }}
            className="mt-4 h-px w-32 origin-center bg-gradient-to-r from-transparent via-amber to-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
