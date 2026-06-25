import { useState } from "react";
import { motion } from "framer-motion";

import { PageWrapper } from "@/components/site/PageWrapper";

/** Placeholder upcoming events - newest/soonest first. Swap for real data. */
interface EventItem {
  title: string;
  date: Date;
  description: string;
  image: string;
}

const EVENTS: EventItem[] = [
  {
    title: "Vinyl Night: Soul & Funk",
    date: new Date(2026, 5, 27, 19, 0),
    description:
      "Crate-diggers welcome. We're spinning soul and funk all night with a guest selector behind the bar, so pull up a stool and stay a while.",
    image: "/images/eventvinyls.jpg",
  },
  {
    title: "Single-Origin Cupping",
    date: new Date(2026, 6, 4, 10, 0),
    description:
      "A guided tasting through our latest rotating origins. Learn to taste like the bar does, and take home a bag of your favorite.",
    image: "/images/eventbeans.jpg",
  },
  {
    title: "Live Set: Late Night Listening",
    date: new Date(2026, 6, 11, 20, 0),
    description:
      "An intimate after-hours listening session on the big speakers. Limited seating, espresso martinis, and ambient grooves.",
    image: "/images/eventspeakers.jpg",
  },
];

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

/** Month-grid calendar styled to match the brand. Highlights today. */
function Calendar() {
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

  const goToday = () =>
    setView(new Date(today.getFullYear(), today.getMonth(), 1));
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
          <button
            type="button"
            onClick={goToday}
            className="rounded-lg bg-orange/55 px-5 py-2.5 font-semibold text-cream transition-colors hover:bg-orange/75"
          >
            today
          </button>
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
        {/* Weekday header */}
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

        {/* Date cells */}
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const inMonth = d.getMonth() === month;
            const isToday = sameDay(d, today);
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** List of upcoming events - image left, details right. Soonest first. */
function UpcomingEvents() {
  const sorted = [...EVENTS].sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="space-y-8">
      {sorted.map((ev, i) => (
        <motion.article
          key={ev.title}
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: i * 0.05 }}
          className="grid gap-6 overflow-hidden rounded-2xl border-2 border-sand bg-cream shadow-lg shadow-maroon/10 sm:grid-cols-[260px_1fr]"
        >
          <div className="h-48 sm:h-full">
            <img
              src={ev.image}
              alt={ev.title}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="p-6 md:p-8">
            <p className="font-groovy text-sm uppercase tracking-[0.2em] text-terracotta">
              {formatEventDate(ev.date)} · {formatEventTime(ev.date)}
            </p>
            <h3 className="mt-2 font-display text-3xl text-espresso">
              {ev.title}
            </h3>
            <p className="mt-3 text-espresso/80">{ev.description}</p>
          </div>
        </motion.article>
      ))}
    </div>
  );
}

export function Events() {
  const [tab, setTab] = useState<"events" | "calendar">("events");

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

          {tab === "events" ? <UpcomingEvents /> : <Calendar />}
        </div>
      </section>
    </PageWrapper>
  );
}
