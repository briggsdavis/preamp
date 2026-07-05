import { useQuery } from "convex/react";
import { useParams } from "react-router-dom";
import { api } from "@convex/_generated/api";

import { MenuPage } from "@/components/menu/MenuPage";
import { toMenuSections } from "@/lib/menuAdapt";

export function MenuFood() {
  const { slug } = useParams<{ slug?: string }>();
  const data = useQuery(api.menu.getMenu, { menu: "food" });
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
  );
}
