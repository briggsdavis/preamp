import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import { useQuery, useMutation } from "convex/react"
import { motion, AnimatePresence, useDragControls } from "motion/react"
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router"
import { ContentIcon, dietaryIconName } from "@/components/site/content-icon"
import { PageWrapper } from "@/components/site/page-wrapper"
import type { MenuItem, MenuSection } from "@/data/menu"
import { useTrack } from "@/lib/analytics"
import { useSeo } from "@/lib/seo"
import { useGlobalContent } from "@/lib/site-content"

/** A resolved dietary tag (label + vector icon + color) for rendering pills. */
export interface TagInfo {
  key: string
  label: string
  icon: string
  color: string
}

type TagLookup = Record<string, TagInfo>

/** Resolve an item's tag keys to catalog entries, dropping unknown keys. */
function itemTags(item: MenuItem, lookup: TagLookup): TagInfo[] {
  return (item.dietaryTags ?? []).map((k) => lookup[k]).filter((t): t is TagInfo => !!t)
}

/** A row of dietary tag pills. Renders nothing when the item has no tags. */
function DietaryPills({ tags, size = "sm" }: { tags: TagInfo[]; size?: "sm" | "lg" }) {
  if (tags.length === 0) return null
  return (
    <div className={`flex flex-wrap gap-1.5 ${size === "lg" ? "mt-4" : "mt-2"}`}>
      {tags.map((t) => (
        <span
          key={t.key}
          title={t.label}
          className={`inline-flex items-center gap-1 rounded-full border font-semibold ${
            size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"
          }`}
          style={{
            color: t.color,
            borderColor: `${t.color}55`,
            background: `${t.color}14`,
          }}
        >
          <ContentIcon
            name={dietaryIconName(t.key, t.icon)}
            className={size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5"}
          />
          {t.label}
        </span>
      ))}
    </div>
  )
}

/** Per-item interaction state managed client-side: like toggle + count. */
interface ItemState {
  likes: number
  liked: boolean
}

/** A visitor's client-side like toggle for one item. */
interface Override {
  liked: boolean
}

type OverrideMap = Record<string, Override>

/** A small heart toggle with the current like count beside it. */
function HeartButton({
  liked,
  likes,
  onToggle,
  size = "sm",
}: {
  liked: boolean
  likes: number
  onToggle: () => void
  size?: "sm" | "lg"
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      className={`inline-flex items-center gap-1.5 rounded-full bg-cream/90 font-semibold text-espresso shadow-sm backdrop-blur transition-transform hover:scale-105 ${
        size === "lg" ? "px-4 py-2 text-base" : "px-3 py-1.5 text-sm"
      }`}
    >
      <span
        className={`leading-none transition-colors ${
          liked ? "text-brick" : "text-espresso/40"
        } ${size === "lg" ? "text-xl" : "text-base"}`}
      >
        {liked ? "♥" : "♡"}
      </span>
      {likes}
    </button>
  )
}

/** Read-only star row. */
function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-gold" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-espresso/25">{"★".repeat(5 - rating)}</span>
    </span>
  )
}

function externalHref(url: string): string {
  const trimmed = url.trim()
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

/**
 * Per-item "Order" button. When the item has a Toast link it opens it in a new
 * tab and records an `order_click`; with no link it renders disabled (decision:
 * show-disabled rather than hide, so every item reads consistently).
 */
function OrderButton({
  item,
  size = "sm",
  label = "Order",
}: {
  item: MenuItem
  size?: "sm" | "lg"
  label?: string
}) {
  const track = useTrack()
  const sizing = size === "lg" ? "px-6 py-2.5 text-base" : "px-4 py-2 text-sm"

  if (!item.orderUrl) {
    return (
      <span
        aria-disabled="true"
        title={`${label} link for this item is coming soon`}
        className={`inline-flex cursor-not-allowed items-center justify-center rounded-full bg-espresso/10 font-semibold text-espresso/40 ${sizing}`}
      >
        {label}
      </span>
    )
  }

  const href = externalHref(item.orderUrl)

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => {
        e.stopPropagation()
        track("order_click", {
          clickSource: "menu-item",
          menuItemName: item.name,
          destination: href,
        })
      }}
      className={`inline-flex items-center justify-center rounded-full bg-terracotta font-semibold text-cream shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brick hover:shadow-md ${sizing}`}
    >
      {label} →
    </a>
  )
}

