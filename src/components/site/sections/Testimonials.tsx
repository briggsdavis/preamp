import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import { TESTIMONIALS } from "@/data/site";
import { SquiggleLine } from "@/components/site/SquiggleLine";
import { ErrorBoundary } from "@/components/site/ErrorBoundary";
import { useHomeContent } from "@/lib/siteContent";
import { EditableText, useInlineEditingMode } from "@/components/cms/InlineEditing";

interface Slide {
  quote: string;
  name: string;
  source: string;
  rating?: number;
}

/** Fallback quotes shown before any review is featured (or if Convex fails). */
const STATIC_SLIDES: Slide[] = TESTIMONIALS.map((t) => ({
  quote: t.quote,
  name: t.name,
  source: t.source,
}));

export function Testimonials() {
  return (
    <ErrorBoundary fallback={<TestimonialsView slides={STATIC_SLIDES} />}>
      <FeaturedTestimonials />
    </ErrorBoundary>
  );
}

/** Pulls admin-featured reviews; falls back to the static quotes when empty. */
function FeaturedTestimonials() {
  const featured = useQuery(api.reviews.listFeatured);
  const slides: Slide[] =
    featured && featured.length > 0
      ? featured.map((r) => ({
          quote: r.text,
          name: r.name,
          source: r.menuItemName ?? "Pre Amp",
          rating: r.rating,
        }))
      : STATIC_SLIDES;
  return <TestimonialsView slides={slides} />;
}

function TestimonialsView({ slides }: { slides: Slide[] }) {
  const content = useHomeContent().reviews;
  const editing = useInlineEditingMode();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Advance every 3 seconds.
  useEffect(() => {
    if (editing || paused || slides.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 3000);
    return () => clearInterval(id);
  }, [editing, paused, slides.length]);

  if (slides.length === 0) return null;
  const t = slides[Math.min(index, slides.length - 1)];

  return (
    <section className="relative overflow-hidden px-6 py-24 md:px-8">
      <SquiggleLine side="left" />
      <div className="relative z-10 mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -18% 0px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <p className="font-groovy text-sm uppercase tracking-[0.35em] text-terracotta">
            <EditableText path="reviews.kicker" value={content.kicker} />
          </p>
          <h2 className="mt-3 font-groovy text-4xl text-espresso md:text-5xl">
            <EditableText path="reviews.title" value={content.title} />
          </h2>
        </motion.div>

        <div
          className="relative mx-auto mt-12 flex h-56 max-w-3xl items-center justify-center overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={index}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -60 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute px-4 text-center"
            >
              <span className="font-display text-5xl text-gold/60">“</span>
              <p className="font-groovy text-2xl leading-snug text-espresso md:text-3xl">
                {t.quote}
              </p>
              {t.rating !== undefined && (
                <p
                  className="mt-3 text-gold"
                  aria-label={`${t.rating} out of 5 stars`}
                >
                  {"★".repeat(t.rating)}
                  <span className="text-espresso/20">
                    {"★".repeat(5 - t.rating)}
                  </span>
                </p>
              )}
              <footer className="mt-5 text-sm uppercase tracking-[0.2em] text-terracotta">
                {t.name} · {t.source}
              </footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Show testimonial ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-8 bg-terracotta" : "w-2 bg-espresso/20"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
