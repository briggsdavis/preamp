import {
  useEffect,
  useMemo,
  useState,
  type ElementType,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";
import { btn, field, label as fieldLabel } from "@/admin/ui";

/**
 * About page editor - a UI-only, WYSIWYG stand-in for a flat field list.
 *
 * It renders a static replica of the public About page (same layout, colors,
 * type, and images, minus the scroll/entrance animations so text stays
 * readable and clickable) and lets an admin click any piece of copy, image, or
 * CTA and edit it in place. A sticky side panel tracks unsaved changes.
 *
 * Nothing here is wired to Convex yet: edits live in local React state and
 * "Save" just snapshots them (and logs the payload a real save would send).
 */

// --- Content model ----------------------------------------------------------

type CTA = { label: string; to: string };
type ImageRef = { src: string; alt: string };

type AboutContent = {
  hero: { image: string; kicker: string; title: string; subtitle: string };
  aboutUs: { kicker: string; title: string; intro: string };
  philosophy: {
    kicker: string;
    title: string;
    values: { title: string; body: string }[];
  };
  origin: {
    kicker: string;
    title: string;
    image: ImageRef;
    paragraphs: string[];
  };
  coffee: {
    kicker: string;
    title: string;
    image: ImageRef;
    paragraphs: string[];
    cta: CTA;
  };
  kitchen: {
    kicker: string;
    title: string;
    image: ImageRef;
    paragraphs: string[];
    cta: CTA;
  };
  sound: {
    kicker: string;
    title: string;
    paragraphs: string[];
    cta: CTA;
    images: ImageRef[];
  };
  closing: { title: string; body: string; buttons: CTA[] };
};

const ABOUT_INTRO =
  "At Pre Amp, every sip hits the perfect note. Our space hums with the warmth " +
  "of vinyl spinning and the aroma of beans roasted to perfection, welcoming " +
  "every kind of coffee lover. Step up to our bar and watch our baristas, true " +
  "coffee mixologists, meticulously craft your drink. Each espresso shot is " +
  "treated like a fine spirit, blended with house-made syrups, unique infusions, " +
  "and balanced with the precision of a master bartender. From bold and complex " +
  "to smooth and sweet, every cup is a handcrafted liquid experience designed to " +
  "awaken your senses.";

const DEFAULT_CONTENT: AboutContent = {
  hero: {
    image: "/images/artworkheadon.webp",
    kicker: "Pre Amp Coffee Studio · Pittsburgh",
    title: "Our Story",
    subtitle:
      "Every sip hits the perfect note. A coffee studio and vinyl listening bar in the heart of Squirrel Hill.",
  },
  aboutUs: {
    kicker: "About Us",
    title: "Every Sip Hits the Note",
    intro: ABOUT_INTRO,
  },
  philosophy: {
    kicker: "Our Philosophy",
    title: "What We Pour Into It",
    values: [
      {
        title: "Precision",
        body: "Every espresso shot is treated like a fine spirit, with house-made syrups, unique infusions, balanced like a master bartender would.",
      },
      {
        title: "Warmth",
        body: "Our space hums with the aroma of beans roasted to perfection, welcoming every kind of coffee lover up to the bar.",
      },
      {
        title: "Rhythm",
        body: "Vinyl spinning all day. Brews and beats, woven together so every visit hits the perfect note.",
      },
    ],
  },
  origin: {
    kicker: "Our Origin",
    title: "Meet Danny Ryan",
    image: {
      src: "/images/menu-coffeepouring.webp",
      alt: "Pouring espresso at the Pre Amp bar",
    },
    paragraphs: [
      "After a decade in restaurants, cafes, and a roastery in New York City, Danny packed up his family for a new chapter: opening a cafe in Pittsburgh in 2020. The pandemic had other plans, and in a twist of fate, things worked out better than he could have imagined.",
      "While seeking work, he met Tolga and Rick, who brought him on as coffee lead at Coup De Ville. Their trust grew into a partnership focused on creating the ultimate coffee experience in Pittsburgh, a dream he couldn't have achieved alone.",
      "His passion ignited in 2009 over a $6 cup brewed on a Clover machine at Cafe Grumpy in NYC, captivated by the complexity, rich flavors, and stories held within each bean.",
    ],
  },
  coffee: {
    kicker: "The Coffee",
    title: "Espresso, Treated Like a Spirit",
    image: {
      src: "/images/menu-coffeeshot.webp",
      alt: "A handcrafted espresso drink",
    },
    paragraphs: [
      "House-made syrups, unique infusions, and a bartender's balance go into every cup. Bold and complex or smooth and sweet, our baristas build each drink like a fine cocktail.",
      "From the signature Smokey Robinson to a bright Yuzu Espresso Tonic and the slow-dripped Kyoto Cold Brew, there's a note for every palate.",
    ],
    cta: { label: "Explore the Coffee →", to: "/menu/coffee" },
  },
  kitchen: {
    kicker: "The Kitchen",
    title: "Made to Pair With Your Cup",
    image: {
      src: "/images/menu-sandwich.webp",
      alt: "A focaccia sandwich from the kitchen",
    },
    paragraphs: [
      "Our kitchen turns out house focaccia sandwiches, fresh sides, and comfort plates, all built to sit alongside whatever you're sipping.",
      "Kitchen hours: Wed – Sat 11am – 6pm · Sun 11am – 4pm (closed Mon & Tue).",
    ],
    cta: { label: "See the Food →", to: "/menu/food" },
  },
  sound: {
    kicker: "The Sound",
    title: "Records Spinning, All Day",
    paragraphs: [
      "Pre Amp is as much a listening bar as it is a cafe. The needle drops the moment we open, and the warmth of vinyl carries through every pour.",
      "Crate-dig with us, catch a guest selector, or just let the playlist set the pace while your drink comes together at the bar. Brews and beats. That's the whole idea.",
    ],
    cta: { label: "See What's On →", to: "/events" },
    images: [
      { src: "/images/eventvinyls.webp", alt: "Vinyl records" },
      { src: "/images/eventspeakers.webp", alt: "Speakers in the studio" },
    ],
  },
  closing: {
    title: "Come Hang With Us",
    body: "5840 Forbes Ave, Squirrel Hill. Pull up a stool and tell us what's spinning.",
    buttons: [
      { label: "Get In Touch", to: "/contact" },
      { label: "See the Menu", to: "/menu/coffee" },
    ],
  },
};

/** A few on-brand images to pick from when swapping a picture. */
const IMAGE_PRESETS = [
  "/images/artworkheadon.webp",
  "/images/menu-coffeepouring.webp",
  "/images/menu-coffeeshot.webp",
  "/images/menu-coffee.webp",
  "/images/menu-sandwich.webp",
  "/images/eventvinyls.webp",
  "/images/eventspeakers.webp",
  "/images/preampdecor.webp",
  "/images/preampdecor2.webp",
  "/images/preampdecor3.webp",
];

// --- Inline editing primitives ----------------------------------------------

/**
 * An in-place editable text node. It IS the rendered element (contentEditable),
 * so the copy looks exactly like the site while you type. Uncontrolled while
 * focused (commits on blur) to avoid caret jumps; the parent bumps a remount
 * key on Discard to reset the DOM.
 */
function EditableText({
  value,
  onCommit,
  as: Tag = "span",
  className,
  singleLine,
}: {
  value: string;
  onCommit: (next: string) => void;
  as?: ElementType;
  className?: string;
  singleLine?: boolean;
}) {
  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      role="textbox"
      tabIndex={0}
      title="Click to edit"
      className={cn("ae-edit", className)}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const text = e.currentTarget.innerText.replace(/\n+$/, "");
        if (text !== value) onCommit(text);
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (singleLine && e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === "Escape") e.currentTarget.blur();
      }}
    >
      {value}
    </Tag>
  );
}

