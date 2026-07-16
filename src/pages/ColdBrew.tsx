import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

import { PageWrapper } from "@/components/site/PageWrapper";
import { SquiggleLine } from "@/components/site/SquiggleLine";
import { RippleStripes } from "@/components/site/RippleStripes";
import {
  EditableImage,
  EditableIcon,
  EditableLink,
  EditableText,
  useInlineEditingMode,
} from "@/components/cms/InlineEditing";
import { COLD_BREW_ICON_OPTIONS } from "@/components/site/ContentIcon";
import { useSeo } from "@/lib/seo";
import {
  fillTemplate,
  imageUrl,
  useCmsContent,
  useGlobalContent,
} from "@/lib/siteContent";

/**
 * Cold Brew landing page - a pre-launch home for our Kyoto-style cold brew.
 * The hero + story are live now; the catering / delivery / retail blocks are
 * "coming soon" placeholders wired to flip on for the upcoming cold brew launch.
 */

/** A pre-launch feature card: title, blurb, and a "coming soon" ribbon. */
function ComingSoonCard({
  index,
  icon,
  badge,
  title,
  blurb,
}: {
  index: number;
  icon: string;
  badge: string;
  title: string;
  blurb: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="group relative overflow-hidden rounded-3xl border border-cream/10 bg-espresso-soft/60 p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:border-gold/40 hover:bg-espresso-soft"
    >
      <span className="absolute right-4 top-4 rounded-full bg-gold/20 px-3 py-1 font-groovy text-[0.65rem] uppercase tracking-[0.15em] text-gold">
        <EditableText path={`launch.cards.${index}.badge`} value={badge} />
      </span>
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-gold transition-transform duration-300 group-hover:scale-110 group-hover:bg-gold/25">
        <EditableIcon
          path={`launch.cards.${index}.icon`}
          value={icon}
          options={COLD_BREW_ICON_OPTIONS}
          className="h-8 w-8"
        />
      </span>
      <h3 className="mt-5 font-display text-2xl text-cream">
        <EditableText path={`launch.cards.${index}.title`} value={title} />
      </h3>
      <p className="mt-3 text-cream/75">
        <EditableText path={`launch.cards.${index}.body`} value={blurb} />
      </p>
    </motion.div>
  );
}

