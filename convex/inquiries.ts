import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./admin";

/**
 * Inquiry inboxes. Submissions come from the public site (no auth); reading
 * them is admin-only. Three streams: contact form, hiring applications, and
 * pop-up email captures.
 */

// --- Contact form -----------------------------------------------------------

export const submitContact = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("contactSubmissions", args);
  },
});

export const listContact = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("contactSubmissions").order("desc").collect();
    return rows;
  },
});

export const deleteContact = mutation({
  args: { id: v.id("contactSubmissions") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});

// --- Hiring applications -----------------------------------------------------

export const submitHiring = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    city: v.string(),
    state: v.string(),
    position: v.string(),
    desiredSalary: v.string(),
    hoursDesired: v.string(),
    transportation: v.string(),
    resumeStorageId: v.optional(v.id("_storage")),
    resumeName: v.optional(v.string()),
    details: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("hiringSubmissions", args);
  },
});

export const listHiring = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("hiringSubmissions").order("desc").collect();
    return await Promise.all(
      rows.map(async (row) => ({
        ...row,
        resumeUrl: row.resumeStorageId
          ? await ctx.storage.getUrl(row.resumeStorageId)
          : null,
      })),
    );
  },
});

export const deleteHiring = mutation({
  args: { id: v.id("hiringSubmissions") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});

// --- Email captures (from pop-ups) ------------------------------------------

export const captureEmail = mutation({
  args: {
    email: v.string(),
    source: v.string(),
    popupId: v.optional(v.id("popups")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("emailCaptures", args);
  },
});

export const listEmailCaptures = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("emailCaptures").order("desc").collect();
  },
});

export const deleteEmailCapture = mutation({
  args: { id: v.id("emailCaptures") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});
