import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import { QUIZ, SITE, predictDrink, type Drink } from "@/data/site";
import { SectionLines } from "@/components/site/SectionLines";
import { useTrack } from "@/lib/analytics";

/** Normalize a drink/item name for loose matching (drop brand + punctuation). */
function normName(s: string): string {
  return s
    .toLowerCase()
    .replace(/pre amp('s)?/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type MenuLookupItem = { name: string; orderUrl: string | null };

/** Find the Toast link for the menu item that best matches a quiz drink. */
function findItemOrder(
  drinkName: string,
  items: MenuLookupItem[],
): { name: string; orderUrl: string } {
  const target = normName(drinkName);
  const match = items.find((it) => {
    const n = normName(it.name);
    return n === target || n.includes(target) || target.includes(n);
  });
  // Fall back to the site-wide ordering page so the button always works.
  return {
    name: match?.name ?? drinkName,
    orderUrl: (match?.orderUrl || SITE.orderUrl) as string,
  };
}

export function CoffeeQuiz() {
  const track = useTrack();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Drink | null>(null);

  // Pull menu items (both menus) so a result can link to its own Toast page.
  const coffee = useQuery(api.menu.getMenu, { menu: "coffee" });
  const food = useQuery(api.menu.getMenu, { menu: "food" });
  const items = useMemo<MenuLookupItem[]>(() => {
    const out: MenuLookupItem[] = [];
    for (const data of [coffee, food]) {
      for (const section of data?.sections ?? []) {
        for (const it of section.items) {
          out.push({ name: it.name, orderUrl: it.orderUrl ?? null });
        }
      }
    }
    return out;
  }, [coffee, food]);

  const total = QUIZ.length;
  const current = QUIZ[step];

  function choose(value: string) {
    const next = { ...answers, [current.id]: value };
    setAnswers(next);
    if (step + 1 < total) {
      setStep(step + 1);
    } else {
      setResult(predictDrink(next));
    }
  }

  function reset() {
    setStep(0);
    setAnswers({});
    setResult(null);
  }

  return (
    <section className="relative overflow-hidden bg-espresso py-24 text-cream">
      <SectionLines count={26} opacity={0.1} drift="right" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "0px 0px -18% 0px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-groovy text-sm uppercase tracking-[0.35em] text-amber">
            The Pre Amp Oracle
          </p>
          <h2 className="mt-3 font-groovy text-4xl leading-tight md:text-5xl">
            Let the bar read your mood.
          </h2>
          <p className="mt-5 max-w-md text-cream/70">
            Four quick taps and we'll spin up the drink with your name on it.
            (Then come let us actually make it.)
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "0px 0px -18% 0px" }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative min-h-[340px] rounded-3xl border border-cream/15 bg-cream/[0.04] p-8 backdrop-blur">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35 }}
              >
                <div className="mb-6 flex items-center gap-2">
                  {QUIZ.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i <= step ? "bg-gold" : "bg-cream/20"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs uppercase tracking-[0.3em] text-amber">
                  Question {step + 1} / {total}
                </p>
                <h3 className="mt-2 font-groovy text-2xl">{current.prompt}</h3>
                <div className="mt-6 space-y-3">
                  {current.options.map((opt) => (
                    <motion.button
                      key={opt.value}
                      whileHover={{ x: 6 }}
                      onClick={() => choose(opt.value)}
                      className="flex w-full items-center justify-between rounded-2xl border border-cream/15 bg-cream/5 px-5 py-3.5 text-left font-medium transition-colors hover:border-gold hover:bg-gold/10"
                    >
                      {opt.label}
                      <span className="text-gold">→</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="text-center"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-amber">
                  Your match
                </p>
                <motion.div
                  initial={{ rotate: -20, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 180, damping: 12 }}
                  className="mx-auto mt-4 grid h-28 w-28 place-items-center rounded-full"
                  style={{
                    background: `radial-gradient(circle, var(--color-espresso) 0 18%, ${result.hue} 18% 100%)`,
                  }}
                >
                  <span className="h-3 w-3 rounded-full bg-cream" />
                </motion.div>
                <h3 className="mt-5 font-groovy text-3xl text-gold">
                  {result.name}
                </h3>
                <p className="mt-2 text-cream/80">{result.blurb}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-cream/50">
                  {result.notes}
                </p>
                {(() => {
                  const order = findItemOrder(result.name, items);
                  return (
                    <a
                      href={order.orderUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() =>
                        track("order_click", {
                          clickSource: "quiz",
                          menuItemName: order.name,
                          destination: order.orderUrl,
                        })
                      }
                      className="mt-6 inline-block rounded-full bg-gold px-7 py-3 font-semibold text-espresso shadow-lg shadow-black/25 transition-all hover:-translate-y-0.5 hover:bg-amber"
                    >
                      Order {result.name} →
                    </a>
                  );
                })()}
                <div>
                  <button
                    onClick={reset}
                    className="mt-3 rounded-full border border-cream/30 px-6 py-2.5 text-sm font-semibold transition-colors hover:border-gold hover:text-gold"
                  >
                    Try again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