/** A small popover anchored under its trigger. */
function Popover({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 z-[60] cursor-default"
        onClick={onClose}
      />
      <div className="absolute left-1/2 top-full z-[61] mt-2 w-72 -translate-x-1/2 rounded-2xl border-2 border-sand bg-cream p-4 text-left text-espresso shadow-2xl">
        {children}
      </div>
    </>
  );
}

/** An editable image: hover to reveal a Replace overlay; edit src + alt. */
function EditableImage({
  value,
  onChange,
  className,
  imgClassName,
}: {
  value: ImageRef;
  onChange: (next: ImageRef) => void;
  className?: string;
  imgClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("ae-img relative", className)}>
      <img src={value.src} alt={value.alt} className={imgClassName} />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ae-img-ov absolute inset-0 flex items-center justify-center bg-espresso/45 text-sm font-semibold text-cream opacity-0 transition-opacity"
      >
        <span className="rounded-full bg-cream/90 px-4 py-1.5 text-espresso shadow">
          Replace image
        </span>
      </button>
      {open && (
        <Popover onClose={() => setOpen(false)}>
          <p className={fieldLabel}>Image path or URL</p>
          <input
            className={field}
            value={value.src}
            onChange={(e) => onChange({ ...value, src: e.target.value })}
            placeholder="/images/example.jpg"
          />
          <p className={cn(fieldLabel, "mt-3")}>Alt text</p>
          <input
            className={field}
            value={value.alt}
            onChange={(e) => onChange({ ...value, alt: e.target.value })}
            placeholder="Describe the image"
          />
          <p className={cn(fieldLabel, "mt-3")}>Or pick one</p>
          <div className="grid grid-cols-4 gap-2">
            {IMAGE_PRESETS.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => onChange({ ...value, src })}
                className={cn(
                  "aspect-square overflow-hidden rounded-lg border-2",
                  value.src === src ? "border-brick" : "border-sand",
                )}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          <button
            type="button"
            className={cn(btn.primary, "mt-4 w-full")}
            onClick={() => setOpen(false)}
          >
            Done
          </button>
        </Popover>
      )}
    </div>
  );
}

