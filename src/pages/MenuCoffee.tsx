import { useQuery } from "convex/react";
import { useParams } from "react-router-dom";
import { api } from "@convex/_generated/api";

import { MenuPage } from "@/components/menu/MenuPage";
import { toMenuSections } from "@/lib/menuAdapt";

export function MenuCoffee() {
  const { slug } = useParams<{ slug?: string }>();
  const data = useQuery(api.menu.getMenu, { menu: "coffee" });
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
  );
}
