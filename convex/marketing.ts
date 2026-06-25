import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { requireAdmin } from "./admin";
import { popupPosition } from "./schema";

/**
 * Marketing tools: announcement bars and pop-ups.
 *
 * Activation rules:
 *  - At most ONE announcement bar can be active at a time.
 *  - Two active pop-ups may not share the same on-screen position.
 */

const showOn = v.union(v.literal("all"), v.array(v.string()));

// --- Announcement bars ------------------------------------------------------

const announcementFields = {
  internalTitle: v.string(),
  text: v.string(),
  buttonLabel: v.optional(v.string()),
  buttonLink: v.optional(v.string()),
  bgColor: v.string(),
  textColor: v.string(),
  showOn,
};

export const listAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("announcements").order("desc").collect();
  },
});

/** Public: the single active announcement bar (or null). */
export const getActiveAnnouncement = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("announcements").collect();
    return all.find((a) => a.active) ?? null;
  },
});

export const createAnnouncement = mutation({
  args: announcementFields,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("announcements", { ...args, active: false });
  },
});

export const updateAnnouncement = mutation({
  args: { id: v.id("announcements"), ...announcementFields },
  handler: async (ctx, { id, ...fields }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, fields);
  },
});

export const deleteAnnouncement = mutation({
  args: { id: v.id("announcements") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});

/** Toggle an announcement on/off; turning one on turns the rest off. */
export const setAnnouncementActive = mutation({
  args: { id: v.id("announcements"), active: v.boolean() },
  handler: async (ctx, { id, active }) => {
    await requireAdmin(ctx);
    if (active) {
      const all = await ctx.db.query("announcements").collect();
      await Promise.all(
        all
          .filter((a) => a.active && a._id !== id)
          .map((a) => ctx.db.patch(a._id, { active: false })),
      );
    }
    await ctx.db.patch(id, { active });
  },
});

// --- Pop-ups ----------------------------------------------------------------

const popupFields = {
  internalTitle: v.string(),
  heading: v.optional(v.string()),
  body: v.optional(v.string()),
  media: v.array(
    v.object({
      storageId: v.id("_storage"),
      type: v.union(v.literal("image"), v.literal("video")),
    }),
  ),
  position: popupPosition,
  frequency: v.union(
    v.literal("every-visit"),
    v.literal("session"),
    v.literal("daily"),
  ),
  buttonLabel: v.optional(v.string()),
  buttonLink: v.optional(v.string()),
  trigger: v.object({
    type: v.union(v.literal("time"), v.literal("action")),
    seconds: v.optional(v.number()),
    action: v.optional(v.string()),
  }),
  emailCapture: v.boolean(),
  showOn,
  backdropBlur: v.optional(v.boolean()),
};

/** Resolve a pop-up's media storage ids to served URLs. */
async function withMediaUrls(ctx: QueryCtx, popup: Doc<"popups">) {
  const media = await Promise.all(
    popup.media.map(async (m) => ({
      type: m.type,
      url: await ctx.storage.getUrl(m.storageId),
      storageId: m.storageId,
    })),
  );
  return { ...popup, media };
}

export const listPopups = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("popups").order("desc").collect();
    return await Promise.all(rows.map((p) => withMediaUrls(ctx, p)));
  },
});

/** Public: all active pop-ups, with media URLs resolved for rendering. */
export const listActivePopups = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("popups").collect();
    const active = all.filter((p) => p.active);
    return await Promise.all(active.map((p) => withMediaUrls(ctx, p)));
  },
});

export const createPopup = mutation({
  args: popupFields,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("popups", { ...args, active: false });
  },
});

export const updatePopup = mutation({
  args: { id: v.id("popups"), ...popupFields },
  handler: async (ctx, { id, ...fields }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, fields);
  },
});

export const deletePopup = mutation({
  args: { id: v.id("popups") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});

/**
 * Toggle a pop-up on/off. Activating fails if another active pop-up already
 * occupies the same on-screen position.
 */
export const setPopupActive = mutation({
  args: { id: v.id("popups"), active: v.boolean() },
  handler: async (ctx, { id, active }) => {
    await requireAdmin(ctx);
    const popup = await ctx.db.get(id);
    if (!popup) throw new ConvexError("Pop-up not found.");
    if (active) {
      const all = await ctx.db.query("popups").collect();
      const clash = all.find(
        (p) => p.active && p._id !== id && p.position === popup.position,
      );
      if (clash) {
        throw new ConvexError(
          `Another active pop-up ("${clash.internalTitle}") is already in the ${popup.position} position. Turn it off first.`,
        );
      }
    }
    await ctx.db.patch(id, { active });
  },
});
