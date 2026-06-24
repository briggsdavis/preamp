import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./admin";
import { menuKind } from "./schema";
import { COFFEE_SEED, FOOD_SEED, type SeedSection } from "./seedData";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

/**
 * Menu data: one public read endpoint (used by both the live site and the
 * admin), plus admin-only mutations for sections, items, and the menu PDF.
 */

/** Resolve a menu item's image to a servable URL (uploaded file or seed path). */
async function itemImageUrl(
  ctx: { storage: { getUrl: (id: Id<"_storage">) => Promise<string | null> } },
  item: Doc<"menuItems">,
): Promise<string | null> {
  if (item.imageStorageId) {
    return await ctx.storage.getUrl(item.imageStorageId);
  }
  return item.image ?? null;
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
            imageUrl: await itemImageUrl(ctx, item),
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
  imageStorageId: v.optional(v.id("_storage")),
  image: v.optional(v.string()),
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
      imageStorageId: args.imageStorageId,
      image: args.image,
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
    // When a new image is uploaded, drop the old seed path so it doesn't win.
    const patch: Record<string, unknown> = { ...fields };
    if (fields.imageStorageId) patch.image = undefined;
    await ctx.db.patch(itemId, patch);
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
        image: item.image,
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
