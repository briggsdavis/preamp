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
 * Activation rules (evaluated at read time for minute-precise scheduling):
 *  - Each bar/pop-up is `active` (on/off) with an optional [startsAt, endsAt]
 *    schedule window. It is "live" only when active AND within its window.
 *  - The public site shows at most ONE announcement bar - the live one with the
 *    latest start - so scheduling a new bar automatically replaces the old one
 *    once its window opens.
 *  - Pop-ups show at most one per on-screen position, chosen the same way.
 *  - Activating (or scheduling) is rejected when it would put two live entities
 *    in the same slot at overlapping times.
 */

const showOn = v.union(v.literal("all"), v.array(v.string()));

type Schedulable = {
  active: boolean;
  startsAt?: number;
  endsAt?: number;
  position?: string;
};

/** Is this entity live at `now` (active and within its schedule window)? */
function isLive(doc: Schedulable, now: number): boolean {
  if (!doc.active) return false;
  if (doc.startsAt != null && now < doc.startsAt) return false;
  if (doc.endsAt != null && now > doc.endsAt) return false;
  return true;
}

type Window = { startsAt?: number; endsAt?: number };

/** Do two schedule windows overlap in time (open-ended when unset)? */
function windowsOverlap(a: Window, b: Window): boolean {
  const as = a.startsAt ?? -Infinity;
  const ae = a.endsAt ?? Infinity;
  const bs = b.startsAt ?? -Infinity;
  const be = b.endsAt ?? Infinity;
  return as < be && bs < ae;
}

/** Among candidates, the one that should win a slot: latest start, then newest. */
function pickWinner<T extends Schedulable & { _creationTime: number }>(
  candidates: T[],
): T | null {
  if (candidates.length === 0) return null;
  return [...candidates].sort(
    (a, b) =>
      (b.startsAt ?? 0) - (a.startsAt ?? 0) ||
      b._creationTime - a._creationTime,
  )[0];
}

const scheduleFields = {
  startsAt: v.optional(v.number()),
  endsAt: v.optional(v.number()),
};

// --- Announcement bars ------------------------------------------------------

const announcementFields = {
  internalTitle: v.string(),
  text: v.string(),
  buttonLabel: v.optional(v.string()),
  buttonLink: v.optional(v.string()),
  bgColor: v.string(),
  textColor: v.string(),
  showOn,
  ...scheduleFields,
};

export const listAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("announcements").order("desc").collect();
  },
});

/** Public: the single live announcement bar right now (or null). */
export const getActiveAnnouncement = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const all = await ctx.db.query("announcements").collect();
    return pickWinner(all.filter((a) => isLive(a, now)));
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
    const bar = await ctx.db.get(id);
    if (bar?.active) {
      // Re-check overlap when editing the schedule of an active bar.
      const all = await ctx.db.query("announcements").collect();
      const clash = all.find(
        (a) => a._id !== id && a.active && windowsOverlap(a, fields),
      );
      if (clash) {
        throw new ConvexError(
          `"${clash.internalTitle}" is already scheduled for an overlapping time. Adjust the schedule or turn that bar off.`,
        );
      }
    }
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

/**
 * Toggle an announcement on/off. Activating is rejected when its schedule
 * window would overlap another active bar (they'd both be live at once).
 * Non-overlapping windows are allowed, so a future-scheduled bar can replace
 * the current one automatically when its window opens.
 */
export const setAnnouncementActive = mutation({
  args: { id: v.id("announcements"), active: v.boolean() },
  handler: async (ctx, { id, active }) => {
    await requireAdmin(ctx);
    const bar = await ctx.db.get(id);
    if (!bar) throw new ConvexError("Announcement not found.");
    if (active) {
      const all = await ctx.db.query("announcements").collect();
      const clash = all.find(
        (a) => a._id !== id && a.active && windowsOverlap(a, bar),
      );
      if (clash) {
        throw new ConvexError(
          `"${clash.internalTitle}" is already scheduled for an overlapping time. Turn it off or give this bar a non-overlapping window.`,
        );
      }
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
  ...scheduleFields,
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

/**
 * Public: the live pop-ups right now - at most one per on-screen position -
 * with media URLs resolved for rendering.
 */
export const listActivePopups = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const all = await ctx.db.query("popups").collect();
    const live = all.filter((p) => isLive(p, now));
    // One per position: the live pop-up with the latest start wins the slot.
    const byPosition = new Map<string, (typeof live)[number]>();
    for (const p of live) {
      const cur = byPosition.get(p.position);
      const winner = pickWinner(cur ? [cur, p] : [p]);
      if (winner) byPosition.set(p.position, winner);
    }
    return await Promise.all(
      [...byPosition.values()].map((p) => withMediaUrls(ctx, p)),
    );
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
    const popup = await ctx.db.get(id);
    if (popup?.active) {
      // Re-check same-position overlap when editing an active pop-up.
      const all = await ctx.db.query("popups").collect();
      const clash = all.find(
        (p) =>
          p._id !== id &&
          p.active &&
          p.position === fields.position &&
          windowsOverlap(p, fields),
      );
      if (clash) {
        throw new ConvexError(
          `"${clash.internalTitle}" is scheduled in the ${fields.position} position for an overlapping time. Adjust the schedule or turn it off.`,
        );
      }
    }
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
 * Toggle a pop-up on/off. Activating fails only when another active pop-up
 * shares the same position AND an overlapping schedule window - so you can
 * schedule a replacement in the same spot for a later, non-overlapping time.
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
        (p) =>
          p.active &&
          p._id !== id &&
          p.position === popup.position &&
          windowsOverlap(p, popup),
      );
      if (clash) {
        throw new ConvexError(
          `Another pop-up ("${clash.internalTitle}") is already in the ${popup.position} position for an overlapping time. Turn it off or schedule this one for a different window.`,
        );
      }
    }
    await ctx.db.patch(id, { active });
  },
});
