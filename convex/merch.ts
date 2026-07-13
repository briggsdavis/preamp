import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./admin";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

type MerchImage = {
  storageId?: Id<"_storage">;
  path?: string;
};

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "item"
  );
}

async function uniqueSlug(
  ctx: MutationCtx,
  title: string,
  excludeId?: Id<"merchItems">,
): Promise<string> {
  const base = slugify(title);
  const items = await ctx.db.query("merchItems").collect();
  const taken = new Set(
    items
      .filter((item) => item._id !== excludeId && item.slug)
      .map((item) => item.slug as string),
  );
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

async function imageUrl(
  ctx: QueryCtx,
  image?: MerchImage,
): Promise<string | null> {
  if (!image) return null;
  if (image.storageId) return await ctx.storage.getUrl(image.storageId);
  return image.path ?? null;
}

async function publicItem(ctx: QueryCtx, item: Doc<"merchItems">) {
  return {
    _id: item._id,
    sectionId: item.sectionId,
    title: item.title,
    slug: item.slug ?? slugify(item.title),
    price: item.price,
    description: item.description,
    purchaseUrl: item.purchaseUrl,
    image: await imageUrl(ctx, item.image),
    imageRef: item.image,
    archived: item.archived ?? false,
    order: item.order,
  };
}

export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const sections = await ctx.db.query("merchSections").collect();
    sections.sort((a, b) => a.order - b.order);

    const items = (await ctx.db.query("merchItems").collect())
      .filter((item) => !item.archived)
      .sort((a, b) => a.order - b.order);

    const itemsBySection = new Map<string, typeof items>();
    for (const item of items) {
      const list = itemsBySection.get(item.sectionId) ?? [];
      list.push(item);
      itemsBySection.set(item.sectionId, list);
    }

    const out = await Promise.all(
      sections.map(async (section) => ({
        _id: section._id,
        title: section.title,
        order: section.order,
        items: await Promise.all(
          (itemsBySection.get(section._id) ?? []).map((item) =>
            publicItem(ctx, item),
          ),
        ),
      })),
    );

    return out.filter((section) => section.items.length > 0);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const items = await ctx.db.query("merchItems").collect();
    const item =
      items.find((row) => row.slug === slug) ??
      items.find((row) => slugify(row.title) === slug);
    if (!item || item.archived) return null;
    const section = await ctx.db.get(item.sectionId);
    return {
      ...(await publicItem(ctx, item)),
      sectionTitle: section?.title ?? null,
    };
  },
});

export const adminList = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const sections = await ctx.db.query("merchSections").collect();
    sections.sort((a, b) => a.order - b.order);
    const items = (await ctx.db.query("merchItems").collect()).sort(
      (a, b) => a.order - b.order,
    );

    const itemsBySection = new Map<string, typeof items>();
    for (const item of items) {
      const list = itemsBySection.get(item.sectionId) ?? [];
      list.push(item);
      itemsBySection.set(item.sectionId, list);
    }

    return await Promise.all(
      sections.map(async (section) => ({
        _id: section._id,
        title: section.title,
        order: section.order,
        items: await Promise.all(
          (itemsBySection.get(section._id) ?? []).map((item) =>
            publicItem(ctx, item),
          ),
        ),
      })),
    );
  },
});

export const createSection = mutation({
  args: { title: v.string() },
  handler: async (ctx, { title }) => {
    await requireAdmin(ctx);
    const sections = await ctx.db.query("merchSections").collect();
    const order = sections.reduce((max, s) => Math.max(max, s.order), -1) + 1;
    return await ctx.db.insert("merchSections", { title, order });
  },
});

export const renameSection = mutation({
  args: { sectionId: v.id("merchSections"), title: v.string() },
  handler: async (ctx, { sectionId, title }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(sectionId, { title });
  },
});

export const deleteSection = mutation({
  args: { sectionId: v.id("merchSections") },
  handler: async (ctx, { sectionId }) => {
    await requireAdmin(ctx);
    const items = await ctx.db
      .query("merchItems")
      .withIndex("by_section", (q) => q.eq("sectionId", sectionId))
      .collect();
    if (items.length > 0) {
      throw new Error(
        "Move or delete this section's merch before deleting the section.",
      );
    }
    await ctx.db.delete(sectionId);
  },
});

export const reorderSections = mutation({
  args: { sectionIds: v.array(v.id("merchSections")) },
  handler: async (ctx, { sectionIds }) => {
    await requireAdmin(ctx);
    await Promise.all(
      sectionIds.map((id, index) => ctx.db.patch(id, { order: index })),
    );
  },
});

const itemFields = {
  title: v.string(),
  price: v.string(),
  description: v.string(),
  purchaseUrl: v.string(),
  image: v.optional(
    v.object({
      storageId: v.optional(v.id("_storage")),
      path: v.optional(v.string()),
    }),
  ),
};

export const createItem = mutation({
  args: { sectionId: v.id("merchSections"), ...itemFields },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const section = await ctx.db.get(args.sectionId);
    if (!section) throw new Error("Section not found.");
    const siblings = await ctx.db
      .query("merchItems")
      .withIndex("by_section", (q) => q.eq("sectionId", args.sectionId))
      .collect();
    const order = siblings.reduce((max, item) => Math.max(max, item.order), -1) + 1;
    return await ctx.db.insert("merchItems", {
      ...args,
      slug: await uniqueSlug(ctx, args.title),
      archived: false,
      order,
    });
  },
});

export const updateItem = mutation({
  args: { itemId: v.id("merchItems"), ...itemFields },
  handler: async (ctx, { itemId, ...fields }) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get(itemId);
    const slug =
      existing?.slug ??
      (existing ? await uniqueSlug(ctx, fields.title, itemId) : undefined);
    await ctx.db.patch(itemId, {
      ...fields,
      ...(slug ? { slug } : {}),
    });
  },
});

export const moveItem = mutation({
  args: { itemId: v.id("merchItems"), sectionId: v.id("merchSections") },
  handler: async (ctx, { itemId, sectionId }) => {
    await requireAdmin(ctx);
    const section = await ctx.db.get(sectionId);
    if (!section) throw new Error("Target section not found.");
    const siblings = await ctx.db
      .query("merchItems")
      .withIndex("by_section", (q) => q.eq("sectionId", sectionId))
      .collect();
    const order = siblings.reduce((max, item) => Math.max(max, item.order), -1) + 1;
    await ctx.db.patch(itemId, { sectionId, order });
  },
});

export const setArchived = mutation({
  args: { itemId: v.id("merchItems"), archived: v.boolean() },
  handler: async (ctx, { itemId, archived }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(itemId, { archived });
  },
});

export const deleteItem = mutation({
  args: { itemId: v.id("merchItems") },
  handler: async (ctx, { itemId }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(itemId);
  },
});
