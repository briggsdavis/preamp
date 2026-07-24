import { api } from "@convex/_generated/api"
import { useQuery } from "convex/react"
import { useMemo } from "react"
import { useParams } from "react-router"
import { MenuPage } from "@/components/menu/menu-page"
import type { MenuSection } from "@/data/menu"

/** Prominent in-store perk shown at the top of the merch page. */
function MerchPerkBanner() {
  return (
    <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border-2 border-brick/30 bg-gradient-to-r from-gold/25 via-amber/20 to-terracotta/20 px-6 py-6 text-center shadow-lg shadow-maroon/10 md:px-10 md:py-7">
      <p className="font-groovy text-sm tracking-[0.3em] text-brick uppercase">Wear It, Save It</p>
      <p className="mt-2 font-display text-2xl leading-snug text-espresso md:text-3xl">
        Order in-store while wearing any Pre Amp merch and get{" "}
        <span className="text-brick">10% off</span> your order!
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
    />
  )
}
