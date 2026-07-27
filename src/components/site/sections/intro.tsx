import { motion } from "motion/react"
import { EditableImage, EditableText } from "@/components/cms/inline-editing"
import { SquiggleLine } from "@/components/site/squiggle-line"
import { imageUrl, useHomeContent } from "@/lib/site-content"

export function Intro({ showLine = true }: { showLine?: boolean }) {
  const content = useHomeContent().intro
  return (
    <section className="relative overflow-hidden px-6 py-24 md:py-32">
      {showLine && <SquiggleLine side="left" />}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -18% 0px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-20 mx-auto max-w-3xl text-center"
      >
        <p className="font-groovy text-sm tracking-[0.35em] text-terracotta uppercase">
          <EditableText path="intro.kicker" value={content.kicker} />
        </p>
        <h2 className="mt-4 font-groovy text-4xl leading-tight text-espresso md:text-5xl">
          <EditableText path="intro.title" value={content.title} />
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-espresso/75">
          <EditableText path="intro.body" value={content.body} />
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {content.images.map((item, index) => (
            <EditableImage
              key={index}
              path={`intro.images.${index}`}
              value={item}
              ratio="4:3"
              className="h-56 w-full sm:h-[17.5rem]"
            >
              <img
                src={imageUrl(item)}
                alt={item.alt}
                loading="lazy"
                decoding="async"
                className="h-full w-full rounded-2xl object-cover shadow-lg ring-1 shadow-maroon/15 ring-espresso/10"
              />
            </EditableImage>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
