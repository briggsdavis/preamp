import type { MenuSection, Review } from "@/data/menu";

/**
 * Adapt the Convex `getMenu` payload into the `MenuSection[]` shape the public
 * MenuPage renders. Falls back to a decor image when an item has no picture.
 */

type ConvexItem = {
  _id: string;
  name: string;
  slug?: string;
  price: string;
  description: string;
  dietaryTags?: string[];
  orderUrl?: string | null;
  images: { url: string | null }[];
  likes: number;
  reviews: Review[];
};

type ConvexSection = {
  title: string;
  items: ConvexItem[];
};

const FALLBACK_IMAGE = "/images/preampdecor.jpg";

export function toMenuSections(
  sections: ConvexSection[] | undefined,
): MenuSection[] {
  if (!sections) return [];
  return sections.map((section) => ({
    title: section.title,
    items: section.items.map((item) => {
      const urls = item.images
        .map((img) => img.url)
        .filter((u): u is string => !!u);
      return {
        id: item._id,
        name: item.name,
        slug: item.slug,
        price: item.price,
        description: item.description,
        dietaryTags: item.dietaryTags ?? [],
        orderUrl: item.orderUrl ?? null,
        image: urls[0] ?? FALLBACK_IMAGE,
        images: urls,
        likes: item.likes,
        reviews: item.reviews,
      };
    }),
  }));
}
