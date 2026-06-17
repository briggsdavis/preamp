import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Brief load-in sequence shown on the first paint of the site: the flat-icon
 * logo blurs in and the "Pre Amp Coffee Studio" wordmark settles in just
 * beneath it, then the whole curtain lifts away. Kept short so it never gets
 * in the way.
 */
export function Preloader() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // Lock scrolling under the curtain while it's up.
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => setDone(true), reduce ? 150 : 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence onExitComplete={() => (document.body.style.overflow = "")}>
      {!done && (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-[1.05rem] bg-espresso"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Flat-icon logo blurs in */}
          <motion.img
            src="/preamplogo.png"
            alt="Pre Amp"
            initial={{ opacity: 0, scale: 0.85, filter: "blur(14px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="h-24 w-24 object-contain md:h-28 md:w-28"
          />

          {/* Hero wordmark settles in just beneath it */}
          <motion.img
            src="/heroprimary.png"
            alt="Pre Amp Coffee Studio"
            initial={{ opacity: 0, y: 12, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-[12.8rem] max-w-[56vw] object-contain md:w-64"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
