import { ConvexError, v } from "convex/values"
import { internalMutation, internalQuery } from "./_generated/server"
import {
  announcementFields,
  createAnnouncementDoc,
  createPopupDoc,
  popupFields,
  setAnnouncementActiveDoc,
  setPopupActiveDoc,
  updateAnnouncementDoc,
  updatePopupDoc,
  withMediaUrls,
} from "./marketing"

/**
 * Operator API for the reach-rd CLI. Internal only: callable with a deploy key,
 * never from the browser. Writes go through the same helpers as the admin UI,
 * so scheduling and overlap rules are identical.
 *
 * Updates take a partial `patch` plus an optional `clear` list of optional
 * fields to unset.
 */

const announcementPatch = v.object(announcementFields).partial()
const popupPatch = v.object(popupFields).partial()
const clear = v.optional(v.array(v.string()))

const ANNOUNCEMENT_OPTIONAL = ["buttonLabel", "buttonLink", "startsAt", "endsAt"]
const POPUP_OPTIONAL = ["heading", "body", "buttonLabel", "buttonLink", "backdropBlur", "startsAt", "endsAt"]

function applyClear(fields: Record<string, unknown>, keys: string[] | undefined, allowed: string[]) {
  for (const key of keys ?? []) {
    if (!allowed.includes(key)) throw new ConvexError(`Cannot clear "${key}". Clearable: ${allowed.join(", ")}`)
    fields[key] = undefined
  }
}

function strip<T extends { _id: unknown; _creationTime: number }>(doc: T) {
  const { _creationTime, ...rest } = doc
  return rest
}

export const describe = internalQuery({
  args: {},
  handler: async () => ({
    site: "preamp",
    notes: [
      "Announcement bars and pop-ups are created inactive. Turn them on with setAnnouncementActive / setPopupActive.",
      "An item is live only when active AND inside its optional [startsAt, endsAt] window (epoch ms).",
      "At most one announcement bar is live; the live bar with the latest start wins.",
      "At most one pop-up is live per position. Activating fails if another active pop-up shares the position with an overlapping window.",
      "Upload media with the CLI upload command, then pass { storageId, type } in popup.media.",
      "Admin UI defaults: bgColor #7a2f24, textColor #fdf7ef, frequency session, trigger { type: time, seconds: 5 }, backdropBlur true.",
    ],
    pages: [
      { key: "home", path: "/" },
      { key: "menu-coffee", path: "/menu/coffee" },
      { key: "menu-food", path: "/menu/food" },
      { key: "about", path: "/about" },
      { key: "contact", path: "/contact" },
      { key: "events", path: "/events" },
      { key: "retail", path: "/retail" },
      { key: "hiring", path: "/hiring" },
    ],
    announcement: {
      fields: {
        internalTitle: "string (admin label)",
        text: "string",
        buttonLabel: "string?",
        buttonLink: "string? (/path or https:// URL)",
        bgColor: "string (hex)",
        textColor: "string (hex)",
        showOn: '"all" | page key[]',
        startsAt: "number? (epoch ms)",
        endsAt: "number? (epoch ms)",
      },
    },
    popup: {
      fields: {
        internalTitle: "string (admin label)",
        heading: "string?",
        body: "string?",
        media: "{ storageId, type: image|video }[]",
        position: "center | top-left | top-right | bottom-left | bottom-right | top-edge | bottom-edge | left-edge | right-edge",
        frequency: "every-visit | session | daily",
        buttonLabel: "string?",
        buttonLink: "string?",
        trigger: "{ type: time, seconds } | { type: action, action: exit-intent | scroll-half | click-menu | second-page | reaches-footer }",
        emailCapture: "boolean",
        showOn: '"all" | page key[]',
        backdropBlur: "boolean? (center position only)",
        startsAt: "number? (epoch ms)",
        endsAt: "number? (epoch ms)",
      },
    },
    functions: {
      describe: "query {}",
      live: "query {} -> what the public site shows right now",
      listAnnouncements: "query {}",
      getAnnouncement: "query { id }",
      createAnnouncement: "mutation { fields }",
      updateAnnouncement: "mutation { id, patch, clear? }",
      setAnnouncementActive: "mutation { id, active }",
      deleteAnnouncement: "mutation { id }",
      listPopups: "query {}",
      getPopup: "query { id }",
      createPopup: "mutation { fields }",
      updatePopup: "mutation { id, patch, clear? }",
      setPopupActive: "mutation { id, active }",
      deletePopup: "mutation { id }",
      generateUploadUrl: "mutation {}",
    },
  }),
})

