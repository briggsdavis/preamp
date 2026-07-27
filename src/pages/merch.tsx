import { api } from "@convex/_generated/api"
import { useQuery } from "convex/react"
import { useMemo } from "react"
import { useParams } from "react-router"
import { MenuPage } from "@/components/menu/menu-page"
import type { MenuSection } from "@/data/menu"

/** Prominent in-store perk shown at the top of the merch page. */
function MerchPerkBanner() {
  return (
    <div className="mx-auto max-w-5xl border-y-2 border-gold/70 px-3 py-7 md:flex md:items-center md:justify-between md:gap-10 md:px-5 md:py-8">
      <div className="flex items-center gap-4">
        <span className="font-display text-5xl leading-none text-brick md:text-6xl">10%</span>
        <p className="font-groovy text-sm tracking-[0.3em] text-brick uppercase">
          Wear It,
          <br />
          Save It
        </p>
      </div>
      <p className="mt-5 max-w-2xl border-l-2 border-terracotta/35 pl-5 font-display text-2xl leading-snug text-espresso md:mt-0 md:text-3xl">
        Wear any Pre Amp merch in-store and take 10% off your order.
      </p>
    </div>
  )
}

export function Merch() {
  const { slug } = useParams()
  const sections = useQuery(api.merch.listPublic)
  const mappedSections = useMemo<MenuSection[]>(
    () =>
      (sections ?? []).map((section) => ({
        title: section.title,
        items: section.items.map((item) => {
          const images =
            item.images && item.images.length > 0
              ? item.images.map((image) => image.url).filter((url): url is string => !!url)
              : item.image
                ? [item.image]
                : ["/images/preampdecor.webp"]
          return {
            id: item._id,
            name: item.title,
            slug: item.slug,
            price: item.price,
            description: item.description,
            image: images[0] ?? "/images/preampdecor.webp",
            images,
            orderUrl: item.purchaseUrl,
            likes: 0,
            reviews: [],
          }
        }),
      })),
    [sections],
  )

  return (
    <MenuPage
      kicker="Take some home"
      title="Merch"
      routeBase="/retail"
      openSlug={slug}
      sections={mappedSections}
      banner={<MerchPerkBanner />}
      loading={sections === undefined}
      orderEnabled
      orderLabel="Buy Now"
      emptyMessage="The merch is being updated. Check back soon!"
    />
  )
}
