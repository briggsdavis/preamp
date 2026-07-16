import { Reveal } from "@/components/site/Reveal";
import { useHomeContent } from "@/lib/siteContent";

/** Endless retro ticker tape that scrolls horizontally. */
export function Marquee() {
  const items = useHomeContent().marquee.items.flatMap((item) => [item, "★"]);
  const line = [...items, ...items];
  return (
    <Reveal y={0}>
      <div className="overflow-hidden border-y-2 border-gold bg-terracotta py-3">
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
    </Reveal>
  );
}
