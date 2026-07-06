import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./admin";

/**
 * Global site settings: a single row of on/off switches the admin controls.
 *
 * The table holds at most one document. Reads default any missing field to its
 * "on" value, so an empty table behaves as everything enabled. Writes upsert
 * that single row.
 */

/** Fetch the singleton settings row, if it exists. */
async function getRow(ctx: QueryCtx | MutationCtx) {
  return await ctx.db.query("siteSettings").first();
}

/** Public: the settings the public site needs, with defaults applied. */
export const getPublicSettings = query({
  args: {},
  handler: async (ctx) => {
    const row = await getRow(ctx);
    return {
      // Default on: only an explicit `false` hides the Merch page.
      merchEnabled: row?.merchEnabled !== false,
    };
  },
});

/** Admin: the full settings row (with defaults) for the settings editor. */
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const row = await getRow(ctx);
    return {
      merchEnabled: row?.merchEnabled !== false,
    };
  },
});

/** Admin: toggle the Merch page on/off, creating the row on first use. */
export const setMerchEnabled = mutation({
  args: { enabled: v.boolean() },
  handler: async (ctx, { enabled }) => {
    await requireAdmin(ctx);
    const row = await getRow(ctx);
    if (row) {
      await ctx.db.patch(row._id, { merchEnabled: enabled });
    } else {
      await ctx.db.insert("siteSettings", { merchEnabled: enabled });
    }
  },
});
