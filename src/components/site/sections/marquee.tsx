import { EditableText } from "@/components/cms/inline-editing"
import { Reveal } from "@/components/site/reveal"
import { useHomeContent } from "@/lib/site-content"

/** Endless retro ticker tape that scrolls horizontally. */
export function Marquee() {
  const items = useHomeContent().marquee.items.flatMap((item, index) => [
    { text: item, index },
    { text: "★", index: -1 },
  ])
  const line = [...items, ...items]
  return (
    <Reveal y={0}>
      <div className="overflow-hidden border-y-2 border-gold bg-terracotta py-3">
        <div className="animate-marquee flex w-max gap-8 whitespace-nowrap">
          {line.map((item, i) => (
            <span key={i} className="font-groovy text-lg tracking-[0.2em] text-cream uppercase">
              {item.index >= 0 ? (
                <EditableText path={`marquee.items.${item.index}`} value={item.text} />
              ) : (
                item.text
              )}
            </span>
          ))}
        </div>
      </div>
    </Reveal>
  )
}
