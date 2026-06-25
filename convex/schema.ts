import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

/**
 * Database schema for the Pre Amp backend.
 *
 * `authTables` provides the Convex Auth tables (users, sessions, accounts).
 * Everything below powers the admin CMS: the menu, the inquiry inboxes, and
 * the marketing tools (announcement bars + pop-ups).
 *
 * Docs: https://docs.convex.dev/database/schemas
 */

/** Which public menu a section/item belongs to. */
export const menuKind = v.union(v.literal("coffee"), v.literal("food"));

/** A single seeded review embedded on a menu item. */
const review = v.object({
  name: v.string(),
  rating: v.number(),
  text: v.string(),
});

/** Where a pop-up is anchored on screen. Also used to enforce "one per spot". */
export const popupPosition = v.union(
  v.literal("center"),
  v.literal("top-left"),
  v.literal("top-right"),
  v.literal("bottom-left"),
  v.literal("bottom-right"),
  v.literal("top-edge"),
  v.literal("bottom-edge"),
  v.literal("left-edge"),
  v.literal("right-edge"),
);

export default defineSchema({
  ...authTables,

  // --- Menu -----------------------------------------------------------------
  menuSections: defineTable({
    menu: menuKind,
    title: v.string(),
    order: v.number(),
  }).index("by_menu", ["menu"]),

  menuItems: defineTable({
    sectionId: v.id("menuSections"),
    menu: menuKind, // denormalized for simple per-menu queries
    name: v.string(),
    price: v.string(),
    description: v.string(),
    // Ordered images; the first is the primary one shown on the card. Each is
    // an uploaded file (storageId) or a public path string (seed data).
    images: v.optional(
      v.array(
        v.object({
          storageId: v.optional(v.id("_storage")),
          path: v.optional(v.string()),
        }),
      ),
    ),
    // Legacy single-image fields, kept so existing rows keep rendering.
    imageStorageId: v.optional(v.id("_storage")),
    image: v.optional(v.string()),
    likes: v.number(),
    reviews: v.array(review),
    order: v.number(),
  })
    .index("by_section", ["sectionId"])
    .index("by_menu", ["menu"]),

  // PDF + meta for each menu (one row per menu kind).
  menuMeta: defineTable({
    menu: menuKind,
    pdfStorageId: v.optional(v.id("_storage")),
    pdfName: v.optional(v.string()),
  }).index("by_menu", ["menu"]),

  // --- Inquiries ------------------------------------------------------------
  contactSubmissions: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    message: v.string(),
  }),

  hiringSubmissions: defineTable({
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
    // Full payload (address, availability, employment history, restrictions).
    details: v.any(),
  }),

  emailCaptures: defineTable({
    email: v.string(),
    source: v.string(), // pop-up internal title (or "unknown")
    popupId: v.optional(v.id("popups")),
  }).index("by_email", ["email"]),

  // --- Marketing ------------------------------------------------------------
  announcements: defineTable({
    internalTitle: v.string(),
    text: v.string(),
    buttonLabel: v.optional(v.string()),
    buttonLink: v.optional(v.string()),
    bgColor: v.string(),
    textColor: v.string(),
    // "all" or an explicit list of page keys (e.g. ["home", "about"]).
    showOn: v.union(v.literal("all"), v.array(v.string())),
    active: v.boolean(),
  }),

  popups: defineTable({
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
      seconds: v.optional(v.number()), // for type "time"
      action: v.optional(v.string()), // for type "action"
    }),
    emailCapture: v.boolean(),
    showOn: v.union(v.literal("all"), v.array(v.string())),
    active: v.boolean(),
    // When true (and position is "center"), dim + blur the page behind the
    // pop-up. When false, the background stays fully visible.
    backdropBlur: v.optional(v.boolean()),
  }),

  // --- Events ---------------------------------------------------------------
  events: defineTable({
    title: v.string(),
    description: v.string(),
    startsAt: v.number(), // epoch ms (date + time)
    // Up to 3 images; each is an uploaded file or a public path string (seed).
    images: v.array(
      v.object({
        storageId: v.optional(v.id("_storage")),
        path: v.optional(v.string()),
      }),
    ),
  }).index("by_startsAt", ["startsAt"]),

  // --- Reviews --------------------------------------------------------------
  reviews: defineTable({
    menuItemId: v.optional(v.id("menuItems")),
    menuItemName: v.optional(v.string()), // denormalized for display/filter
    name: v.string(),
    rating: v.number(), // 1-5
    text: v.string(),
    // pending = awaiting moderation, approved = shown on the site,
    // archived = hidden but kept.
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("archived"),
    ),
    featured: v.boolean(), // surfaced on the home page (subset of approved)
  })
    .index("by_status", ["status"])
    .index("by_menuItem", ["menuItemId"])
    .index("by_featured", ["featured"]),
});
