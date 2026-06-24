import type { MenuSection, Review } from "@/data/menu";

/**
 * Adapt the Convex `getMenu` payload into the `MenuSection[]` shape the public
 * MenuPage renders. Falls back to a decor image when an item has no picture.
 */

type ConvexItem = {
  _id: string;
  name: string;
  price: string;
  description: string;
  imageUrl: string | null;
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
    items: section.items.map((item) => ({
      id: item._id,
      name: item.name,
      price: item.price,
      description: item.description,
      image: item.imageUrl ?? FALLBACK_IMAGE,
      likes: item.likes,
      reviews: item.reviews,
    })),
  }));
}
