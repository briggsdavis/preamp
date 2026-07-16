import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

import { useTrack } from "@/lib/analytics";
import { imageUrl, useGlobalContent, useHomeContent } from "@/lib/siteContent";
import {
  EditableImage,
  EditableLink,
  EditableText,
  useInlineEditingMode,
} from "@/components/cms/InlineEditing";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const track = useTrack();
  const content = useHomeContent().hero;
  const global = useGlobalContent();
  const editing = useInlineEditingMode();
  const orderUrl = content.orderButton.href || global.orderUrl;
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Layered parallax: background drifts slowly, content lifts, stripes shift.
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden"
    >
      {/* Photographic ambience, slow parallax */}
      <motion.div
        style={editing ? undefined : { y: bgY }}
        className={`absolute inset-0 scale-110 ${editing ? "z-0" : "-z-20"}`}
      >
        <EditableImage path="hero.background" value={content.background} ratio="16:9" className="h-full w-full">
          <img
            src={imageUrl(content.background)}
            alt={content.background.alt}
            decoding="async"
            className="h-full w-full object-cover"
          />
        </EditableImage>
        <div className="absolute inset-0 bg-gradient-to-br from-espresso/80 via-maroon/55 to-espresso/85" />
        <div className="absolute inset-0 bg-gradient-to-t from-cream via-transparent to-transparent" />
      </motion.div>

      <motion.div
        style={editing ? undefined : { y: contentY, opacity: fade }}
        className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-6 pt-28 text-center md:px-8"
      >
        {/* LCP element - render immediately, no entrance animation. Explicit
            dimensions reserve the aspect ratio so it never shifts layout. */}
        <EditableImage path="hero.logo" value={content.logo} ratio="16:10" className="w-full max-w-2xl">
          <img
            src={imageUrl(content.logo)}
            alt={content.logo.alt || global.businessName}
            width={1400}
            height={881}
            fetchPriority="high"
            decoding="async"
            className="h-auto w-full drop-shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
          />
        </EditableImage>

        <h1 className="mt-6 max-w-2xl font-groovy text-lg uppercase tracking-[0.18em] text-cream/90 md:text-xl">
          <EditableText path="hero.tagline" value={content.tagline} />
        </h1>

        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <EditableLink path="hero.orderButton" value={content.orderButton}>
            <a
              href={orderUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                track("order_click", {
                  clickSource: "hero",
                  destination: orderUrl,
                })
              }
              className="rounded-full bg-terracotta px-7 py-3 font-semibold text-cream shadow-lg shadow-maroon/30 transition-all hover:-translate-y-1 hover:bg-brick"
            >
              {content.orderButton.label}
            </a>
          </EditableLink>
        </div>
      </motion.div>
    </section>
  );
}
