import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

import { PageWrapper } from "@/components/site/PageWrapper";
import { RippleStripes } from "@/components/site/RippleStripes";
import { ZigzagConnectorLine } from "@/components/site/SquiggleLine";
import {
  EditableImage,
  EditableLink,
  EditableText,
  useInlineEditingMode,
} from "@/components/cms/InlineEditing";
import {
  imageUrl,
  useCmsContent,
} from "@/lib/siteContent";
export function About() {
  const content = useCmsContent("about");
  const editing = useInlineEditingMode();
  const heroRef = useRef<HTMLDivElement>(null);
  const coffeeCardRef = useRef<HTMLElement>(null);
  const drinksCardRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <PageWrapper>
      {/* Hero banner */}
      <section
        ref={heroRef}
        className="relative isolate flex min-h-[82vh] items-center justify-center overflow-hidden"
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
          className="relative z-10 mx-auto max-w-3xl px-6 text-center"
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
        </motion.div>

        {/* waveform shimmer along the bottom of the hero */}
        <div className="absolute inset-x-0 bottom-0 h-24 opacity-30">
          <RippleStripes count={120} fade="none" variant="wave" gap={3} />
        </div>
      </section>

      {/* Meet the owner - Danny Ryan */}
      <section className="relative overflow-hidden bg-cream py-24 md:py-32">
        <div className="relative mx-auto max-w-5xl px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="grid items-center gap-10 md:grid-cols-[auto_1fr] md:gap-14"
          >
            {/* Left: circular portrait with name + title */}
            <div className="flex flex-col items-center text-center">
              <div className="relative h-[19.5rem] w-[19.5rem] overflow-hidden rounded-full border-4 border-gold/60 shadow-2xl shadow-maroon/25 md:h-[22.5rem] md:w-[22.5rem]">
                <EditableImage path="owner.image" value={content.owner.image} ratio="1:1" className="h-full w-full">
                  <img src={imageUrl(content.owner.image)} alt={content.owner.image.alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                </EditableImage>
              </div>
              <h3 className="mt-6 font-display text-3xl text-espresso">
                <EditableText path="owner.name" value={content.owner.name} />
              </h3>
              <p className="mt-1 font-groovy text-sm uppercase tracking-[0.25em] text-terracotta">
                <EditableText path="owner.role" value={content.owner.role} />
              </p>
            </div>

            {/* Right: introduction */}
            <div>
              <p className="font-groovy text-sm uppercase tracking-[0.35em] text-terracotta">
                <EditableText path="owner.kicker" value={content.owner.kicker} />
              </p>
              <h2 className="mt-3 font-display text-3xl leading-tight text-espresso md:text-4xl">
                <EditableText path="owner.title" value={content.owner.title} />
              </h2>
              <div className="mt-5 space-y-4 text-base text-espresso/80">
                {content.owner.paragraphs.map((paragraph, index) => (
                  <p key={index}>
                    <EditableText path={`owner.paragraphs.${index}`} value={paragraph} />
                  </p>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Four things - connected image zigzag */}
      <section className="relative overflow-hidden bg-cream-deep py-24 md:py-32">
        <div className="relative mx-auto max-w-7xl px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <p className="font-groovy text-sm uppercase tracking-[0.35em] text-terracotta">
              <EditableText path="feature.kicker" value={content.feature.kicker} />
            </p>
            <h2 className="mt-3 font-display text-4xl text-espresso md:text-6xl">
              <EditableText path="feature.title" value={content.feature.title} />
            </h2>
          </motion.div>

          <div className="relative mt-12 aspect-[5/2] w-full md:mt-16">
            <ZigzagConnectorLine
              startTarget={coffeeCardRef}
              endTarget={drinksCardRef}
            />
            {content.feature.images.slice(0, 4).map((image, index) => {
              const labels = ["Coffee", "Food", "Vinyl", "Drinks"];
              const left = ["left-0", "left-[25.5%]", "left-[51%]", "left-[76.5%]"];
              const top = index % 2 === 0 ? "top-[42%]" : "top-[2%]";
              return (
                <motion.figure
                  ref={
                    index === 0
                      ? coffeeCardRef
                      : index === 3
                        ? drinksCardRef
                        : undefined
                  }
                  key={`${imageUrl(image)}-${index}`}
                  initial={{ opacity: 0, y: index % 2 === 0 ? 24 : -24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.65, delay: index * 0.1 }}
                  className={`absolute z-10 aspect-square w-[23.5%] overflow-hidden rounded-xl border-2 border-cream bg-espresso shadow-xl shadow-maroon/20 md:rounded-2xl ${left[index]} ${top}`}
                >
                  <EditableImage
                    path={`feature.images.${index}`}
                    value={image}
                    ratio="1:1"
                    className="h-full w-full"
                  >
                    <img
                      src={imageUrl(image)}
                      alt={image.alt}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </EditableImage>
                  <figcaption className="absolute inset-x-0 bottom-0 bg-espresso/80 px-1 py-1 text-center font-groovy text-[0.55rem] uppercase text-cream backdrop-blur-sm sm:text-xs md:px-3 md:py-2 md:text-sm">
                    {labels[index]}
                  </figcaption>
                </motion.figure>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7 }}
            className="mx-auto mt-16 max-w-5xl overflow-hidden rounded-[1.75rem] border border-espresso/10 shadow-2xl shadow-maroon/20 md:mt-24"
          >
            <EditableImage
              path="feature.image"
              value={content.feature.image}
              ratio="16:9"
              className="w-full"
            >
              <img
                src={imageUrl(content.feature.image)}
                alt={content.feature.image.alt}
                loading="lazy"
                decoding="async"
                className="h-auto w-full object-cover"
              />
            </EditableImage>
          </motion.div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative overflow-hidden bg-terracotta py-24 text-center">
        <div className="absolute inset-0 opacity-25">
          <RippleStripes count={26} fade="none" drift="right" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative mx-auto max-w-2xl px-6"
        >
          <h2 className="font-display text-5xl text-cream md:text-6xl">
            <EditableText path="closing.title" value={content.closing.title} />
          </h2>
          <p className="mt-4 text-lg text-cream/90">
            <EditableText path="closing.body" value={content.closing.body} />
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <EditableLink path="closing.primary" value={content.closing.primary}>
              <Link to={content.closing.primary.href} className="rounded-full bg-cream px-7 py-3 font-semibold text-terracotta shadow-lg transition-all hover:-translate-y-1 hover:bg-gold hover:text-espresso">{content.closing.primary.label}</Link>
            </EditableLink>
            <EditableLink path="closing.vinyl" value={content.closing.vinyl}>
              <Link to={content.closing.vinyl.href} className="rounded-full bg-gold px-7 py-3 font-semibold text-espresso shadow-lg transition-all hover:-translate-y-1 hover:bg-amber">{content.closing.vinyl.label}</Link>
            </EditableLink>
            <EditableLink path="closing.secondary" value={content.closing.secondary}>
              <Link to={content.closing.secondary.href} className="rounded-full border-2 border-cream/70 px-7 py-3 font-semibold text-cream transition-all hover:-translate-y-1 hover:border-cream hover:bg-cream/10">{content.closing.secondary.label}</Link>
            </EditableLink>
          </div>
        </motion.div>
      </section>
    </PageWrapper>
  );
}
