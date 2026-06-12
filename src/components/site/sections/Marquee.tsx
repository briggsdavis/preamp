const ITEMS = [
  "Passenger Coffee",
  "★",
  "Vinyl All Day",
  "★",
  "Espresso · Pourover · Cold Brew",
  "★",
  "Focaccia Sandwiches",
  "★",
  "Squirrel Hill, PGH",
  "★",
];

/** Endless retro ticker tape that scrolls horizontally. */
export function Marquee() {
  const line = [...ITEMS, ...ITEMS];
  return (
    <div className="overflow-hidden border-y-2 border-espresso bg-terracotta py-3">
      <div className="animate-marquee flex w-max gap-8 whitespace-nowrap">
        {line.map((item, i) => (
          <span
            key={i}
            className="font-groovy text-lg uppercase tracking-[0.2em] text-cream"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
