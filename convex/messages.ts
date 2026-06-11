import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Example query + mutation demonstrating the recommended pattern:
 * authenticate the caller, then read/write user-scoped data.
 *
 * Docs: https://docs.convex.dev/functions
 */

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }
    return await ctx.db
      .query("messages")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .order("desc")
      .collect();
  },
});

export const send = mutation({
  args: { body: v.string() },
  handler: async (ctx, { body }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not signed in");
    }
    return await ctx.db.insert("messages", { authorId: userId, body });
  },
});
