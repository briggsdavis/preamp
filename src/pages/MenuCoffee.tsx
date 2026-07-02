import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import { MenuPage } from "@/components/menu/MenuPage";
import { toMenuSections } from "@/lib/menuAdapt";

export function MenuCoffee() {
  const data = useQuery(api.menu.getMenu, { menu: "coffee" });
  return (
    <MenuPage
      kicker="From the bar"
      title="Coffee"
      sections={toMenuSections(data?.sections)}
      loading={data === undefined}
      pdf={data?.pdf ?? null}
      reviewsEnabled
      orderEnabled
    />
  );
}
