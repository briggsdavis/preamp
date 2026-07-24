import { api } from "@convex/_generated/api"
import { useQuery } from "convex/react"
import { motion } from "motion/react"
import { useEffect, useRef } from "react"
import { EditableLink, EditableText, useInlineEditingMode } from "@/components/cms/inline-editing"
import { ErrorBoundary } from "@/components/site/error-boundary"
import { SquiggleLine } from "@/components/site/squiggle-line"
import { useTrack } from "@/lib/analytics"
import { useGlobalContent, useHomeContent } from "@/lib/site-content"

interface FeaturedItem {
  _id: string
  name: string
  price: string
  description: string
  orderUrl?: string | null
  image: string | null
}

const FALLBACK_FEATURED_ITEMS: FeaturedItem[] = [
  {
    _id: "fallback-smokey-robinson",
    name: "Smokey Robinson",
    price: "$5.75",
    description: "Our house signature: smooth, sweet, a little smoky.",
    image: "/images/menu-coffeeshot.webp",
  },
  {
    _id: "fallback-yuzu-espresso-tonic",
    name: "Yuzu Espresso Tonic",
    price: "$6.00",
    description: "Bright, citrusy and effervescent over ice.",
    image: "/images/menu-coffeepouring.webp",
  },
  {
    _id: "fallback-focaccia-sandwich",
    name: "Focaccia Sandwich",
    price: "$11.00",
    description: "House focaccia, seasonal fillings, dressed greens.",
    image: "/images/menu-sandwich.webp",
  },
  {
    _id: "fallback-kyoto-cold-brew",
    name: "Kyoto Cold Brew",
    price: "$5.25",
    description: "Slow-dripped overnight for a clean, syrupy cup.",
    image: "/images/menu-coffee.webp",
  },
]

function FeaturedCard({ item }: { item: FeaturedItem }) {
  const track = useTrack()
  const global = useGlobalContent()
  // Prefer the item's own Toast link; fall back to the site-wide ordering page
  // so the Best Sellers strip always has a working button.
  const orderUrl = item.orderUrl || global.orderUrl
  return (
    <motion.article
      whileHover={{ y: -10 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="group flex w-[300px] shrink-0 flex-col overflow-hidden rounded-3xl border border-espresso/10 bg-cream shadow-sm transition-shadow hover:shadow-2xl hover:shadow-maroon/15"
    >
      <div className="h-44 w-full overflow-hidden bg-cream-deep">
        {item.image && (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col px-6 pt-5 pb-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-groovy text-2xl leading-tight text-espresso">{item.name}</h3>
          <span className="shrink-0 font-semibold text-brick">{item.price}</span>
        </div>
        <a
          href={orderUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() =>
            track("order_click", {
              clickSource: "featured",
              menuItemName: item.name,
              destination: orderUrl,
            })
          }
          className="mt-4 block rounded-full bg-terracotta px-5 py-2.5 text-center text-sm font-semibold text-cream shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brick hover:shadow-md"
        >
          Order
        </a>
      </div>
    </motion.article>
  )
}

/** The animated marquee strip of featured items. */
function BestSellersStrip({
  items,
  showLine = true,
}: {
  items: FeaturedItem[]
  showLine?: boolean
}) {
  const trackEvent = useTrack()
  const content = useHomeContent().featured
  const global = useGlobalContent()
  const editing = useInlineEditingMode()
  const buttonUrl = content.button.href || global.orderUrl
  const trackRef = useRef<HTMLDivElement>(null)
  // Render the list twice so the strip can wrap seamlessly.
  const loop = [...items, ...items]

  const x = useRef(0)
  const setWidth = useRef(0)
  const boostTarget = useRef(0)
  const boost = useRef(0)
  const paused = useRef(false)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const measure = () => {
      const cards = track.children
      const first = cards.item(0) as HTMLElement | null
      const repeatedFirst = cards.item(items.length) as HTMLElement | null
      setWidth.current = first && repeatedFirst ? repeatedFirst.offsetLeft - first.offsetLeft : 0
    }
    measure()
    window.addEventListener("resize", measure)
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(track)

    const MAX_BOOST = 45
    let lastScrollY = window.scrollY
    let lastScrollT = performance.now()
    const onScroll = () => {
      const now = performance.now()
      const dy = Math.abs(window.scrollY - lastScrollY)
      const dt = Math.max(now - lastScrollT, 1)
      const velocity = (dy / dt) * 1000
      boostTarget.current = Math.min(velocity * 0.03, MAX_BOOST)
      lastScrollY = window.scrollY
      lastScrollT = now
    }
    if (!reduce) window.addEventListener("scroll", onScroll, { passive: true })

    const base = reduce || editing ? 0 : 42
    let last = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      boostTarget.current *= 0.94
      if (boostTarget.current < 0.1) boostTarget.current = 0
      boost.current += (boostTarget.current - boost.current) * Math.min(dt * 2.5, 1)

      if (!paused.current) {
        x.current -= (base + boost.current) * dt
      }

      const w = setWidth.current
      if (w > 0) {
        if (x.current <= -w) x.current += w
        if (x.current > 0) x.current -= w
      }
      track.style.transform = `translate3d(${x.current}px, 0, 0)`
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", onScroll)
      resizeObserver.disconnect()
    }
  }, [editing, items.length])

  return (
    <section className="relative overflow-hidden bg-cream-deep py-24">
      {showLine && <SquiggleLine />}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -18% 0px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-20 mx-auto mb-12 max-w-6xl px-6 md:px-8"
      >
        <p className="font-groovy text-sm tracking-[0.35em] text-terracotta uppercase">
          <EditableText path="featured.kicker" value={content.kicker} />
        </p>
        <h2 className="mt-3 font-groovy text-4xl text-espresso md:text-5xl">
          <EditableText path="featured.title" value={content.title} />
        </h2>
      </motion.div>

      <div
        className="relative z-20"
        onMouseEnter={() => (paused.current = true)}
        onMouseLeave={() => (paused.current = false)}
      >
        <div ref={trackRef} className="flex w-max gap-6 px-6 will-change-transform">
          {loop.map((item, i) => (
            <FeaturedCard key={`${item._id}-${i}`} item={item} />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-cream-deep to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-cream-deep to-transparent" />
      </div>

      <div className="relative z-20 mx-auto mt-12 max-w-6xl px-6 text-center md:px-8">
        <p className="text-espresso/70">
          <EditableText path="featured.body" value={content.body} />
        </p>
        <EditableLink path="featured.button" value={content.button}>
          <a
            href={buttonUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              trackEvent("order_click", {
                clickSource: "featured",
                destination: buttonUrl,
              })
            }
            className="mt-3 inline-block rounded-full bg-terracotta px-7 py-3 font-semibold text-cream shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brick hover:shadow-md"
          >
            {content.button.label}
          </a>
        </EditableLink>
      </div>
    </section>
  )
}

/** Reads featured menu items; falls back locally when the backend is absent. */
function FeaturedCarouselInner({ showLine }: { showLine?: boolean }) {
  const items = useQuery(api.menu.listFeatured) as FeaturedItem[] | undefined
  const shownItems = items && items.length > 0 ? items : FALLBACK_FEATURED_ITEMS
  return <BestSellersStrip items={shownItems} showLine={showLine} />
}

export function FeaturedCarousel({ showLine = true }: { showLine?: boolean }) {
  return (
    <ErrorBoundary
      fallback={<BestSellersStrip items={FALLBACK_FEATURED_ITEMS} showLine={showLine} />}
    >
      <FeaturedCarouselInner showLine={showLine} />
    </ErrorBoundary>
  )
}