export function ColdBrew() {
  const content = useCmsContent("cold-brew");
  const global = useGlobalContent();
  const editing = useInlineEditingMode();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  useSeo({
    title: `${content.hero.title} · ${global.businessName} ${global.tagline}`,
    description: content.hero.body,
    canonicalPath: "/cold-brew",
    image: imageUrl(content.hero.image),
  });

  return (
    <PageWrapper>
      {/* Hero banner */}
      <section
        ref={heroRef}
        className="relative isolate flex min-h-[78vh] items-center justify-center overflow-hidden"
      >
        <motion.div
          style={editing ? undefined : { y: bgY }}
          className={`absolute inset-0 scale-110 ${editing ? "z-0" : "-z-10"}`}
        >
          <EditableImage path="hero.image" value={content.hero.image} ratio="16:9" className="h-full w-full">
            <img src={imageUrl(content.hero.image)} alt={content.hero.image.alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
          </EditableImage>
          <div className="absolute inset-0 bg-gradient-to-b from-espresso/75 via-maroon/55 to-espresso/85" />
        </motion.div>

        <motion.div
          style={editing ? undefined : { opacity: fade }}
          className="relative z-10 mx-auto max-w-3xl px-6 pt-28 text-center"
        >
          <p className="font-groovy text-sm uppercase tracking-[0.4em] text-cream/80">
            <EditableText path="hero.kicker" value={content.hero.kicker} />
          </p>
          <h1 className="mt-4 font-display text-6xl text-cream drop-shadow-[0_4px_24px_rgba(0,0,0,0.4)] md:text-8xl">
            <EditableText path="hero.title" value={content.hero.title} />
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-cream/90">
            <EditableText path="hero.body" value={content.hero.body} />
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <EditableLink path="hero.primary" value={content.hero.primary}>
              <a href={content.hero.primary.href || global.orderUrl} target="_blank" rel="noreferrer" className="rounded-full bg-gold px-7 py-3 font-semibold text-espresso shadow-lg shadow-black/20 transition-all hover:-translate-y-1 hover:bg-amber">{content.hero.primary.label}</a>
            </EditableLink>
            <EditableLink path="hero.secondary" value={content.hero.secondary}>
              <a href={content.hero.secondary.href} className="rounded-full border-2 border-cream/70 px-7 py-3 font-semibold text-cream transition-all hover:-translate-y-1 hover:border-cream hover:bg-cream/10">{content.hero.secondary.label}</a>
            </EditableLink>
          </div>
        </motion.div>

        <div className="absolute inset-x-0 bottom-0 h-24 opacity-30">
          <RippleStripes count={120} fade="none" variant="wave" gap={3} />
        </div>
      </section>

      {/* The story of the drip */}
      <section className="relative overflow-hidden bg-cream-deep py-24 md:py-32">
        <SquiggleLine side="right" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 md:grid-cols-2 md:gap-16 md:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="group relative overflow-hidden rounded-3xl shadow-2xl shadow-maroon/20"
          >
            <EditableImage path="method.image" value={content.method.image} ratio="4:5" className="h-[300px] w-full md:h-[460px]">
              <img src={imageUrl(content.method.image)} alt={content.method.image.alt} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110" />
            </EditableImage>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-groovy text-sm uppercase tracking-[0.35em] text-terracotta">
              <EditableText path="method.kicker" value={content.method.kicker} />
            </p>
            <div className="mt-5 space-y-4 text-lg text-espresso/80">
              {content.method.paragraphs.map((paragraph, index) => (
                <p key={index}>
                  <EditableText path={`method.paragraphs.${index}`} value={paragraph} />
                </p>
              ))}
            </div>
            <EditableLink path="method.button" value={content.method.button}>
              <a href={content.method.button.href || global.orderUrl} target="_blank" rel="noreferrer" className="mt-7 inline-block rounded-full bg-terracotta px-7 py-3 font-semibold text-cream shadow-lg shadow-maroon/20 transition-all hover:-translate-y-1 hover:bg-brick">{content.method.button.label}</a>
            </EditableLink>
          </motion.div>
        </div>
      </section>

      {/* What's coming - pre-launch placeholders */}
      <section
        id="whats-coming"
        className="relative scroll-mt-24 overflow-hidden bg-espresso py-24 md:py-32"
      >
        <div className="absolute inset-0 opacity-20">
          <RippleStripes count={26} fade="none" drift="left" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 md:px-8">
          <div className="text-center">
            <p className="font-groovy text-sm uppercase tracking-[0.35em] text-gold">
              <EditableText path="launch.kicker" value={content.launch.kicker} />
            </p>
            <h2 className="mt-3 font-display text-4xl text-cream md:text-5xl">
              <EditableText path="launch.title" value={content.launch.title} />
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-cream/75">
              <EditableText path="launch.body" value={content.launch.body} />
            </p>
          </div>
          <div className="mt-14 grid gap-7 md:grid-cols-3">
            {content.launch.cards.map((card, index) => (
              <ComingSoonCard
                key={index}
                index={index}
                icon={card.icon}
                badge={card.badge}
                title={card.title}
                blurb={card.body}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Where can you get it? */}
      <section className="relative overflow-hidden bg-cream py-24 md:py-32">
        <div className="relative mx-auto max-w-3xl px-6 text-center md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-groovy text-sm uppercase tracking-[0.35em] text-terracotta">
              <EditableText path="availability.kicker" value={content.availability.kicker} />
            </p>
            <h2 className="mt-3 font-display text-4xl text-espresso md:text-5xl">
              <EditableText path="availability.title" value={content.availability.title} />
            </h2>
            <p className="mt-5 text-lg text-espresso/80">
              <EditableText path="availability.body" value={fillTemplate(content.availability.body, global)} />
            </p>
          </motion.div>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <EditableLink path="availability.orderButton" value={content.availability.orderButton}>
              <a href={content.availability.orderButton.href || global.orderUrl} target="_blank" rel="noreferrer" className="rounded-full bg-terracotta px-7 py-3 font-semibold text-cream shadow-lg shadow-maroon/20 transition-all hover:-translate-y-1 hover:bg-brick">{content.availability.orderButton.label}</a>
            </EditableLink>
            <EditableLink path="availability.directionsButton" value={content.availability.directionsButton}>
              <a href={content.availability.directionsButton.href || global.mapsLink} target="_blank" rel="noreferrer" className="rounded-full border-2 border-espresso/30 px-7 py-3 font-semibold text-espresso transition-all hover:-translate-y-1 hover:border-espresso hover:bg-espresso/5">{content.availability.directionsButton.label}</a>
            </EditableLink>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
