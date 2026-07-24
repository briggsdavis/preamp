import { api } from "@convex/_generated/api"
import { useQuery } from "convex/react"
import { useParams } from "react-router"
import { MenuPage } from "@/components/menu/menu-page"
import { toMenuSections } from "@/lib/menu-adapt"

export function MenuCoffee() {
  const { slug } = useParams<{ slug?: string }>()
  const data = useQuery(api.menu.getMenu, { menu: "coffee" })
  return (
    <MenuPage
      kicker="From the bar"
      title="Coffee"
      menuKind="coffee"
      openSlug={slug}
      sections={toMenuSections(data?.sections)}
      loading={data === undefined}
      pdf={data?.pdf ?? null}
      reviewsEnabled
      orderEnabled
    />
  )
}
