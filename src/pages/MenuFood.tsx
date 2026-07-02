import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import { MenuPage } from "@/components/menu/MenuPage";
import { toMenuSections } from "@/lib/menuAdapt";

export function MenuFood() {
  const data = useQuery(api.menu.getMenu, { menu: "food" });
  return (
    <MenuPage
      kicker="From the kitchen"
      title="Food"
      sections={toMenuSections(data?.sections)}
      loading={data === undefined}
      pdf={data?.pdf ?? null}
      reviewsEnabled
      orderEnabled
    />
  );
}
