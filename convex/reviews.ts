import { v, ConvexError } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireAdmin } from "./admin"

/**
 * Reviews: visitor-submitted, admin-moderated.
 *
 * Lifecycle: a submission starts as `pending` (hidden), the admin `approved`s
 * it (then it shows on the menu item), or `archived`s it (hidden but kept).
 * A subset of approved reviews can be `featured` on the home page (max 5).
 */

const MAX_FEATURED = 5

const reviewStatus = v.union(v.literal("pending"), v.literal("approved"), v.literal("archived"))

// --- Public -----------------------------------------------------------------

/** Public: submit a review (starts pending, hidden until approved). */
export const submit = mutation({
  args: {
    menuItemId: v.optional(v.id("menuItems")),
    menuItemName: v.optional(v.string()),
    name: v.string(),
    rating: v.number(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const rating = Math.max(1, Math.min(5, Math.round(args.rating)))
    return await ctx.db.insert("reviews", {
      menuItemId: args.menuItemId,
      menuItemName: args.menuItemName,
      name: args.name,
      rating,
      text: args.text,
      status: "pending",
      featured: false,
    })
  },
})

/** Public: approved reviews for a given menu item, newest first. */
export const listApprovedForItem = query({
  args: { menuItemId: v.id("menuItems") },
  handler: async (ctx, { menuItemId }) => {
    const rows = await ctx.db
      .query("reviews")
      .withIndex("by_menuItem", (q) => q.eq("menuItemId", menuItemId))
      .collect()
    return rows
      .filter((r) => r.status === "approved")
      .sort((a, b) => b._creationTime - a._creationTime)
      .map((r) => ({ name: r.name, rating: r.rating, text: r.text }))
  },
})

/** Public: featured reviews for the home page (approved + featured). */
export const listFeatured = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("reviews")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .collect()
    return rows
      .filter((r) => r.status === "approved")
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, MAX_FEATURED)
      .map((r) => ({
        name: r.name,
        rating: r.rating,
        text: r.text,
        menuItemName: r.menuItemName ?? null,
      }))
  },
})

// --- Admin ------------------------------------------------------------------

/** Admin: every review (client filters/sorts). */
export const adminList = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const rows = await ctx.db.query("reviews").order("desc").collect()
    return rows
  },
})

/** Admin: headline review counts for the dashboard, sidebar badge, and header. */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const rows = await ctx.db.query("reviews").collect()
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    let pending = 0
    let approved = 0
    let archived = 0
    let newThisWeek = 0
    for (const r of rows) {
      if (r.status === "pending") pending++
      else if (r.status === "approved") approved++
      else if (r.status === "archived") archived++
      if (r._creationTime >= weekAgo) newThisWeek++
    }
    return { total: rows.length, pending, approved, archived, newThisWeek }
  },
})

export const setStatus = mutation({
  args: { id: v.id("reviews"), status: reviewStatus },
  handler: async (ctx, { id, status }) => {
    await requireAdmin(ctx)
    // A review that isn't approved can't stay featured.
    const patch: { status: typeof status; featured?: boolean } = { status }
    if (status !== "approved") patch.featured = false
    await ctx.db.patch(id, patch)
  },
})

export const setFeatured = mutation({
  args: { id: v.id("reviews"), featured: v.boolean() },
  handler: async (ctx, { id, featured }) => {
    await requireAdmin(ctx)
    const review = await ctx.db.get(id)
    if (!review) throw new ConvexError("Review not found.")
    if (featured) {
      if (review.status !== "approved") {
        throw new ConvexError("Approve the review before featuring it.")
      }
      const featuredCount = (
        await ctx.db
          .query("reviews")
          .withIndex("by_featured", (q) => q.eq("featured", true))
          .collect()
      ).length
      if (featuredCount >= MAX_FEATURED) {
        throw new ConvexError(
          `You can feature up to ${MAX_FEATURED} reviews on the home page. Unfeature one first.`,
        )
      }
    }
    await ctx.db.patch(id, { featured })
  },
})

export const remove = mutation({
  args: { id: v.id("reviews") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx)
    await ctx.db.delete(id)
  },
})

/**
 * Admin-only, idempotent migration of the original embedded menu-item reviews
 * into the reviews table as `approved`. No-ops if any reviews already exist.
 */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const existing = await ctx.db.query("reviews").first()
    if (existing) return { seeded: false, reason: "Reviews already exist." }

    const items = await ctx.db.query("menuItems").collect()
    let count = 0
    for (const item of items) {
      for (const review of item.reviews) {
        await ctx.db.insert("reviews", {
          menuItemId: item._id,
          menuItemName: item.name,
          name: review.name,
          rating: review.rating,
          text: review.text,
          status: "approved",
          featured: false,
        })
        count++
      }
    }
    return { seeded: true, count }
  },
})
