import { motion } from "framer-motion";

const FEATURES = [
  {
    title: "Records, All Day",
    body: "A wall of album art and a turntable that never stops. Pull up a stool and let the playlist carry the afternoon.",
    icon: "♪",
  },
  {
    title: "Passenger Beans",
    body: "We pull and pour Passenger Coffee out of Lancaster — dialed daily on the EK43 for espresso and filter.",
    icon: "☕",
  },
  {
    title: "Warm & Golden",
    body: "Vintage lighting, gold tones, and a rotating focaccia kitchen. Cozy enough to stay, lively enough to linger.",
    icon: "✺",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
} as const;
const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
} as const;

export function Intro() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-24 md:px-8 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-3xl text-center"
      >
        <p className="font-groovy text-sm uppercase tracking-[0.35em] text-terracotta">
          Welcome in
        </p>
        <h2 className="mt-4 font-groovy text-4xl leading-tight text-espresso md:text-5xl">
          A little corner of Squirrel Hill that sounds as good as it tastes.
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-espresso/75">
          Pre Amp is part coffee studio, part listening bar. We obsess over the
          cup — single-origin pourovers, signature espresso drinks, slow-dripped
          cold brew — and we pair every one with the warm crackle of vinyl. Come
          for the coffee, stay for the record that's spinning.
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="mt-16 grid gap-6 md:grid-cols-3"
      >
        {FEATURES.map((f) => (
          <motion.div
            key={f.title}
            variants={item}
            whileHover={{ y: -8, rotate: -0.5 }}
            transition={{ type: "spring", stiffness: 250, damping: 18 }}
            className="rounded-3xl border border-espresso/10 bg-cream-deep/60 p-8 shadow-sm transition-shadow hover:shadow-xl hover:shadow-maroon/10"
          >
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gold/20 text-2xl text-terracotta">
              {f.icon}
            </span>
            <h3 className="mt-5 font-groovy text-2xl text-espresso">{f.title}</h3>
            <p className="mt-3 leading-relaxed text-espresso/70">{f.body}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