export const live = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const isLive = (d: { active: boolean; startsAt?: number; endsAt?: number }) =>
      d.active && (d.startsAt == null || now >= d.startsAt) && (d.endsAt == null || now <= d.endsAt)
    const announcements = (await ctx.db.query("announcements").collect()).filter(isLive)
    const popups = (await ctx.db.query("popups").collect()).filter(isLive)
    return {
      now,
      announcements: announcements.map((a) => ({ _id: a._id, internalTitle: a.internalTitle, text: a.text })),
      popups: popups.map((p) => ({ _id: p._id, internalTitle: p.internalTitle, position: p.position })),
    }
  },
})

// --- Announcements ------------------------------------------------------------

export const listAnnouncements = internalQuery({
  args: {},
  handler: async (ctx) => (await ctx.db.query("announcements").order("desc").collect()).map(strip),
})

export const getAnnouncement = internalQuery({
  args: { id: v.id("announcements") },
  handler: async (ctx, { id }) => {
    const doc = await ctx.db.get(id)
    return doc ? strip(doc) : null
  },
})

export const createAnnouncement = internalMutation({
  args: { fields: v.object(announcementFields) },
  handler: async (ctx, { fields }) => await createAnnouncementDoc(ctx, fields),
})

export const updateAnnouncement = internalMutation({
  args: { id: v.id("announcements"), patch: announcementPatch, clear },
  handler: async (ctx, { id, patch, clear }) => {
    const existing = await ctx.db.get(id)
    if (!existing) throw new ConvexError("Announcement not found.")
    const { _id, _creationTime, active: _active, ...current } = existing
    const next: Record<string, unknown> = { ...current, ...patch }
    applyClear(next, clear, ANNOUNCEMENT_OPTIONAL)
    await updateAnnouncementDoc(ctx, id, next as typeof current)
  },
})

export const setAnnouncementActive = internalMutation({
  args: { id: v.id("announcements"), active: v.boolean() },
  handler: async (ctx, { id, active }) => await setAnnouncementActiveDoc(ctx, id, active),
})

export const deleteAnnouncement = internalMutation({
  args: { id: v.id("announcements") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id)
  },
})

// --- Pop-ups ------------------------------------------------------------------

export const listPopups = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("popups").order("desc").collect()
    return await Promise.all(rows.map(async (p) => strip(await withMediaUrls(ctx, p))))
  },
})

export const getPopup = internalQuery({
  args: { id: v.id("popups") },
  handler: async (ctx, { id }) => {
    const doc = await ctx.db.get(id)
    return doc ? strip(await withMediaUrls(ctx, doc)) : null
  },
})

export const createPopup = internalMutation({
  args: { fields: v.object(popupFields) },
  handler: async (ctx, { fields }) => await createPopupDoc(ctx, fields),
})

export const updatePopup = internalMutation({
  args: { id: v.id("popups"), patch: popupPatch, clear },
  handler: async (ctx, { id, patch, clear }) => {
    const existing = await ctx.db.get(id)
    if (!existing) throw new ConvexError("Pop-up not found.")
    const { _id, _creationTime, active: _active, ...current } = existing
    const next: Record<string, unknown> = { ...current, ...patch }
    applyClear(next, clear, POPUP_OPTIONAL)
    await updatePopupDoc(ctx, id, next as typeof current)
  },
})

export const setPopupActive = internalMutation({
  args: { id: v.id("popups"), active: v.boolean() },
  handler: async (ctx, { id, active }) => await setPopupActiveDoc(ctx, id, active),
})

export const deletePopup = internalMutation({
  args: { id: v.id("popups") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id)
  },
})

export const generateUploadUrl = internalMutation({
  args: {},
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
})
