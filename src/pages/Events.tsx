import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import { PageWrapper } from "@/components/site/PageWrapper";

/** An event as returned by the public Convex query. */
interface EventDoc {
  _id: string;
  title: string;
  description: string;
  startsAt: number;
  images: string[];
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

function formatEventDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatEventTime(d: Date) {
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** A simple image carousel with arrows + dots. */
function Carousel({
  images,
  alt,
  className,
}: {
  images: string[];
  alt: string;
  className?: string;
}) {
  const [i, setI] = useState(0);
  if (images.length === 0) {
    return <div className={`bg-cream-deep ${className ?? ""}`} />;
  }
  const go = (dir: number) =>
    setI((cur) => (cur + dir + images.length) % images.length);

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <img src={images[i]} alt={alt} className="h-full w-full object-cover" />
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-espresso/60 text-cream transition-colors hover:bg-espresso"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            aria-label="Next image"
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-espresso/60 text-cream transition-colors hover:bg-espresso"
          >
            ›
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setI(idx);
                }}
                aria-label={`Image ${idx + 1}`}
                className={`h-2 w-2 rounded-full transition-colors ${
                  idx === i ? "bg-cream" : "bg-cream/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Detail modal opened from the calendar. */
function EventModal({
  event,
  onClose,
}: {
  event: EventDoc;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const date = new Date(event.startsAt);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-espresso/70 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: "spring", damping: 26, stiffness: 260 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-3xl bg-cream shadow-2xl"
      >
        {event.images.length > 0 && (
          <Carousel
            images={event.images}
            alt={event.title}
            className="aspect-[4/3]"
          />
        )}
        <div className="p-6">
          <p className="font-groovy text-sm uppercase tracking-[0.2em] text-terracotta">
            {formatEventDate(date)} · {formatEventTime(date)}
          </p>
          <h3 className="mt-2 font-display text-3xl text-espresso">
            {event.title}
          </h3>
          <p className="mt-3 text-espresso/80">{event.description}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 rounded-full bg-brick px-6 py-2.5 font-semibold text-cream transition-colors hover:bg-maroon"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

/** Month-grid calendar with clickable event chips. Highlights today. */
function Calendar({
  events,
  onSelect,
}: {
  events: EventDoc[];
  onSelect: (e: EventDoc) => void;
}) {
  const today = new Date();
  const [view, setView] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const year = view.getFullYear();
  const month = view.getMonth();

  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const gridStart = new Date(year, month, 1 - startWeekday);
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });

  const prev = () => setView(new Date(year, month - 1, 1));
  const next = () => setView(new Date(year, month + 1, 1));

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-4xl text-espresso md:text-5xl">
          {MONTHS[month]} {year}
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex overflow-hidden rounded-lg bg-orange text-cream">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous month"
              className="px-5 py-2.5 text-lg transition-colors hover:bg-terracotta"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next month"
              className="border-l border-cream/25 px-5 py-2.5 text-lg transition-colors hover:bg-terracotta"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-hidden rounded-lg border border-espresso/15">
        <div className="grid grid-cols-7 bg-brick">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="py-2.5 text-center font-semibold uppercase tracking-wide text-cream"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const inMonth = d.getMonth() === month;
            const isToday = sameDay(d, today);
            const dayEvents = events.filter((ev) =>
              sameDay(new Date(ev.startsAt), d),
            );
            return (
              <div
                key={i}
                className={`min-h-[96px] border-b border-r border-espresso/10 p-2 md:min-h-[120px] ${
                  i % 7 === 0 ? "border-l" : ""
                } ${inMonth ? "bg-cream" : "bg-cream-deep/40"}`}
              >
                <div className="flex justify-end">
                  {isToday ? (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange font-semibold text-cream">
                      {d.getDate()}
                    </span>
                  ) : (
                    <span
                      className={`flex h-8 w-8 items-center justify-center font-medium ${
                        inMonth ? "text-espresso" : "text-espresso/35"
                      }`}
                    >
                      {d.getDate()}
                    </span>
                  )}
                </div>
                <div className="mt-1 space-y-1">
                  {dayEvents.map((ev) => (
                    <button
                      key={ev._id}
                      type="button"
                      onClick={() => onSelect(ev)}
                      title={ev.title}
                      className="block w-full truncate rounded bg-brick px-1.5 py-1 text-left text-xs font-semibold text-cream transition-colors hover:bg-maroon"
                    >
                      {formatEventTime(new Date(ev.startsAt))} · {ev.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** List of upcoming events - image carousel left, details right. */
function UpcomingEvents({ events }: { events: EventDoc[] }) {
  const sorted = [...events].sort((a, b) => a.startsAt - b.startsAt);

  if (sorted.length === 0) {
    return (
      <p className="text-center text-espresso/60">
        No upcoming events right now. Check back soon!
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {sorted.map((ev, i) => {
        const date = new Date(ev.startsAt);
        return (
          <motion.article
            key={ev._id}
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.05 }}
            className="grid gap-6 overflow-hidden rounded-2xl border-2 border-sand bg-cream shadow-lg shadow-maroon/10 sm:grid-cols-[260px_1fr]"
          >
            <Carousel
              images={ev.images}
              alt={ev.title}
              className="aspect-[4/3] self-start"
            />
            <div className="p-6 md:p-8">
              <p className="font-groovy text-sm uppercase tracking-[0.2em] text-terracotta">
                {formatEventDate(date)} · {formatEventTime(date)}
              </p>
              <h3 className="mt-2 font-display text-3xl text-espresso">
                {ev.title}
              </h3>
              <p className="mt-3 text-espresso/80">{ev.description}</p>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}

export function Events() {
  const data = useQuery(api.events.list) as EventDoc[] | undefined;
  const [tab, setTab] = useState<"events" | "calendar">("events");
  const [selected, setSelected] = useState<EventDoc | null>(null);

  const events = data ?? [];

  return (
    <PageWrapper>
      {/* Hero banner - half the viewport */}
      <section className="relative flex h-[50vh] min-h-[360px] items-center justify-center overflow-hidden">
        <img
          src="/images/artworkheadon.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-espresso/70 via-maroon/45 to-espresso/80" />
        <motion.h1
          initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative px-6 text-center font-display text-6xl text-cream drop-shadow-[0_4px_24px_rgba(0,0,0,0.4)] md:text-8xl"
        >
          Events
        </motion.h1>
      </section>

      {/* Content */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          {/* Toggle */}
          <div className="mb-10 flex justify-end">
            <div className="inline-flex rounded-xl border-2 border-brick/25 bg-cream p-1">
              <button
                type="button"
                onClick={() => setTab("events")}
                className={`rounded-lg px-5 py-2 font-semibold transition-colors ${
                  tab === "events"
                    ? "bg-cream-deep text-brick shadow-sm"
                    : "text-espresso/70 hover:text-espresso"
                }`}
              >
                Upcoming Events
              </button>
              <button
                type="button"
                onClick={() => setTab("calendar")}
                className={`rounded-lg px-5 py-2 font-semibold transition-colors ${
                  tab === "calendar"
                    ? "bg-cream-deep text-brick shadow-sm"
                    : "text-espresso/70 hover:text-espresso"
                }`}
              >
                Calendar
              </button>
            </div>
          </div>

          {data === undefined ? (
            <p className="text-center text-espresso/60">Loading events…</p>
          ) : tab === "events" ? (
            <UpcomingEvents events={events} />
          ) : (
            <Calendar events={events} onSelect={setSelected} />
          )}
        </div>
      </section>

      <AnimatePresence>
        {selected && (
          <EventModal event={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
