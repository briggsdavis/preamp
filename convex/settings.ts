import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import type { MutationCtx, QueryCtx } from "./_generated/server"
import { requireAdmin } from "./admin"

/**
 * Global site settings: a single row of on/off switches the admin controls.
 *
 * The table holds at most one document. Reads default any missing field to its
 * "on" value, so an empty table behaves as everything enabled. Writes upsert
 * that single row.
 */

/** The pages that can be toggled on/off. Each maps to a `<page>Enabled` field. */
const PAGE = v.union(
  v.literal("merch"),
  v.literal("about"),
  v.literal("coffee"),
  v.literal("food"),
  v.literal("events"),
  v.literal("coldBrew"),
  v.literal("hiring"),
  v.literal("giftCard"),
)

/** Fetch the singleton settings row, if it exists. */
async function getRow(ctx: QueryCtx | MutationCtx) {
  return await ctx.db.query("siteSettings").first()
}

/**
 * Apply defaults to the raw row: every page defaults to enabled, so only an
 * explicit `false` hides it. Shared by the public and admin queries.
 */
function withDefaults(row: Awaited<ReturnType<typeof getRow>>) {
  return {
    merchEnabled: row?.merchEnabled !== false,
    aboutEnabled: row?.aboutEnabled !== false,
    coffeeEnabled: row?.coffeeEnabled !== false,
    foodEnabled: row?.foodEnabled !== false,
    eventsEnabled: row?.eventsEnabled !== false,
    coldBrewEnabled: row?.coldBrewEnabled !== false,
    hiringEnabled: row?.hiringEnabled !== false,
    giftCardEnabled: row?.giftCardEnabled !== false,
    menuQuizEnabled: row?.menuQuizEnabled === true,
  }
}

/** Public: the page-visibility settings the public site needs. */
export const getPublicSettings = query({
  args: {},
  handler: async (ctx) => {
    return withDefaults(await getRow(ctx))
  },
})

/** Admin: the full settings row (with defaults) for the settings editor. */
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    return withDefaults(await getRow(ctx))
  },
})

/** Admin: toggle a single page on/off, creating the row on first use. */
export const setPageEnabled = mutation({
  args: { page: PAGE, enabled: v.boolean() },
  handler: async (ctx, { page, enabled }) => {
    await requireAdmin(ctx)
    const patch = { [`${page}Enabled`]: enabled }
    const row = await getRow(ctx)
    if (row) {
      await ctx.db.patch(row._id, patch)
    } else {
      await ctx.db.insert("siteSettings", patch)
    }
  },
})
