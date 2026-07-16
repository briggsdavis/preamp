import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  EditableImage,
  EditableText,
  useInlineEditingMode,
} from "@/components/cms/InlineEditing";
import type { CmsImage } from "@/lib/siteContent";

interface ParallaxBannerProps {
  image: string;
  imageAlt?: string;
  kicker?: string;
  heading: string;
  sub?: string;
  cmsImage?: CmsImage;
  cmsPaths?: { image: string; kicker: string; heading: string; sub: string };
}

/** Full-bleed image band whose photo drifts against the scroll for depth. */
export function ParallaxBanner({
  image,
  imageAlt = "",
  kicker,
  heading,
  sub,
  cmsImage,
  cmsPaths,
}: ParallaxBannerProps) {
  const editing = useInlineEditingMode();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["20%", "-20%"]);

  return (
    <section
      ref={ref}
      className="relative flex h-[70vh] items-center justify-center overflow-hidden"
    >
      <motion.div
        style={editing ? undefined : { y }}
        className={`absolute inset-0 scale-125 ${editing ? "z-0" : "-z-10"}`}
      >
        {cmsPaths && cmsImage ? (
          <EditableImage path={cmsPaths.image} value={cmsImage} ratio="16:9" className="h-full w-full">
            <img src={image} alt={imageAlt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
          </EditableImage>
        ) : (
          <img src={image} alt={imageAlt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-espresso/55" />
      </motion.div>

      <motion.div
        style={editing ? undefined : { y: textY }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "0px 0px -18% 0px" }}
        transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto max-w-4xl px-6 text-center"
      >
        {kicker && (
          <p className="font-groovy text-sm uppercase tracking-[0.4em] text-amber">
            {cmsPaths ? <EditableText path={cmsPaths.kicker} value={kicker} /> : kicker}
          </p>
        )}
        <h2 className="mt-4 font-display text-5xl leading-tight text-cream md:text-7xl">
          {cmsPaths ? <EditableText path={cmsPaths.heading} value={heading} /> : heading}
        </h2>
        {sub && (
          <p className="mx-auto mt-5 max-w-2xl text-lg text-cream/85">
            {cmsPaths ? <EditableText path={cmsPaths.sub} value={sub} /> : sub}
          </p>
        )}
      </motion.div>
    </section>
  );
}
