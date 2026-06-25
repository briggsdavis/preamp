import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./admin";
import { menuKind } from "./schema";
import { COFFEE_SEED, FOOD_SEED, type SeedSection } from "./seedData";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

/**
 * Menu data: one public read endpoint (used by both the live site and the
 * admin), plus admin-only mutations for sections, items, and the menu PDF.
 */

/**
 * Resolve a menu item's images to servable URLs (first = primary). Falls back
 * to the legacy single-image fields for rows created before multi-image.
 */
async function itemImages(
  ctx: QueryCtx,
  item: Doc<"menuItems">,
): Promise<{ url: string | null; storageId?: Id<"_storage">; path?: string }[]> {
  const refs =
    item.images && item.images.length > 0
      ? item.images
      : item.imageStorageId
        ? [{ storageId: item.imageStorageId }]
        : item.image
          ? [{ path: item.image }]
          : [];
  return await Promise.all(
    refs.map(async (ref) => ({
      url: ref.storageId
        ? await ctx.storage.getUrl(ref.storageId)
        : (ref.path ?? null),
      storageId: ref.storageId,
      path: ref.path,
    })),
  );
}

/**
 * Public: the full menu for one kind ("coffee" | "food"), grouped into
 * ordered sections with ordered items, plus the uploaded PDF (if any).
 */
export const getMenu = query({
  args: { menu: menuKind },
  handler: async (ctx, { menu }) => {
    const sections = await ctx.db
      .query("menuSections")
      .withIndex("by_menu", (q) => q.eq("menu", menu))
      .collect();
    sections.sort((a, b) => a.order - b.order);

    const items = await ctx.db
      .query("menuItems")
      .withIndex("by_menu", (q) => q.eq("menu", menu))
      .collect();
    items.sort((a, b) => a.order - b.order);

    const itemsBySection = new Map<string, typeof items>();
    for (const item of items) {
      const key = item.sectionId;
      const list = itemsBySection.get(key) ?? [];
      list.push(item);
      itemsBySection.set(key, list);
    }

    const sectionsOut = await Promise.all(
      sections.map(async (section) => ({
        _id: section._id,
        title: section.title,
        order: section.order,
        items: await Promise.all(
          (itemsBySection.get(section._id) ?? []).map(async (item) => ({
            _id: item._id,
            sectionId: item.sectionId,
            name: item.name,
            price: item.price,
            description: item.description,
            images: await itemImages(ctx, item),
            featured: item.featured ?? false,
            likes: item.likes,
            reviews: item.reviews,
            order: item.order,
          })),
        ),
      })),
    );

    const meta = await ctx.db
      .query("menuMeta")
      .withIndex("by_menu", (q) => q.eq("menu", menu))
      .unique();
    const pdfUrl = meta?.pdfStorageId
      ? await ctx.storage.getUrl(meta.pdfStorageId)
      : null;

    return {
      sections: sectionsOut,
      pdf: meta?.pdfStorageId
        ? { url: pdfUrl, name: meta.pdfName ?? "menu.pdf" }
        : null,
    };
  },
});

// --- Sections ---------------------------------------------------------------

export const createSection = mutation({
  args: { menu: menuKind, title: v.string() },
  handler: async (ctx, { menu, title }) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("menuSections")
      .withIndex("by_menu", (q) => q.eq("menu", menu))
      .collect();
    const order = existing.reduce((max, s) => Math.max(max, s.order), -1) + 1;
    return await ctx.db.insert("menuSections", { menu, title, order });
  },
});

export const renameSection = mutation({
  args: { sectionId: v.id("menuSections"), title: v.string() },
  handler: async (ctx, { sectionId, title }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(sectionId, { title });
  },
});

export const deleteSection = mutation({
  args: { sectionId: v.id("menuSections") },
  handler: async (ctx, { sectionId }) => {
    await requireAdmin(ctx);
    const items = await ctx.db
      .query("menuItems")
      .withIndex("by_section", (q) => q.eq("sectionId", sectionId))
      .collect();
    if (items.length > 0) {
      throw new Error(
        "Move or delete this section's items before deleting the section.",
      );
    }
    await ctx.db.delete(sectionId);
  },
});

/** Reorder sections by passing the full ordered list of section ids. */
export const reorderSections = mutation({
  args: { sectionIds: v.array(v.id("menuSections")) },
  handler: async (ctx, { sectionIds }) => {
    await requireAdmin(ctx);
    await Promise.all(
      sectionIds.map((id, index) => ctx.db.patch(id, { order: index })),
    );
  },
});

// --- Items ------------------------------------------------------------------

const itemFields = {
  name: v.string(),
  price: v.string(),
  description: v.string(),
  images: v.array(
    v.object({
      storageId: v.optional(v.id("_storage")),
      path: v.optional(v.string()),
    }),
  ),
};

