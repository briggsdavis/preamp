import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { requireAdmin } from "./admin";

/**
 * Dietary tag catalog. A curated set of built-in tags is seeded on first use;
 * admins can also add custom tags with their own label, emoji icon, and color.
 * Menu items reference tags by `key` (see menuItems.dietaryTags).
 */

/** The curated built-ins, seeded once. Keys are stable and never change. */
const BUILTINS: { key: string; label: string; icon: string; color: string }[] =
  [
    { key: "vegan", label: "Vegan", icon: "🌱", color: "#4a7c4e" },
    { key: "vegetarian", label: "Vegetarian", icon: "🥬", color: "#6a9a3f" },
    { key: "gluten-free", label: "Gluten-Free", icon: "🌾", color: "#b5852f" },
    { key: "dairy-free", label: "Dairy-Free", icon: "🥛", color: "#7d9bb5" },
    { key: "nut-free", label: "Nut-Free", icon: "🥜", color: "#a6653f" },
    { key: "decaf", label: "Decaf", icon: "🌙", color: "#4a5a6b" },
    {
      key: "contains-caffeine",
      label: "Contains Caffeine",
      icon: "☕",
      color: "#6b4a2f",
    },
    { key: "spicy", label: "Spicy", icon: "🌶️", color: "#b5432f" },
  ];

function slugifyKey(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "tag"
  );
}

/** Ensure the built-in tags exist. Idempotent; safe to call repeatedly. */
async function ensureSeeded(ctx: MutationCtx) {
  for (let i = 0; i < BUILTINS.length; i++) {
    const b = BUILTINS[i];
    const existing = await ctx.db
      .query("dietaryTags")
      .withIndex("by_key", (q) => q.eq("key", b.key))
      .unique();
    if (!existing) {
      await ctx.db.insert("dietaryTags", { ...b, builtin: true, order: i });
    }
  }
}

/** Public: the full tag catalog, ordered. Read by the menu + admin UIs. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("dietaryTags").collect();
    rows.sort((a, b) => a.order - b.order);
    return rows;
  },
});

/**
 * Admin: seed the built-in tags if the catalog is empty. Idempotent — no-ops
 * once built-ins exist. The Menu manager calls this so the picker is populated.
 */
export const seedBuiltins = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    await ensureSeeded(ctx);
    return { ok: true };
  },
});

export const create = mutation({
  args: {
    label: v.string(),
    icon: v.string(),
    color: v.string(),
  },
  handler: async (ctx, { label, icon, color }) => {
    await requireAdmin(ctx);
    const clean = label.trim();
    if (!clean) throw new ConvexError("Tag label is required.");
    const key = slugifyKey(clean);
    const existing = await ctx.db
      .query("dietaryTags")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (existing) {
      throw new ConvexError(`A tag like "${clean}" already exists.`);
    }
    const all = await ctx.db.query("dietaryTags").collect();
    const order = all.reduce((max, t) => Math.max(max, t.order), -1) + 1;
    return await ctx.db.insert("dietaryTags", {
      key,
      label: clean,
      icon: icon.trim().slice(0, 8) || "🏷️",
      color: color.trim() || "#6b4a2f",
      builtin: false,
      order,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("dietaryTags"),
    label: v.string(),
    icon: v.string(),
    color: v.string(),
  },
  handler: async (ctx, { id, label, icon, color }) => {
    await requireAdmin(ctx);
    const clean = label.trim();
    if (!clean) throw new ConvexError("Tag label is required.");
    // Key stays stable so items keep their references; only display fields change.
    await ctx.db.patch(id, {
      label: clean,
      icon: icon.trim().slice(0, 8) || "🏷️",
      color: color.trim() || "#6b4a2f",
    });
  },
});

export const remove = mutation({
  args: { id: v.id("dietaryTags") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const tag = await ctx.db.get(id);
    if (!tag) return;
    // Drop the tag from any items that reference it, then delete it.
    const items = await ctx.db.query("menuItems").collect();
    for (const item of items) {
      if (item.dietaryTags?.includes(tag.key)) {
        await ctx.db.patch(item._id, {
          dietaryTags: item.dietaryTags.filter((k) => k !== tag.key),
        });
      }
    }
    await ctx.db.delete(id);
  },
});
