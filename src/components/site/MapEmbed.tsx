import { useState } from "react";

interface MapEmbedProps {
  /** Google Maps embed URL (loaded only after the user opts in). */
  src: string;
  /** Accessible iframe title. */
  title: string;
  className?: string;
}

/**
 * Click-to-load Google Maps facade.
 *
 * The live Maps embed pulls in ~300KB of third-party JavaScript and runs
 * several long main-thread tasks — a heavy cost for a map most visitors never
 * interact with. So we render a cheap, on-brand placeholder first and only
 * mount the real <iframe> once the visitor asks to see it. No third-party code
 * touches the page (or the Lighthouse trace) until then.
 */
export function MapEmbed({ src, title, className }: MapEmbedProps) {
  const [show, setShow] = useState(false);

  if (show) {
    return (
      <iframe
        title={title}
        src={src}
        className={className}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShow(true)}
      aria-label={`Load map: ${title}`}
      className={`group relative grid place-items-center bg-espresso/90 text-cream transition-colors hover:bg-espresso ${className ?? ""}`}
    >
      {/* Subtle map-grid texture so the placeholder reads as a map, cheaply. */}
      <span
        aria-hidden
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,239,224,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(245,239,224,0.4) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
      <span className="relative flex flex-col items-center gap-3 px-6 text-center">
        <span className="text-4xl">📍</span>
        <span className="rounded-full bg-gold px-6 py-2.5 font-semibold text-espresso shadow-lg transition-transform group-hover:-translate-y-0.5">
          View map
        </span>
      </span>
    </button>
  );
}