/** A single menu card: image + heart, title, price, short description. */
function MenuCard({
  item,
  state,
  tags,
  href,
  orderEnabled,
  orderLabel,
  onToggleLike,
  onOpen,
}: {
  item: MenuItem
  state: ItemState
  tags: TagInfo[]
  href?: string
  orderEnabled: boolean
  orderLabel?: string
  onToggleLike: () => void
  onOpen: () => void
}) {
  return (
    <motion.a
      href={href}
      onClick={(e) => {
        // Plain left-click opens the routed modal in-app; modifier/middle
        // clicks fall through to the browser (open in new tab, etc.).
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        onOpen()
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border-2 border-sand bg-cream text-left shadow-lg shadow-maroon/10 transition-all hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className="absolute top-3 right-3"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <HeartButton liked={state.liked} likes={state.likes} onToggle={onToggleLike} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-2xl text-espresso">{item.name}</h3>
          <span className="font-semibold text-brick">{item.price}</span>
        </div>
        <p className="mt-2 text-sm text-espresso/75">{item.description}</p>
        <DietaryPills tags={tags} />
        {orderEnabled && (
          <div
            className="mt-4 flex"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            <OrderButton item={item} label={orderLabel} />
          </div>
        )}
      </div>
    </motion.a>
  )
}

/** The detail modal for one item. Reviews are backend-moderated when enabled. */
function ItemModal({
  item,
  state,
  tags,
  reviewsEnabled,
  orderEnabled,
  orderLabel,
  onToggleLike,
  onClose,
}: {
  item: MenuItem
  state: ItemState
  tags: TagInfo[]
  reviewsEnabled: boolean
  orderEnabled: boolean
  orderLabel?: string
  onToggleLike: () => void
  onClose: () => void
}) {
  const reviews = useQuery(
    api.reviews.listApprovedForItem,
    reviewsEnabled ? { menuItemId: item.id as Id<"menuItems"> } : "skip",
  )
  const submitReview = useMutation(api.reviews.submit)

  const [showForm, setShowForm] = useState(false)
  const [showReviews, setShowReviews] = useState(false)
  const [name, setName] = useState("")
  const [rating, setRating] = useState(5)
  const [text, setText] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [imgIndex, setImgIndex] = useState(0)

  // Swipe-down-to-dismiss on mobile. The drag is started only from the grabber
  // handle (dragListener={false}) so it never fights the scrollable body.
  const dragControls = useDragControls()

  const imgs = item.images && item.images.length > 0 ? item.images : [item.image]
  const shownImg = imgs[Math.min(imgIndex, imgs.length - 1)]

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim() || !text.trim()) return
    await submitReview({
      menuItemId: item.id as Id<"menuItems">,
      menuItemName: item.name,
      name: name.trim(),
      rating,
      text: text.trim(),
    })
    setName("")
    setText("")
    setRating(5)
    setShowForm(false)
    setSubmitted(true)
  }

  const reviewCount = reviews?.length ?? 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-espresso/70 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 26, stiffness: 260 }}
        onClick={(e) => e.stopPropagation()}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 120 || info.velocity.y > 600) onClose()
        }}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-cream shadow-2xl"
      >
        {/* Grabber - swipe it down to dismiss on mobile (hidden on desktop). */}
        <div
          aria-hidden
          onPointerDown={(e) => dragControls.start(e)}
          className="flex shrink-0 cursor-grab touch-none justify-center py-2.5 active:cursor-grabbing sm:hidden"
        >
          <span className="h-1.5 w-10 rounded-full bg-espresso/25" />
        </div>

        {/* Image header (carousel when there are multiple images) */}
        <div className="relative h-56 shrink-0 sm:h-64">
          <img src={shownImg} alt={item.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-espresso/50 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-cream/90 text-espresso shadow transition-colors hover:bg-cream"
          >
            ✕
          </button>
          {imgs.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setImgIndex((i) => (i - 1 + imgs.length) % imgs.length)}
                aria-label="Previous image"
                className="absolute top-1/2 left-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-espresso/60 text-cream transition-colors hover:bg-espresso"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setImgIndex((i) => (i + 1) % imgs.length)}
                aria-label="Next image"
                className="absolute top-1/2 right-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-espresso/60 text-cream transition-colors hover:bg-espresso"
              >
                ›
              </button>
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                {imgs.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setImgIndex(idx)}
                    aria-label={`Image ${idx + 1}`}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      idx === Math.min(imgIndex, imgs.length - 1) ? "bg-cream" : "bg-cream/40"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
          <div className="absolute right-4 bottom-4">
            <HeartButton
              liked={state.liked}
              likes={state.likes}
              onToggle={onToggleLike}
              size="lg"
            />
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-4xl text-espresso">{item.name}</h2>
            <span className="text-2xl font-semibold text-brick">{item.price}</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-terracotta">
            {state.likes} {state.likes === 1 ? "like" : "likes"}
          </p>
          <DietaryPills tags={tags} size="lg" />
          <p className="mt-4 text-lg text-espresso/85">{item.description}</p>

          {orderEnabled && (
            <div className="mt-6">
              <OrderButton item={item} label={orderLabel} size="lg" />
              {!item.orderUrl && (
                <p className="mt-2 text-sm text-espresso/50">
                  {orderLabel} links for this item are coming soon.
                </p>
              )}
            </div>
          )}

          {reviewsEnabled && (
            <>
              {/* Action buttons */}
              <div className="mt-7 flex flex-wrap gap-3 border-t border-espresso/10 pt-6">
                <button
                  type="button"
                  onClick={() => setShowForm((v) => !v)}
                  className="rounded-full bg-brick px-6 py-2.5 font-semibold text-cream transition-all hover:-translate-y-0.5 hover:bg-maroon"
                >
                  Leave a Review
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviews((v) => !v)}
                  className="rounded-full border-2 border-brick px-6 py-2.5 font-semibold text-brick transition-all hover:-translate-y-0.5 hover:bg-brick/10"
                >
                  {showReviews ? "Hide Reviews" : `See Reviews (${reviewCount})`}
                </button>
              </div>

              {/* Leave a review */}
              <AnimatePresence initial={false}>
                {showForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleSubmit}
                    className="mt-5 space-y-3 overflow-hidden"
                  >
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-xl border-2 border-sand bg-white px-4 py-2.5 text-espresso outline-none placeholder:text-espresso/55 focus:border-gold"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-espresso/70">Rating:</span>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(n)}
                          aria-label={`${n} star${n > 1 ? "s" : ""}`}
                          className={`text-2xl leading-none transition-colors ${
                            n <= rating ? "text-gold" : "text-espresso/25"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Share your thoughts…"
                      rows={3}
                      className="w-full resize-none rounded-xl border-2 border-sand bg-white px-4 py-2.5 text-espresso outline-none placeholder:text-espresso/55 focus:border-gold"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-brick px-6 py-2.5 font-semibold text-cream transition-all hover:-translate-y-0.5 hover:bg-maroon"
                    >
                      Submit Review →
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {submitted && !showForm && (
                <p className="mt-4 rounded-xl border border-brick/20 bg-brick/5 px-4 py-3 text-sm font-semibold text-brick">
                  Thanks for your review!
                </p>
              )}

              {/* Reviews list */}
              <AnimatePresence initial={false}>
                {showReviews && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 overflow-hidden"
                  >
                    <h3 className="font-groovy text-sm tracking-[0.2em] text-espresso/60 uppercase">
                      Reviews
                    </h3>
                    {reviews === undefined ? (
                      <p className="mt-3 text-espresso/60">Loading…</p>
                    ) : reviews.length === 0 ? (
                      <p className="mt-3 text-espresso/60">No reviews yet. Be the first!</p>
                    ) : (
                      <ul className="mt-3 space-y-4">
                        {reviews.map((r, i) => (
                          <li
                            key={i}
                            className="rounded-2xl border border-espresso/10 bg-cream-deep/50 p-4"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-espresso">{r.name}</span>
                              <Stars rating={r.rating} />
                            </div>
                            <p className="mt-1.5 text-espresso/80">{r.text}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

/** Combine an item's stored like count with the visitor's client-side toggle. */
function viewState(item: MenuItem, override?: Override): ItemState {
  const liked = override?.liked ?? false
  return { liked, likes: item.likes + (liked ? 1 : 0) }
}

/** Numeric price string ("$4.75" → "4.75") for structured data. */
function priceValue(price: string): string {
  const m = price.match(/[\d]+(\.\d+)?/)
  return m ? m[0] : ""
}

/** Shared menu page: hero band, grouped sections of cards, and the modal. */
export function MenuPage({
  kicker,
  title,
  menuKind,
  routeBase,
  openSlug,
  sections,
  loading = false,
  pdf = null,
  reviewsEnabled = false,
  orderEnabled = false,
  orderLabel = "Order",
  banner,
}: {
  kicker: string
  title: string
  /**
   * Which menu this is; drives item-page URLs (/menu/<kind>/<slug>). When
   * omitted (e.g. the merch page) the modal opens as client-only state with no
   * URL, tracking, or SEO.
   */
  menuKind?: string
  /** Optional route base for non-menu product pages, e.g. /retail. */
  routeBase?: string
  /** When set, the item with this slug opens as a routed modal. */
  openSlug?: string
  sections: MenuSection[]
  loading?: boolean
  pdf?: { url: string | null; name: string } | null
  /** When true, the item modal shows backend-moderated reviews + submission. */
  reviewsEnabled?: boolean
  /** When true, each item shows an "Order" button (Toast link or disabled). */
  orderEnabled?: boolean
  /** Label used for per-item purchase/order buttons. */
  orderLabel?: string
  /** Optional highlighted callout shown under the page header (e.g. a promo). */
  banner?: ReactNode
}) {
  const global = useGlobalContent()
  const track = useTrack()
  const navigate = useNavigate()
  const tagCatalog = useQuery(api.dietaryTags.list)
  const tagLookup = useMemo<TagLookup>(() => {
    const map: TagLookup = {}
    for (const t of tagCatalog ?? []) {
      map[t.key] = { key: t.key, label: t.label, icon: t.icon, color: t.color }
    }
    return map
  }, [tagCatalog])

  const allItems = useMemo(() => sections.flatMap((s) => s.items), [sections])

  // Per-item like toggles the visitor makes, layered over stored values.
  const [overrides, setOverrides] = useState<OverrideMap>({})
  // Fallback open state for the unrouted (merch) mode.
  const [openId, setOpenId] = useState<string | null>(null)

  const routed = !!(menuKind || routeBase)
  const base = routeBase ?? (menuKind ? `/menu/${menuKind}` : "")

  // Routed mode derives the open item from the URL slug (a real page);
  // unrouted mode uses local state.
  const openItem = useMemo(
    () =>
      routed
        ? openSlug
          ? (allItems.find((it) => it.slug === openSlug) ?? null)
          : null
        : (allItems.find((it) => it.id === openId) ?? null),
    [routed, allItems, openSlug, openId],
  )

  const hrefFor = (item: MenuItem) => (routed && item.slug ? `${base}/${item.slug}` : undefined)
  const openItemNav = (item: MenuItem) => {
    if (routed) {
      if (item.slug) navigate(`${base}/${item.slug}`)
    } else {
      setOpenId(item.id)
    }
  }
  const closeModal = () => {
    if (routed) navigate(base)
    else setOpenId(null)
  }

  function toggleLike(id: string) {
    setOverrides((prev) => ({ ...prev, [id]: { liked: !prev[id]?.liked } }))
  }

  // Record a per-item "view" whenever an item detail becomes the open page.
  useEffect(() => {
    if (!openItem || !routed) return
    track("item_view", {
      path: `${base}/${openItem.slug ?? ""}`,
      menu: menuKind,
      menuItemName: openItem.name,
      entityId: openItem.id,
      entityTitle: openItem.name,
    })
  }, [openItem?.id, routed])

  // Per-item SEO (title/description/OG/JSON-LD) while a routed item is open.
  useSeo(
    openItem && routed
      ? {
          title: `${openItem.name} · ${title} · ${global.businessName} ${global.tagline}`,
          description: openItem.description,
          canonicalPath: `${base}/${openItem.slug ?? ""}`,
          image: openItem.image,
          type: "product",
          jsonLd: {
            "@context": "https://schema.org",
            "@type": menuKind ? "MenuItem" : "Product",
            name: openItem.name,
            description: openItem.description,
            ...(openItem.image ? { image: openItem.image } : {}),
            offers: {
              "@type": "Offer",
              price: priceValue(openItem.price),
              priceCurrency: "USD",
            },
          },
        }
      : null,
  )

  // Lock body scroll while the modal is open.
  useEffect(() => {
    document.body.style.overflow = openItem ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [openItem])

  return (
    <PageWrapper>
      <section className="bg-cream pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <header className="mb-12 text-center">
            <p className="font-groovy text-sm tracking-[0.35em] text-terracotta uppercase">
              {kicker}
            </p>
            <h1 className="mt-3 font-display text-5xl text-espresso md:text-7xl">{title}</h1>
            {(orderEnabled || pdf?.url) && (
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {orderEnabled && (
                  <a
                    href={global.orderUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() =>
                      track("order_click", {
                        clickSource: "menu-header",
                        destination: global.orderUrl,
                      })
                    }
                    className="inline-block rounded-full bg-terracotta px-6 py-2.5 font-semibold text-cream shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brick"
                  >
                    Order Online →
                  </a>
                )}
                {pdf?.url && (
                  <a
                    href={`/menu-pdf?src=${encodeURIComponent(pdf.url)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block rounded-full border-2 border-brick px-6 py-2.5 font-semibold text-brick transition-all hover:-translate-y-0.5 hover:bg-brick/10"
                  >
                    View Menu PDF →
                  </a>
                )}
              </div>
            )}
          </header>

          {banner && <div className="mb-12">{banner}</div>}

          {loading && sections.length === 0 && (
            <p className="text-center text-espresso/60">Loading the menu…</p>
          )}
          {!loading && sections.length === 0 && (
            <p className="text-center text-espresso/60">
              The menu is being updated. Check back soon!
            </p>
          )}

          <div className="space-y-16">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="mb-6 flex items-center gap-4 font-display text-3xl text-espresso md:text-4xl">
                  {section.title}
                  <span className="h-px flex-1 bg-espresso/15" />
                </h2>
                <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                  {section.items.map((item) => (
                    <MenuCard
                      key={item.id}
                      item={item}
                      state={viewState(item, overrides[item.id])}
                      tags={itemTags(item, tagLookup)}
                      href={hrefFor(item)}
                      orderEnabled={orderEnabled}
                      orderLabel={orderLabel}
                      onToggleLike={() => toggleLike(item.id)}
                      onOpen={() => openItemNav(item)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal is portaled to <body> so its fixed positioning is relative to
          the viewport, not the transformed PageWrapper ancestor. */}
      {createPortal(
        <AnimatePresence>
          {openItem && (
            <ItemModal
              item={openItem}
              state={viewState(openItem, overrides[openItem.id])}
              tags={itemTags(openItem, tagLookup)}
              reviewsEnabled={reviewsEnabled}
              orderEnabled={orderEnabled}
              orderLabel={orderLabel}
              onToggleLike={() => toggleLike(openItem.id)}
              onClose={closeModal}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </PageWrapper>
  )
}