export const createItem = mutation({
  args: { sectionId: v.id("menuSections"), ...itemFields },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const section = await ctx.db.get(args.sectionId);
    if (!section) throw new Error("Section not found.");
    const siblings = await ctx.db
      .query("menuItems")
      .withIndex("by_section", (q) => q.eq("sectionId", args.sectionId))
      .collect();
    const order = siblings.reduce((max, i) => Math.max(max, i.order), -1) + 1;
    return await ctx.db.insert("menuItems", {
      sectionId: args.sectionId,
      menu: section.menu,
      name: args.name,
      price: args.price,
      description: args.description,
      images: args.images,
      likes: 0,
      reviews: [],
      order,
    });
  },
});

export const updateItem = mutation({
  args: { itemId: v.id("menuItems"), ...itemFields },
  handler: async (ctx, { itemId, ...fields }) => {
    await requireAdmin(ctx);
    // Persist the images array and clear any legacy single-image fields.
    await ctx.db.patch(itemId, {
      ...fields,
      image: undefined,
      imageStorageId: undefined,
    });
  },
});

/** Move an item to a different section (within the same menu). */
export const moveItem = mutation({
  args: { itemId: v.id("menuItems"), sectionId: v.id("menuSections") },
  handler: async (ctx, { itemId, sectionId }) => {
    await requireAdmin(ctx);
    const section = await ctx.db.get(sectionId);
    if (!section) throw new Error("Target section not found.");
    const siblings = await ctx.db
      .query("menuItems")
      .withIndex("by_section", (q) => q.eq("sectionId", sectionId))
      .collect();
    const order = siblings.reduce((max, i) => Math.max(max, i.order), -1) + 1;
    await ctx.db.patch(itemId, { sectionId, menu: section.menu, order });
  },
});

export const deleteItem = mutation({
  args: { itemId: v.id("menuItems") },
  handler: async (ctx, { itemId }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(itemId);
  },
});

/** Toggle whether an item appears in the home-page "Best Sellers" carousel. */
export const setItemFeatured = mutation({
  args: { itemId: v.id("menuItems"), featured: v.boolean() },
  handler: async (ctx, { itemId, featured }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(itemId, { featured });
  },
});

/** Public: featured menu items (coffee + food) for the Best Sellers carousel. */
export const listFeatured = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("menuItems").collect();
    const featured = items.filter((item) => item.featured);
    return await Promise.all(
      featured.map(async (item) => {
        const imgs = await itemImages(ctx, item);
        return {
          _id: item._id,
          name: item.name,
          price: item.price,
          description: item.description,
          image: imgs[0]?.url ?? null,
        };
      }),
    );
  },
});

// --- Menu PDF ---------------------------------------------------------------

export const setMenuPdf = mutation({
  args: {
    menu: menuKind,
    pdfStorageId: v.id("_storage"),
    pdfName: v.string(),
  },
  handler: async (ctx, { menu, pdfStorageId, pdfName }) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("menuMeta")
      .withIndex("by_menu", (q) => q.eq("menu", menu))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { pdfStorageId, pdfName });
    } else {
      await ctx.db.insert("menuMeta", { menu, pdfStorageId, pdfName });
    }
  },
});

export const removeMenuPdf = mutation({
  args: { menu: menuKind },
  handler: async (ctx, { menu }) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("menuMeta")
      .withIndex("by_menu", (q) => q.eq("menu", menu))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        pdfStorageId: undefined,
        pdfName: undefined,
      });
    }
  },
});

// --- Seed -------------------------------------------------------------------

async function seedMenu(
  ctx: MutationCtx,
  menu: "coffee" | "food",
  sections: SeedSection[],
) {
  for (let s = 0; s < sections.length; s++) {
    const section = sections[s];
    const sectionId = await ctx.db.insert("menuSections", {
      menu,
      title: section.title,
      order: s,
    });
    for (let i = 0; i < section.items.length; i++) {
      const item = section.items[i];
      await ctx.db.insert("menuItems", {
        sectionId,
        menu,
        name: item.name,
        price: item.price,
        description: item.description,
        images: [{ path: item.image }],
        likes: item.likes,
        reviews: item.reviews,
        order: i,
      });
    }
  }
}

/**
 * Admin-only, idempotent seed. Populates the menu from the original static
 * data the first time it's run; does nothing if any sections already exist.
 */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.query("menuSections").first();
    if (existing) {
      return { seeded: false, reason: "Menu already has data." };
    }
    await seedMenu(ctx, "coffee", COFFEE_SEED);
    await seedMenu(ctx, "food", FOOD_SEED);
    return { seeded: true };
  },
});
