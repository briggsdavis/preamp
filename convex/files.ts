import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./admin";

/**
 * File storage helpers used by the admin for menu images, menu PDFs, and
 * pop-up media. The browser uploads directly to the returned URL, then we
 * persist the resulting `storageId` on the relevant document.
 *
 * Docs: https://docs.convex.dev/file-storage/upload-files
 */

/** Admin-only: get a short-lived URL to POST a file to. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Public: resolve a storageId to a served URL (used to render uploaded media). */
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});
