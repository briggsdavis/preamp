import { useQuery } from "convex/react";
import { Navigate, useParams } from "react-router-dom";
import { api } from "@convex/_generated/api";

import { MenuPage } from "@/components/menu/MenuPage";
import { toMenuSections } from "@/lib/menuAdapt";

export function MenuDynamic() {
  const { menuSlug, slug } = useParams<{
    menuSlug?: string;
    slug?: string;
  }>();
  const menu = menuSlug ?? "coffee";
  const data = useQuery(api.menu.getMenu, { menu });

  if (data && !data.page) return <Navigate to="/" replace />;

  return (
    <MenuPage
      kicker={data?.page?.eyebrow ?? ""}
      title={data?.page?.title ?? ""}
      menuKind={menu}
      openSlug={slug}
      sections={toMenuSections(data?.sections)}
      loading={data === undefined}
      pdf={data?.pdf ?? null}
      reviewsEnabled
      orderEnabled
    />
  );
}
