import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

import { PageWrapper } from "@/components/site/PageWrapper";
import type { MenuItem, MenuSection } from "@/data/menu";

/** Per-item interaction state managed client-side: like toggle + count. */
interface ItemState {
  likes: number;
  liked: boolean;
}

/** A visitor's client-side like toggle for one item. */
interface Override {
  liked: boolean;
}

type OverrideMap = Record<string, Override>;

/** A small heart toggle with the current like count beside it. */
function HeartButton({
  liked,
  likes,
  onToggle,
  size = "sm",
}: {
  liked: boolean;
  likes: number;
  onToggle: () => void;
  size?: "sm" | "lg";
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
  );
}

/** Read-only star row. */
function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-gold" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-espresso/25">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

/** A single menu card: image + heart, title, price, short description. */
function MenuCard({
  item,
  state,
  onToggleLike,
  onOpen,
}: {
  item: MenuItem;
  state: ItemState;
  onToggleLike: () => void;
  onOpen: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="group flex flex-col overflow-hidden rounded-2xl border-2 border-sand bg-cream text-left shadow-lg shadow-maroon/10 transition-all hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className="absolute right-3 top-3"
          onClick={(e) => e.stopPropagation()}
        >
          <HeartButton
            liked={state.liked}
            likes={state.likes}
            onToggle={onToggleLike}
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-2xl text-espresso">{item.name}</h3>
          <span className="font-semibold text-brick">{item.price}</span>
        </div>
        <p className="mt-2 text-sm text-espresso/75">{item.description}</p>
      </div>
    </motion.button>
  );
}

/** The detail modal for one item. Reviews are backend-moderated when enabled. */
function ItemModal({
  item,
  state,
  reviewsEnabled,
  onToggleLike,
  onClose,
}: {
  item: MenuItem;
  state: ItemState;
  reviewsEnabled: boolean;
  onToggleLike: () => void;
  onClose: () => void;
}) {
  const reviews = useQuery(
    api.reviews.listApprovedForItem,
    reviewsEnabled ? { menuItemId: item.id as Id<"menuItems"> } : "skip",
  );
  const submitReview = useMutation(api.reviews.submit);

  const [showForm, setShowForm] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    await submitReview({
      menuItemId: item.id as Id<"menuItems">,
      menuItemName: item.name,
      name: name.trim(),
      rating,
      text: text.trim(),
    });
    setName("");
    setText("");
    setRating(5);
    setShowForm(false);
    setSubmitted(true);
  }

  const reviewCount = reviews?.length ?? 0;

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
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-cream shadow-2xl"
      >
        {/* Image header */}
        <div className="relative h-56 shrink-0 sm:h-64">
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-espresso/50 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-cream/90 text-espresso shadow transition-colors hover:bg-cream"
          >
            ✕
          </button>
          <div className="absolute bottom-4 right-4">
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
            <span className="text-2xl font-semibold text-brick">
              {item.price}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-terracotta">
            {state.likes} {state.likes === 1 ? "like" : "likes"}
          </p>
          <p className="mt-4 text-lg text-espresso/85">{item.description}</p>

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
                  {showReviews
                    ? "Hide Reviews"
                    : `See Reviews (${reviewCount})`}
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
                      className="w-full rounded-xl border-2 border-sand bg-white px-4 py-2.5 text-espresso placeholder:text-espresso/55 outline-none focus:border-gold"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-espresso/70">
                        Rating:
                      </span>
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
                      className="w-full resize-none rounded-xl border-2 border-sand bg-white px-4 py-2.5 text-espresso placeholder:text-espresso/55 outline-none focus:border-gold"
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
                  Thanks! Your review was submitted and will appear once it's
                  approved.
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
                    <h3 className="font-groovy text-sm uppercase tracking-[0.2em] text-espresso/60">
                      Reviews
                    </h3>
                    {reviews === undefined ? (
                      <p className="mt-3 text-espresso/60">Loading…</p>
                    ) : reviews.length === 0 ? (
                      <p className="mt-3 text-espresso/60">
                        No reviews yet. Be the first!
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-4">
                        {reviews.map((r, i) => (
                          <li
                            key={i}
                            className="rounded-2xl border border-espresso/10 bg-cream-deep/50 p-4"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-espresso">
                                {r.name}
                              </span>
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
  );
}

/** Combine an item's stored like count with the visitor's client-side toggle. */
function viewState(item: MenuItem, override?: Override): ItemState {
  const liked = override?.liked ?? false;
  return { liked, likes: item.likes + (liked ? 1 : 0) };
}

/** Shared menu page: hero band, grouped sections of cards, and the modal. */
export function MenuPage({
  kicker,
  title,
  sections,
  loading = false,
  pdf = null,
  reviewsEnabled = false,
}: {
  kicker: string;
  title: string;
  sections: MenuSection[];
  loading?: boolean;
  pdf?: { url: string | null; name: string } | null;
  /** When true, the item modal shows backend-moderated reviews + submission. */
  reviewsEnabled?: boolean;
}) {
  const allItems = useMemo(
    () => sections.flatMap((s) => s.items),
    [sections],
  );

  // Per-item like toggles the visitor makes, layered over stored values.
  const [overrides, setOverrides] = useState<OverrideMap>({});
  const [openId, setOpenId] = useState<string | null>(null);

  const openItem = useMemo(
    () => allItems.find((it) => it.id === openId) ?? null,
    [allItems, openId],
  );

  function toggleLike(id: string) {
    setOverrides((prev) => ({ ...prev, [id]: { liked: !prev[id]?.liked } }));
  }

  // Lock body scroll while the modal is open.
  useEffect(() => {
    document.body.style.overflow = openId ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [openId]);

  return (
    <PageWrapper>
      <section className="bg-cream pb-20 pt-32 md:pb-28 md:pt-40">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <header className="mb-12 text-center">
            <p className="font-groovy text-sm uppercase tracking-[0.35em] text-terracotta">
              {kicker}
            </p>
            <h1 className="mt-3 font-display text-5xl text-espresso md:text-7xl">
              {title}
            </h1>
            {pdf?.url && (
              <a
                href={pdf.url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-block rounded-full bg-brick px-6 py-2.5 font-semibold text-cream transition-all hover:-translate-y-0.5 hover:bg-maroon"
              >
                Download PDF Menu →
              </a>
            )}
          </header>

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
                      onToggleLike={() => toggleLike(item.id)}
                      onOpen={() => setOpenId(item.id)}
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
              reviewsEnabled={reviewsEnabled}
              onToggleLike={() => toggleLike(openItem.id)}
              onClose={() => setOpenId(null)}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </PageWrapper>
  );
}
