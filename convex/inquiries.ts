import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./admin";

/**
 * Inquiry inboxes. Submissions come from the public site (no auth); reading
 * them is admin-only. Three streams: contact form, hiring applications, and
 * pop-up email captures.
 */

// --- Summary counts ----------------------------------------------------------

/**
 * Admin: totals + unread counts for each inquiry stream. Powers the summary
 * bars in the Inquiries page and the unread badge in the admin sidebar.
 * (Email captures have no read state, so only a total is reported.)
 */
export const counts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [contact, hiring, captures] = await Promise.all([
      ctx.db.query("contactSubmissions").collect(),
      ctx.db.query("hiringSubmissions").collect(),
      ctx.db.query("emailCaptures").collect(),
    ]);
    const unread = (rows: { read?: boolean }[]) =>
      rows.reduce((n, r) => n + (r.read ? 0 : 1), 0);
    return {
      contact: { total: contact.length, unread: unread(contact) },
      hiring: { total: hiring.length, unread: unread(hiring) },
      captures: { total: captures.length },
      totalUnread: unread(contact) + unread(hiring),
    };
  },
});

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

/** Mark a contact submission as read / unread. */
export const setContactRead = mutation({
  args: { id: v.id("contactSubmissions"), read: v.boolean() },
  handler: async (ctx, { id, read }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { read });
  },
});

// --- Hiring applications -----------------------------------------------------

/** Public: upload URL for an applicant's resume (no auth required). */
export const generateResumeUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

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

/** Mark a hiring application as read / unread. */
export const setHiringRead = mutation({
  args: { id: v.id("hiringSubmissions"), read: v.boolean() },
  handler: async (ctx, { id, read }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { read });
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
