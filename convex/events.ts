import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import { requireAdmin } from "./admin";

/**
 * Events: a public list (used by the public Events page + calendar) and
 * admin-only mutations to create / edit / delete, plus an idempotent seed of
 * the original three events.
 */

const imageInput = v.array(
  v.object({
    storageId: v.optional(v.id("_storage")),
    path: v.optional(v.string()),
  }),
);

/** Resolve an event's stored images to servable URLs. */
async function imageUrls(ctx: QueryCtx, event: Doc<"events">): Promise<string[]> {
  const urls = await Promise.all(
    event.images.map(async (img) => {
      if (img.storageId) return await ctx.storage.getUrl(img.storageId);
      return img.path ?? null;
    }),
  );
  return urls.filter((u): u is string => !!u);
}

/** Public: all non-archived events, soonest first, with image URLs resolved. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_startsAt")
      .collect();
    events.sort((a, b) => a.startsAt - b.startsAt);
    return await Promise.all(
      events
        .filter((event) => !event.archived)
        .map(async (event) => ({
        _id: event._id,
        title: event.title,
        description: event.description,
        startsAt: event.startsAt,
        images: await imageUrls(ctx, event),
      })),
    );
  },
});

/** Admin: events with raw image refs (storageId/path) + a preview URL. */
export const adminList = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const events = await ctx.db
      .query("events")
      .withIndex("by_startsAt")
      .collect();
    events.sort((a, b) => a.startsAt - b.startsAt);
    return await Promise.all(
      events.map(async (event) => ({
        _id: event._id,
        title: event.title,
        description: event.description,
        startsAt: event.startsAt,
        archived: event.archived ?? false,
        images: await Promise.all(
          event.images.map(async (img) => ({
            storageId: img.storageId,
            path: img.path,
            url: img.storageId
              ? await ctx.storage.getUrl(img.storageId)
              : (img.path ?? null),
          })),
        ),
      })),
    );
  },
});

const eventFields = {
  title: v.string(),
  description: v.string(),
  startsAt: v.number(),
  images: imageInput,
};

export const create = mutation({
  args: eventFields,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("events", args);
  },
});

export const update = mutation({
  args: { id: v.id("events"), ...eventFields },
  handler: async (ctx, { id, ...fields }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});

/** Archive / unarchive an event. Archived events are hidden from the site. */
export const setArchived = mutation({
  args: { id: v.id("events"), archived: v.boolean() },
  handler: async (ctx, { id, archived }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { archived });
  },
});

/**
 * Admin-only, idempotent seed of the original three events. Times are stored
 * as fixed UTC epochs that correspond to the intended US-Eastern local times.
 */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.query("events").first();
    if (existing) return { seeded: false, reason: "Events already exist." };

    const seedEvents = [
      {
        title: "Vinyl Night: Soul & Funk",
        description:
          "Crate-diggers welcome. We're spinning soul and funk all night with a guest selector behind the bar, so pull up a stool and stay a while.",
        startsAt: Date.UTC(2026, 5, 27, 23, 0), // Jun 27 2026, 7:00 PM EDT
        path: "/images/eventvinyls.jpg",
      },
      {
        title: "Single-Origin Cupping",
        description:
          "A guided tasting through our latest rotating origins. Learn to taste like the bar does, and take home a bag of your favorite.",
        startsAt: Date.UTC(2026, 6, 4, 14, 0), // Jul 4 2026, 10:00 AM EDT
        path: "/images/eventbeans.jpg",
      },
      {
        title: "Live Set: Late Night Listening",
        description:
          "An intimate after-hours listening session on the big speakers. Limited seating, espresso martinis, and ambient grooves.",
        startsAt: Date.UTC(2026, 6, 12, 0, 0), // Jul 11 2026, 8:00 PM EDT
        path: "/images/eventspeakers.jpg",
      },
    ];

    for (const e of seedEvents) {
      await ctx.db.insert("events", {
        title: e.title,
        description: e.description,
        startsAt: e.startsAt,
        images: [{ path: e.path }],
      });
    }
    return { seeded: true };
  },
});