/** A CTA rendered exactly like the site button, with editable label + link. */
function EditableCTA({
  value,
  onChange,
  className,
}: {
  value: CTA;
  onChange: (next: CTA) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className={cn("relative inline-flex items-center", className)}>
      <EditableText
        as="span"
        singleLine
        value={value.label}
        onCommit={(label) => onChange({ ...value, label })}
      />
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Link: ${value.to}`}
        aria-label="Edit link destination"
        className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-espresso/15 text-xs text-espresso/70 transition-colors hover:bg-espresso/30"
      >
        🔗
      </button>
      {open && (
        <Popover onClose={() => setOpen(false)}>
          <p className={fieldLabel}>Button link (destination)</p>
          <input
            className={field}
            value={value.to}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            placeholder="/menu/coffee or https://…"
          />
          <p className="mt-2 text-xs text-espresso/55">
            Internal route (e.g. <code>/contact</code>) or a full URL.
          </p>
          <button
            type="button"
            className={cn(btn.primary, "mt-4 w-full")}
            onClick={() => setOpen(false)}
          >
            Done
          </button>
        </Popover>
      )}
    </span>
  );
}

// --- Reusable feature row (mirrors the site's FeatureSection) ---------------

function FeatureRow({
  kicker,
  title,
  image,
  dimensions,
  paragraphs,
  cta,
  reverse,
  dark,
  onKicker,
  onTitle,
  onImage,
  onParagraph,
  onCta,
}: {
  kicker: string;
  title: string;
  image: ImageRef;
  dimensions: string;
  paragraphs: string[];
  cta?: CTA;
  reverse?: boolean;
  dark?: boolean;
  onKicker: (v: string) => void;
  onTitle: (v: string) => void;
  onImage: (v: ImageRef) => void;
  onParagraph: (i: number, v: string) => void;
  onCta?: (v: CTA) => void;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        dark ? "bg-espresso text-cream" : "bg-cream text-espresso",
      )}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:gap-16 md:px-8">
        <div className={reverse ? "md:order-2" : ""}>
          <div className="overflow-hidden rounded-3xl shadow-2xl shadow-maroon/20">
            <EditableImage
              value={image}
              onChange={onImage}
              imgClassName="h-[260px] w-full object-cover md:h-[400px]"
            />
          </div>
          <p
            className={cn(
              "mt-2 text-center text-[11px] font-medium tracking-[0.08em]",
              dark ? "text-cream/55" : "text-espresso/50",
            )}
          >
            {dimensions}
          </p>
        </div>
        <div className={reverse ? "md:order-1" : ""}>
          <EditableText
            as="p"
            singleLine
            value={kicker}
            onCommit={onKicker}
            className={cn(
              "font-groovy text-sm uppercase tracking-[0.35em]",
              dark ? "text-gold" : "text-terracotta",
            )}
          />
          <EditableText
            as="h2"
            value={title}
            onCommit={onTitle}
            className="mt-3 font-display text-4xl leading-tight md:text-5xl"
          />
          <div
            className={cn(
              "mt-5 space-y-4 text-lg",
              dark ? "text-cream/85" : "text-espresso/80",
            )}
          >
            {paragraphs.map((p, i) => (
              <EditableText
                key={i}
                as="p"
                value={p}
                onCommit={(v) => onParagraph(i, v)}
              />
            ))}
          </div>
          {cta && onCta && (
            <EditableCTA
              value={cta}
              onChange={onCta}
              className={cn(
                "mt-7 rounded-full px-7 py-3 font-semibold shadow-lg",
                dark
                  ? "border-2 border-cream/60 text-cream"
                  : "bg-gold text-espresso shadow-maroon/20",
              )}
            />
          )}
        </div>
      </div>
    </section>
  );
}

// --- The editor -------------------------------------------------------------

export function AboutEditor() {
  const [content, setContent] = useState<AboutContent>(DEFAULT_CONTENT);
  const [saved, setSaved] = useState<AboutContent>(DEFAULT_CONTENT);
  const [rev, setRev] = useState(0); // bump to remount the replica on discard
  const [autoSave, setAutoSave] = useState(true);
  const [justSaved, setJustSaved] = useState(false);

  const dirty = useMemo(
    () => JSON.stringify(content) !== JSON.stringify(saved),
    [content, saved],
  );

  /** Immutable edit via a structural clone + mutator. */
  function edit(mutate: (draft: AboutContent) => void) {
    setContent((prev) => {
      const next = structuredClone(prev);
      mutate(next);
      return next;
    });
  }

  function commitSave() {
    setSaved(content);
    setJustSaved(true);
    // The payload a real (Convex-backed) save would persist.
    console.log("[AboutEditor] save payload:", content);
  }

  function discard() {
    setContent(saved);
    setRev((r) => r + 1);
  }

  // Optional auto-save: debounced snapshot while there are unsaved changes.
  useEffect(() => {
    if (!autoSave || !dirty) return;
    const t = setTimeout(() => {
      setSaved(content);
      setJustSaved(true);
      console.log("[AboutEditor] auto-save payload:", content);
    }, 900);
    return () => clearTimeout(t);
  }, [autoSave, dirty, content]);

  // Clear the "saved" flash shortly after it shows.
  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 1800);
    return () => clearTimeout(t);
  }, [justSaved]);

  const c = content;

  return (
    <div>
      <style>{`
        .ae-edit { cursor: text; border-radius: 4px; outline-offset: 3px; transition: outline-color .15s; }
        .ae-edit:hover { outline: 2px dashed rgba(217,136,59,.75); }
        .ae-edit:focus { outline: 2px solid #9e4a3c; }
        .ae-img { cursor: pointer; }
        .ae-img:hover .ae-img-ov { opacity: 1; }
      `}</style>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-espresso">About Page</h1>
          <p className="mt-1 text-sm text-espresso/60">
            Click any text, image, or button below to edit it in place. This is
            a live preview - changes aren&apos;t connected to the site yet.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* The live, editable replica */}
        <div className="min-w-0 flex-1">
          <div
            key={rev}
            className="overflow-hidden rounded-2xl border-2 border-sand shadow-lg"
          >
            {/* Hero */}
            <section className="relative flex min-h-[360px] items-center justify-center overflow-hidden">
              <div className="absolute inset-0">
                <EditableImage
                  value={{ src: c.hero.image, alt: "" }}
                  onChange={(v) => edit((d) => (d.hero.image = v.src))}
                  className="h-full"
                  imgClassName="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-espresso/75 via-maroon/55 to-espresso/85" />
              </div>
              <div className="relative mx-auto max-w-3xl px-6 py-16 text-center">
                <EditableText
                  as="p"
                  singleLine
                  value={c.hero.kicker}
                  onCommit={(v) => edit((d) => (d.hero.kicker = v))}
                  className="font-groovy text-sm uppercase tracking-[0.4em] text-cream/80"
                />
                <EditableText
                  as="h1"
                  singleLine
                  value={c.hero.title}
                  onCommit={(v) => edit((d) => (d.hero.title = v))}
                  className="mt-4 font-display text-5xl text-cream drop-shadow md:text-7xl"
                />
                <EditableText
                  as="p"
                  value={c.hero.subtitle}
                  onCommit={(v) => edit((d) => (d.hero.subtitle = v))}
                  className="mx-auto mt-6 max-w-xl text-lg text-cream/90"
                />
              </div>
              <p className="pointer-events-none absolute inset-x-0 bottom-3 z-20 text-center text-[11px] font-medium tracking-[0.08em] text-cream/70">
                Shown on site: full-bleed, ~100vw × 82vh (desktop)
              </p>
            </section>

            {/* About Us */}
            <section className="bg-cream-deep py-16">
              <div className="mx-auto max-w-3xl px-6 text-center">
                <EditableText
                  as="p"
                  singleLine
                  value={c.aboutUs.kicker}
                  onCommit={(v) => edit((d) => (d.aboutUs.kicker = v))}
                  className="font-groovy text-sm uppercase tracking-[0.35em] text-terracotta"
                />
                <EditableText
                  as="h2"
                  value={c.aboutUs.title}
                  onCommit={(v) => edit((d) => (d.aboutUs.title = v))}
                  className="mt-3 font-display text-4xl text-espresso md:text-5xl"
                />
                <EditableText
                  as="p"
                  value={c.aboutUs.intro}
                  onCommit={(v) => edit((d) => (d.aboutUs.intro = v))}
                  className="mt-6 text-lg leading-relaxed text-espresso/80"
                />
              </div>
            </section>

            {/* Philosophy */}
            <section className="bg-espresso py-16">
              <div className="mx-auto max-w-7xl px-6">
                <div className="text-center">
                  <EditableText
                    as="p"
                    singleLine
                    value={c.philosophy.kicker}
                    onCommit={(v) => edit((d) => (d.philosophy.kicker = v))}
                    className="font-groovy text-sm uppercase tracking-[0.35em] text-gold"
                  />
                  <EditableText
                    as="h2"
                    value={c.philosophy.title}
                    onCommit={(v) => edit((d) => (d.philosophy.title = v))}
                    className="mt-3 font-display text-4xl text-cream md:text-5xl"
                  />
                </div>
                <div className="mt-12 grid gap-7 md:grid-cols-3">
                  {c.philosophy.values.map((v, i) => (
                    <div
                      key={i}
                      className="rounded-3xl border border-cream/10 bg-espresso-soft/60 p-8 text-center"
                    >
                      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold">
                        ●
                      </span>
                      <EditableText
                        as="h3"
                        singleLine
                        value={v.title}
                        onCommit={(nv) =>
                          edit((d) => (d.philosophy.values[i].title = nv))
                        }
                        className="mt-5 font-display text-2xl text-cream"
                      />
                      <EditableText
                        as="p"
                        value={v.body}
                        onCommit={(nv) =>
                          edit((d) => (d.philosophy.values[i].body = nv))
                        }
                        className="mt-3 text-cream/75"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Origin */}
            <FeatureRow
              kicker={c.origin.kicker}
              title={c.origin.title}
              image={c.origin.image}
              dimensions="Shown on site: ~576 × 460 px (desktop)"
              paragraphs={c.origin.paragraphs}
              onKicker={(v) => edit((d) => (d.origin.kicker = v))}
              onTitle={(v) => edit((d) => (d.origin.title = v))}
              onImage={(v) => edit((d) => (d.origin.image = v))}
              onParagraph={(i, v) => edit((d) => (d.origin.paragraphs[i] = v))}
            />

            {/* Coffee */}
            <FeatureRow
              reverse
              dark
              kicker={c.coffee.kicker}
              title={c.coffee.title}
              image={c.coffee.image}
              dimensions="Shown on site: ~576 × 460 px (desktop)"
              paragraphs={c.coffee.paragraphs}
              cta={c.coffee.cta}
              onKicker={(v) => edit((d) => (d.coffee.kicker = v))}
              onTitle={(v) => edit((d) => (d.coffee.title = v))}
              onImage={(v) => edit((d) => (d.coffee.image = v))}
              onParagraph={(i, v) => edit((d) => (d.coffee.paragraphs[i] = v))}
              onCta={(v) => edit((d) => (d.coffee.cta = v))}
            />

            {/* Kitchen */}
            <FeatureRow
              kicker={c.kitchen.kicker}
              title={c.kitchen.title}
              image={c.kitchen.image}
              dimensions="Shown on site: ~576 × 460 px (desktop)"
              paragraphs={c.kitchen.paragraphs}
              cta={c.kitchen.cta}
              onKicker={(v) => edit((d) => (d.kitchen.kicker = v))}
              onTitle={(v) => edit((d) => (d.kitchen.title = v))}
              onImage={(v) => edit((d) => (d.kitchen.image = v))}
              onParagraph={(i, v) => edit((d) => (d.kitchen.paragraphs[i] = v))}
              onCta={(v) => edit((d) => (d.kitchen.cta = v))}
            />

            {/* Sound */}
            <section className="bg-espresso text-cream">
              <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:gap-16 md:px-8">
                <div>
                  <EditableText
                    as="p"
                    singleLine
                    value={c.sound.kicker}
                    onCommit={(v) => edit((d) => (d.sound.kicker = v))}
                    className="font-groovy text-sm uppercase tracking-[0.35em] text-gold"
                  />
                  <EditableText
                    as="h2"
                    value={c.sound.title}
                    onCommit={(v) => edit((d) => (d.sound.title = v))}
                    className="mt-3 font-display text-4xl leading-tight md:text-5xl"
                  />
                  <div className="mt-5 space-y-4 text-lg text-cream/85">
                    {c.sound.paragraphs.map((p, i) => (
                      <EditableText
                        key={i}
                        as="p"
                        value={p}
                        onCommit={(v) =>
                          edit((d) => (d.sound.paragraphs[i] = v))
                        }
                      />
                    ))}
                  </div>
                  <EditableCTA
                    value={c.sound.cta}
                    onChange={(v) => edit((d) => (d.sound.cta = v))}
                    className="mt-7 rounded-full border-2 border-cream/60 px-7 py-3 font-semibold text-cream"
                  />
                </div>
                <div className="grid grid-cols-2 items-start gap-4">
                  {c.sound.images.map((img, i) => (
                    <div key={i} className={i === 1 ? "mt-8" : ""}>
                      <div className="overflow-hidden rounded-3xl shadow-2xl shadow-black/30">
                        <EditableImage
                          value={img}
                          onChange={(v) => edit((d) => (d.sound.images[i] = v))}
                          imgClassName="h-56 w-full object-cover md:h-72"
                        />
                      </div>
                      <p className="mt-2 text-center text-[11px] font-medium tracking-[0.08em] text-cream/55">
                        Shown on site: ~280 × 320 px (desktop)
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Closing */}
            <section className="bg-terracotta py-16 text-center">
              <div className="mx-auto max-w-2xl px-6">
                <EditableText
                  as="h2"
                  value={c.closing.title}
                  onCommit={(v) => edit((d) => (d.closing.title = v))}
                  className="font-display text-5xl text-cream md:text-6xl"
                />
                <EditableText
                  as="p"
                  value={c.closing.body}
                  onCommit={(v) => edit((d) => (d.closing.body = v))}
                  className="mx-auto mt-4 max-w-xl text-lg text-cream/90"
                />
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  {c.closing.buttons.map((b, i) => (
                    <EditableCTA
                      key={i}
                      value={b}
                      onChange={(v) => edit((d) => (d.closing.buttons[i] = v))}
                      className={cn(
                        "rounded-full px-7 py-3 font-semibold shadow-lg",
                        i === 0
                          ? "bg-cream text-terracotta"
                          : "border-2 border-cream/70 text-cream",
                      )}
                    />
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Sticky Save panel */}
        <aside className="sticky top-6 w-full shrink-0 lg:w-64">
          <div className="rounded-2xl border-2 border-sand bg-cream p-5">
            <p className="font-groovy text-sm uppercase tracking-[0.2em] text-terracotta">
              Editing
            </p>
            <p className="mt-1 font-display text-2xl text-espresso">
              About Page
            </p>

            <div className="mt-4 flex items-center gap-2 text-sm">
              <span
                className={cn(
                  "inline-block h-2.5 w-2.5 rounded-full",
                  dirty ? "bg-brick" : "bg-[#4a7c4e]",
                )}
              />
              <span className="font-semibold text-espresso/80">
                {justSaved
                  ? "Saved ✓"
                  : dirty
                    ? "Unsaved changes"
                    : "All changes saved"}
              </span>
            </div>

            <button
              type="button"
              onClick={commitSave}
              disabled={!dirty}
              className={cn(btn.primary, "mt-4 w-full")}
            >
              Save changes
            </button>
            <button
              type="button"
              onClick={discard}
              disabled={!dirty}
              className={cn(btn.secondary, "mt-2 w-full")}
            >
              Discard
            </button>

            <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-espresso/80">
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                className="h-4 w-4 accent-brick"
              />
              Auto-save
            </label>

            <p className="mt-4 border-t border-sand pt-3 text-xs text-espresso/50">
              UI preview only - not connected to the live site yet. Saving logs
              the content payload to the browser console.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
