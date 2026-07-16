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

/** Which public menu/catalog a section/item belongs to. */
export const menuKind = v.string();

/** Visitor-selected reason on the public contact form. */
export const contactTopic = v.union(
  v.literal("menu-inquiry"),
  v.literal("vinyl-request"),
  v.literal("general"),
);

/** A single seeded review embedded on a menu item. */
const review = v.object({
  name: v.string(),
  rating: v.number(),
  text: v.string(),
});

/** A {key, count} pair used for analytics breakdown maps. */
const countEntry = v.object({ key: v.string(), count: v.number() });

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

  // --- Site settings --------------------------------------------------------
  // Singleton row of global on/off switches the admin controls. Absent fields
  // fall back to sensible defaults at read time, so a missing row = all on.
  siteSettings: defineTable({
    // Per-page visibility switches. When a field is false the page is hidden
    // from the nav and its route redirects to the home page. Absent/true = the
    // page is live, so a missing row means everything is on.
    merchEnabled: v.optional(v.boolean()), // /retail
    aboutEnabled: v.optional(v.boolean()), // /about
    coffeeEnabled: v.optional(v.boolean()), // /menu/coffee
    foodEnabled: v.optional(v.boolean()), // /menu/food
    eventsEnabled: v.optional(v.boolean()), // /events
    coldBrewEnabled: v.optional(v.boolean()), // /cold-brew
    hiringEnabled: v.optional(v.boolean()), // /hiring
    // Gift Card is an external link, so this only controls its nav visibility.
    giftCardEnabled: v.optional(v.boolean()),
  }),

  // Structured page and global content edited in the CMS. Content is kept as
  // JSON so each page can evolve independently without invalidating existing
  // documents; the application owns the strongly typed defaults and merging.
  cmsContent: defineTable({
    key: v.string(), // "home" | "about" | "cold-brew" | "global"
    content: v.any(),
    version: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  // --- Menu -----------------------------------------------------------------
  menuPages: defineTable({
    slug: v.string(),
    title: v.string(),
    eyebrow: v.string(),
    order: v.number(),
    builtIn: v.optional(v.boolean()),
  }).index("by_slug", ["slug"]),

  menuSections: defineTable({
    menu: menuKind,
    title: v.string(),
    order: v.number(),
  }).index("by_menu", ["menu"]),

  // Curated + custom dietary tags. Built-in tags are seeded once; admins can
  // add custom ones with their own label, emoji icon, and color. Items
  // reference tags by `key`.
  dietaryTags: defineTable({
    key: v.string(), // stable slug, referenced by menuItems.dietaryTags
    label: v.string(),
    icon: v.string(), // named vector icon
    color: v.string(), // hex, used for the pill background tint
    builtin: v.boolean(),
    order: v.number(),
  }).index("by_key", ["key"]),

  menuItems: defineTable({
    sectionId: v.id("menuSections"),
    menu: menuKind, // denormalized for simple per-menu queries
    name: v.string(),
    // URL-safe slug used for the item's own page (/menu/coffee/<slug>). Unique
    // within a menu; derived from the name and kept stable once assigned.
    slug: v.optional(v.string()),
    price: v.string(),
    description: v.string(),
    // Optional dietary tag keys (see `dietaryTags`). Empty/absent = no tags.
    dietaryTags: v.optional(v.array(v.string())),
    // Per-item Toast online-ordering link. Optional; when unset the public
    // "Order" button on the item renders disabled.
    orderUrl: v.optional(v.string()),
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
    // Surfaced in the home-page "Best Sellers" carousel (does not change the
    // item's position within its menu section).
    featured: v.optional(v.boolean()),
  })
    .index("by_section", ["sectionId"])
    .index("by_menu", ["menu"])
    .index("by_menu_slug", ["menu", "slug"]),

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
    topic: v.optional(contactTopic),
    message: v.string(),
    // Whether an admin has marked this inquiry as read.
    read: v.optional(v.boolean()),
  }),

  hiringSubmissions: defineTable({
    // Simplified application fields (current form).
    name: v.optional(v.string()),
    email: v.string(),
    phone: v.optional(v.string()),
    resumeStorageId: v.optional(v.id("_storage")),
    resumeName: v.optional(v.string()),
    coffeeExperience: v.optional(v.string()), // "yes" | "no"
    availability: v.optional(v.array(v.string())), // ["Part-Time", "Full-Time"]
    favoriteCoffeeShop: v.optional(v.string()),
    favoriteRecord: v.optional(v.string()),
    // Whether an admin has marked this application as read.
    read: v.optional(v.boolean()),
    // --- Legacy fields, kept optional so older applications still validate ---
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    position: v.optional(v.string()),
    desiredSalary: v.optional(v.string()),
    hoursDesired: v.optional(v.string()),
    transportation: v.optional(v.string()),
    details: v.optional(v.any()),
  }),

  emailCaptures: defineTable({
    email: v.string(),
    source: v.string(), // pop-up internal title (or "unknown")
    popupId: v.optional(v.id("popups")),
  }).index("by_email", ["email"]),

  // --- Merchandise ----------------------------------------------------------
  merchSections: defineTable({
    title: v.string(),
    order: v.number(),
  }),

  merchItems: defineTable({
    sectionId: v.id("merchSections"),
    title: v.string(),
    slug: v.optional(v.string()),
    price: v.string(),
    description: v.string(),
    purchaseUrl: v.string(),
    images: v.optional(
      v.array(
        v.object({
          storageId: v.optional(v.id("_storage")),
          path: v.optional(v.string()),
        }),
      ),
    ),
    image: v.optional(
      v.object({
        storageId: v.optional(v.id("_storage")),
        path: v.optional(v.string()),
      }),
    ),
    archived: v.optional(v.boolean()),
    order: v.number(),
  })
    .index("by_section", ["sectionId"])
    .index("by_slug", ["slug"]),

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
    // Optional scheduling window (epoch ms). When set, the bar is only live
    // between startsAt and endsAt in addition to being `active`. Evaluated at
    // read time so activation/expiry is precise to the minute.
    startsAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
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
    // Optional scheduling window (epoch ms), evaluated at read time. A pop-up
    // is only shown when `active` and within [startsAt, endsAt] (when set).
    startsAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
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
    // Archived events are hidden from the public site but kept in the admin.
    archived: v.optional(v.boolean()),
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

  // --- Analytics ------------------------------------------------------------
  // Raw, first-party events written by the public site (see convex/analytics.ts
  // and src/lib/analytics.ts). Kept for a rolling retention window; an hourly
  // cron folds them into `analyticsDaily` rollups that power the admin
  // dashboard. `isStaff` marks visits from signed-in admins so they can be
  // excluded from every number.
  analyticsEvents: defineTable({
    // "page_view" | "order_click" | "menu_click" | "cta_click"
    // | "item_view" | "announcement_view" | "announcement_click"
    // | "popup_view" | "popup_click" | "popup_close"
    type: v.string(),
    path: v.string(), // route the event happened on
    visitorId: v.string(), // anonymous, persisted in localStorage
    sessionId: v.string(), // per-tab session, sessionStorage
    source: v.optional(v.string()), // traffic source (page views + order clicks)
    clickSource: v.optional(v.string()), // "navbar" | "featured" | "menu-item" for order clicks
    menuItemName: v.optional(v.string()), // item name for per-item order clicks / views
    menu: v.optional(v.string()), // "coffee" | "food" for menu clicks / item views
    cta: v.optional(v.string()), // which CTA ("phone", "directions", …)
    destination: v.optional(v.string()), // where an order/CTA click points
    // Marketing analytics: which announcement/pop-up an event belongs to.
    entityId: v.optional(v.string()), // announcement/pop-up/menu-item id
    entityTitle: v.optional(v.string()), // denormalized internal title / item name
    buttonKey: v.optional(v.string()), // which button in a pop-up ("cta" | "email")
    dwellMs: v.optional(v.number()), // pop-up: ms open before it was dismissed
    isStaff: v.boolean(),
    ts: v.number(), // epoch ms (server time)
  }).index("by_ts", ["ts"]),

  // One pre-aggregated document per shop-local day. Counts are additive across
  // a range; "visitors" and the funnel steps are de-duplicated WITHIN a day
  // (a returning visitor counts once per day), which keeps range queries exact
  // and fast without reading raw events. Maps use string keys → counts.
  analyticsDaily: defineTable({
    date: v.string(), // "YYYY-MM-DD" in America/New_York
    pageViews: v.number(),
    visitors: v.number(), // distinct visitorId that day
    // Breakdown maps stored as {key,count} arrays (keys like "/menu/coffee" or
    // "l.facebook.com" aren't valid record-key identifiers).
    perPage: v.array(countEntry), // path → views
    sources: v.array(countEntry), // source → page views
    orderClicks: v.number(),
    orderBySource: v.array(countEntry), // "navbar"/"featured"/"menu-item" → clicks
    // Optional so the schema still validates against rollup rows created before
    // these fields existed; the rollup cron backfills them on the next run.
    orderByItem: v.optional(v.array(countEntry)), // menu item name → order clicks
    orderTraffic: v.optional(v.array(countEntry)), // traffic source → order clicks
    menuClicks: v.number(),
    menuByKind: v.array(countEntry), // "coffee"/"food" → clicks
    ctaClicks: v.array(countEntry), // cta key → clicks
    // Funnel: distinct visitors that day who reached each step.
    funnelMenuViewers: v.number(),
    funnelOrderClickers: v.number(),
    // Menu-item detail opens ("views"), keyed "menu|Item Name" so coffee/food
    // items with the same name stay distinct. Optional: older rows lack it.
    itemViews: v.optional(v.array(countEntry)),
    // Marketing per-entity metrics, keyed by announcement / pop-up id.
    annViews: v.optional(v.array(countEntry)), // announcement id → impressions
    annClicks: v.optional(v.array(countEntry)), // announcement id → button clicks
    popupViews: v.optional(v.array(countEntry)), // pop-up id → impressions
    popupClicks: v.optional(v.array(countEntry)), // pop-up id → button clicks
    popupCloses: v.optional(v.array(countEntry)), // pop-up id → dismissals
    popupDwellMs: v.optional(v.array(countEntry)), // pop-up id → summed dwell ms
  }).index("by_date", ["date"]),

  // Singleton bookkeeping for the rollup cron: the last day fully finalized.
  analyticsState: defineTable({
    rolledThrough: v.optional(v.string()), // "YYYY-MM-DD" (exclusive of today)
  }),
});
