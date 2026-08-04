import { ChevronDown } from "lucide-react"
import type { FaqItem } from "@/data/faq"

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y-2 divide-sand border-y-2 border-sand">
      {items.map((item) => (
        <details key={item.question} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-left marker:content-none">
            <span className="font-display text-2xl leading-tight text-espresso md:text-3xl">
              {item.question}
            </span>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-terracotta text-cream transition-transform group-open:rotate-180">
              <ChevronDown className="size-5" aria-hidden="true" />
            </span>
          </summary>
          <p className="max-w-3xl pr-16 pb-6 text-base leading-relaxed text-espresso/75 md:text-lg">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  )
}
