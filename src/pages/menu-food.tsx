import { api } from "@convex/_generated/api"
import { useQuery } from "convex/react"
import { useParams } from "react-router"
import { MenuPage } from "@/components/menu/menu-page"
import { toMenuSections } from "@/lib/menu-adapt"

export function MenuFood() {
  const { slug } = useParams<{ slug?: string }>()
  const data = useQuery(api.menu.getMenu, { menu: "food" })
  return (
    <MenuPage
      kicker="From the kitchen"
      title="Food"
      menuKind="food"
      openSlug={slug}
      sections={toMenuSections(data?.sections)}
      loading={data === undefined}
      pdf={data?.pdf ?? null}
      reviewsEnabled
      orderEnabled
    />
  )
}
