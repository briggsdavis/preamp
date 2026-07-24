import { motion, useScroll, useTransform } from "motion/react"
import { useRef } from "react"
import { Link } from "react-router"
import {
  EditableImage,
  EditableLink,
  EditableText,
  useInlineEditingMode,
} from "@/components/cms/inline-editing"
import { PageWrapper } from "@/components/site/page-wrapper"
import { RippleStripes } from "@/components/site/ripple-stripes"
import { imageUrl, useCmsContent } from "@/lib/site-content"
export function About() {
  const content = useCmsContent("about")
  const editing = useInlineEditingMode()
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"])
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0])

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
          <EditableImage
            path="hero.image"
            value={content.hero.image}
            ratio="16:9"
            className="h-full w-full"
          >
            <img
              src={imageUrl(content.hero.image)}
              alt={content.hero.image.alt}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </EditableImage>
          <div className="absolute inset-0 bg-gradient-to-b from-espresso/75 via-maroon/55 to-espresso/85" />
        </motion.div>

        <motion.div
          style={editing ? undefined : { opacity: fade }}
          className="relative z-10 mx-auto max-w-3xl px-6 text-center"
        >
          <p className="font-groovy text-sm tracking-[0.4em] text-cream/80 uppercase">
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
                <EditableImage
                  path="owner.image"
                  value={content.owner.image}
                  ratio="1:1"
                  className="h-full w-full"
                >
                  <img
                    src={imageUrl(content.owner.image)}
                    alt={content.owner.image.alt}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </EditableImage>
              </div>
              <h3 className="mt-6 font-display text-3xl text-espresso">
                <EditableText path="owner.name" value={content.owner.name} />
              </h3>
              <p className="mt-1 font-groovy text-sm tracking-[0.25em] text-terracotta uppercase">
                <EditableText path="owner.role" value={content.owner.role} />
              </p>
            </div>

            {/* Right: introduction */}
            <div>
              <p className="font-groovy text-sm tracking-[0.35em] text-terracotta uppercase">
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

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="mt-14 aspect-[3/2] overflow-hidden rounded-lg shadow-2xl shadow-maroon/20 md:mt-18 md:aspect-[5/2]"
          >
            <EditableImage
              path="owner.teamImage"
              value={content.owner.teamImage}
              ratio="3:2"
              className="h-full w-full"
            >
              <img
                src={imageUrl(content.owner.teamImage)}
                alt={content.owner.teamImage.alt}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </EditableImage>
          </motion.div>
        </div>
      </section>

      {/* Four things - masonry image grid */}
      <section className="relative overflow-hidden bg-cream-deep py-24 md:py-32">
        <div className="relative mx-auto max-w-7xl px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <p className="font-groovy text-sm tracking-[0.35em] text-terracotta uppercase">
              <EditableText path="feature.kicker" value={content.feature.kicker} />
            </p>
            <h2 className="mt-3 font-display text-4xl text-espresso md:text-6xl">
              <EditableText path="feature.title" value={content.feature.title} />
            </h2>
          </motion.div>

          <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 md:mt-16 md:grid-cols-12 md:grid-rows-[18rem_18rem]">
            {content.feature.images.slice(0, 4).map((image, index) => {
              const layout = [
                "col-span-2 h-72 md:col-span-7 md:row-span-1 md:h-full",
                "col-span-1 h-64 md:col-span-5 md:row-span-1 md:h-full",
                "col-span-1 h-64 md:col-span-5 md:row-span-1 md:h-full",
                "col-span-2 h-72 md:col-span-7 md:row-span-1 md:h-full",
              ]
              return (
                <motion.figure
                  key={`${imageUrl(image)}-${index}`}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{
                    duration: 0.75,
                    delay: index * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={`group relative overflow-hidden rounded-lg bg-espresso shadow-xl shadow-maroon/20 ${layout[index]}`}
                >
                  <EditableImage
                    path={`feature.images.${index}`}
                    value={image}
                    ratio={index === 0 || index === 3 ? "16:9" : "4:5"}
                    className="h-full w-full"
                  >
                    <img
                      src={imageUrl(image)}
                      alt={image.alt}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </EditableImage>
                  <figcaption className="absolute inset-x-0 bottom-0 bg-espresso/82 px-3 py-3 text-center font-groovy text-xs text-cream uppercase backdrop-blur-sm sm:text-sm md:px-4 md:py-4">
                    <EditableText
                      path={`feature.labels.${index}`}
                      value={content.feature.labels[index]}
                    />
                  </figcaption>
                </motion.figure>
              )
            })}
          </div>
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
              <Link
                to={content.closing.primary.href}
                className="rounded-full bg-cream px-7 py-3 font-semibold text-terracotta shadow-lg transition-all hover:-translate-y-1 hover:bg-gold hover:text-espresso"
              >
                {content.closing.primary.label}
              </Link>
            </EditableLink>
            <EditableLink path="closing.vinyl" value={content.closing.vinyl}>
              <Link
                to={content.closing.vinyl.href}
                className="rounded-full bg-gold px-7 py-3 font-semibold text-espresso shadow-lg transition-all hover:-translate-y-1 hover:bg-amber"
              >
                {content.closing.vinyl.label}
              </Link>
            </EditableLink>
            <EditableLink path="closing.secondary" value={content.closing.secondary}>
              <Link
                to={content.closing.secondary.href}
                className="rounded-full border-2 border-cream/70 px-7 py-3 font-semibold text-cream transition-all hover:-translate-y-1 hover:border-cream hover:bg-cream/10"
              >
                {content.closing.secondary.label}
              </Link>
            </EditableLink>
          </div>
        </motion.div>
      </section>
    </PageWrapper>
  )
}
