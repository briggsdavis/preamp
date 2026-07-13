import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import { MenuPage } from "@/components/menu/MenuPage";
import type { MenuSection } from "@/data/menu";

/** Prominent in-store perk shown at the top of the merch page. */
function MerchPerkBanner() {
  return (
    <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border-2 border-brick/30 bg-gradient-to-r from-gold/25 via-amber/20 to-terracotta/20 px-6 py-6 text-center shadow-lg shadow-maroon/10 md:px-10 md:py-7">
      <p className="font-groovy text-sm uppercase tracking-[0.3em] text-brick">
        Wear It, Save It
      </p>
      <p className="mt-2 font-display text-2xl leading-snug text-espresso md:text-3xl">
        Order in-store while wearing any Pre Amp merch and get{" "}
        <span className="text-brick">10% off</span> your order!
      </p>
    </div>
  );
}

export function Merch() {
  const { slug } = useParams();
  const sections = useQuery(api.merch.listPublic);
  const mappedSections = useMemo<MenuSection[]>(
    () =>
      (sections ?? []).map((section) => ({
        title: section.title,
        items: section.items.map((item) => ({
          id: item._id,
          name: item.title,
          slug: item.slug,
          price: item.price,
          description: item.description,
          image: item.image ?? "/images/preampdecor.webp",
          images: item.image ? [item.image] : ["/images/preampdecor.webp"],
          orderUrl: item.purchaseUrl,
          likes: 0,
          reviews: [],
        })),
      })),
    [sections],
  );

  return (
    <MenuPage
      kicker="Take some home"
      title="Merch"
      routeBase="/retail"
      openSlug={slug}
      sections={mappedSections}
      loading={sections === undefined}
      orderEnabled
      orderLabel="Buy Now"
      banner={<MerchPerkBanner />}
    />
  );
}
