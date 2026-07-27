import { v } from "convex/values"
import type { Doc, Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import type { MutationCtx, QueryCtx } from "./_generated/server"
import { requireAdmin } from "./admin"
import { menuKind, menuQuizAnswer } from "./schema"
import { COFFEE_SEED, FOOD_SEED, MERCH_SEED, type SeedSection } from "./seedData"

/**
 * Menu data: one public read endpoint (used by both the live site and the
 * admin), plus admin-only mutations for sections, items, and the menu PDF.
 */

/**
 * Resolve a menu item's images to servable URLs (first = primary). Falls back
 * to the legacy single-image fields for rows created before multi-image.
 */
/** URL-safe slug from an item name (used for its own page URL). */
function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "item"
  )
}

/** Pick a slug for `name` that's unique among a menu's items. */
const DEFAULT_MENU_PAGES = [
  { slug: "coffee", title: "Coffee", eyebrow: "From the bar", order: 0, builtIn: true },
  { slug: "food", title: "Food", eyebrow: "From the kitchen", order: 1, builtIn: true },
] as const

async function uniqueItemSlug(
  ctx: MutationCtx,
  menu: string,
  name: string,
  excludeId?: Id<"menuItems">,
): Promise<string> {
  const base = slugify(name)
  const items = await ctx.db
    .query("menuItems")
    .withIndex("by_menu", (q) => q.eq("menu", menu))
    .collect()
  const taken = new Set(
    items.filter((i) => i._id !== excludeId && i.slug).map((i) => i.slug as string),
  )
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

type QuizAnswer = NonNullable<Doc<"menuItems">["quizAnswers"]>[number]

/** Keep persisted quiz assignments internally consistent even if a client is stale. */
async function validateQuizAnswers(ctx: MutationCtx, answers: QuizAnswer[] | undefined) {
  const seen = new Set<string>()
  for (const answer of answers ?? []) {
    if (seen.has(answer.questionId)) {
      throw new Error("Choose only one quiz answer per question.")
    }
    seen.add(answer.questionId)
    const [question, option] = await Promise.all([
      ctx.db.get(answer.questionId),
      ctx.db.get(answer.optionId),
    ])
    if (!question || !option || option.questionId !== answer.questionId) {
      throw new Error("A quiz answer is no longer available. Refresh and choose again.")
    }
  }
}

function pageSlugify(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "menu"
  )
}

async function uniquePageSlug(
  ctx: MutationCtx,
  title: string,
  excludeId?: Id<"menuPages">,
): Promise<string> {
  const base = pageSlugify(title)
  const pages = await ctx.db.query("menuPages").collect()
  const taken = new Set(pages.filter((p) => p._id !== excludeId).map((p) => p.slug))
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

function defaultMenuPage(slug: string) {
  return DEFAULT_MENU_PAGES.find((p) => p.slug === slug) ?? null
}

async function ensureDefaultMenuPages(ctx: MutationCtx) {
  for (const page of DEFAULT_MENU_PAGES) {
    const existing = await ctx.db
      .query("menuPages")
      .withIndex("by_slug", (q) => q.eq("slug", page.slug))
      .unique()
    if (!existing) await ctx.db.insert("menuPages", page)
  }
}

async function itemImages(
  ctx: QueryCtx,
  item: Doc<"menuItems">,
): Promise<{ url: string | null; storageId?: Id<"_storage">; path?: string }[]> {
  const refs =
    item.images && item.images.length > 0
      ? item.images
      : item.imageStorageId
        ? [{ storageId: item.imageStorageId }]
        : item.image
          ? [{ path: item.image }]
          : []
  return await Promise.all(
    refs.map(async (ref) => ({
      url: ref.storageId ? await ctx.storage.getUrl(ref.storageId) : (ref.path ?? null),
      storageId: ref.storageId,
      path: ref.path,
    })),
  )
}

/**
 * Public: the full menu for one kind ("coffee" | "food"), grouped into
 * ordered sections with ordered items, plus the uploaded PDF (if any).
 */
export const getMenu = query({
  args: { menu: menuKind },
  handler: async (ctx, { menu }) => {
    const pageRow = await ctx.db
      .query("menuPages")
      .withIndex("by_slug", (q) => q.eq("slug", menu))
      .unique()
    const fallbackPage = defaultMenuPage(menu)
    const page = pageRow
      ? {
          _id: pageRow._id,
          slug: pageRow.slug,
          title: pageRow.title,
          eyebrow: pageRow.eyebrow,
          order: pageRow.order,
          builtIn: pageRow.builtIn ?? false,
        }
      : fallbackPage
        ? { ...fallbackPage, _id: null }
        : null

    const sections = await ctx.db
      .query("menuSections")
      .withIndex("by_menu", (q) => q.eq("menu", menu))
      .collect()
    sections.sort((a, b) => a.order - b.order)

    const items = await ctx.db
      .query("menuItems")
      .withIndex("by_menu", (q) => q.eq("menu", menu))
      .collect()
    items.sort((a, b) => a.order - b.order)

    const itemsBySection = new Map<string, typeof items>()
    for (const item of items) {
      const key = item.sectionId
      const list = itemsBySection.get(key) ?? []
      list.push(item)
      itemsBySection.set(key, list)
    }

    const sectionsOut = await Promise.all(
      sections.map(async (section) => ({
        _id: section._id,
        title: section.title,
        order: section.order,
        items: await Promise.all(
          (itemsBySection.get(section._id) ?? []).map(async (item) => ({
            _id: item._id,
            sectionId: item.sectionId,
            name: item.name,
            slug: item.slug ?? slugify(item.name),
            price: item.price,
            description: item.description,
            dietaryTags: item.dietaryTags ?? [],
            orderUrl: item.orderUrl ?? null,
            images: await itemImages(ctx, item),
            featured: item.featured ?? false,
            quizAnswers: item.quizAnswers ?? [],
            likes: item.likes,
            reviews: item.reviews,
            order: item.order,
          })),
        ),
      })),
    )

    const meta = await ctx.db
      .query("menuMeta")
      .withIndex("by_menu", (q) => q.eq("menu", menu))
      .unique()
    const pdfUrl = meta?.pdfStorageId ? await ctx.storage.getUrl(meta.pdfStorageId) : null

    return {
      page,
      sections: sectionsOut,
      pdf: meta?.pdfStorageId ? { url: pdfUrl, name: meta.pdfName ?? "menu.pdf" } : null,
    }
  },
})

export const listMenuPages = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("menuPages").collect()
    const bySlug = new Map(rows.map((row) => [row.slug, row]))
    const merged = [
      ...DEFAULT_MENU_PAGES.map((page) => bySlug.get(page.slug) ?? page),
      ...rows.filter((row) => !DEFAULT_MENU_PAGES.some((p) => p.slug === row.slug)),
    ]
    return merged
      .map((page) => ({
        _id: "_id" in page ? page._id : null,
        slug: page.slug,
        title: page.title,
        eyebrow: page.eyebrow,
        order: page.order,
        builtIn: page.builtIn ?? false,
      }))
      .sort((a, b) => a.order - b.order)
  },
})

export const createMenuPage = mutation({
  args: { title: v.string(), eyebrow: v.string() },
  handler: async (ctx, { title, eyebrow }) => {
    await requireAdmin(ctx)
    await ensureDefaultMenuPages(ctx)
    const rows = await ctx.db.query("menuPages").collect()
    const order = rows.reduce((max, page) => Math.max(max, page.order), -1) + 1
    const slug = await uniquePageSlug(ctx, title)
    await ctx.db.insert("menuPages", {
      slug,
      title,
      eyebrow,
      order,
      builtIn: false,
    })
    return { slug }
  },
})

export const updateMenuPage = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    eyebrow: v.string(),
  },
  handler: async (ctx, { slug, title, eyebrow }) => {
    await requireAdmin(ctx)
    await ensureDefaultMenuPages(ctx)
    const page = await ctx.db
      .query("menuPages")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique()
    if (!page) throw new Error("Menu page not found.")
    await ctx.db.patch(page._id, { title, eyebrow })
  },
})

/** Resolve dietary tag keys to their catalog details (label/icon/color). */
async function resolveDietaryTags(ctx: QueryCtx, keys: string[]) {
  if (keys.length === 0) return []
  const catalog = await ctx.db.query("dietaryTags").collect()
  const byKey = new Map(catalog.map((t) => [t.key, t]))
  return keys
    .map((k) => byKey.get(k))
    .filter((t): t is NonNullable<typeof t> => !!t)
    .map((t) => ({ key: t.key, label: t.label, icon: t.icon, color: t.color }))
}

/**
 * Public: one menu item by its menu + slug, for the item's own page (and the
 * prerender step). Returns the item with resolved images and dietary tags, or
 * null when nothing matches.
 */
export const getItemBySlug = query({
  args: { menu: menuKind, slug: v.string() },
  handler: async (ctx, { menu, slug }) => {
    const items = await ctx.db
      .query("menuItems")
      .withIndex("by_menu", (q) => q.eq("menu", menu))
      .collect()
    const item = items.find((i) => i.slug === slug) ?? items.find((i) => slugify(i.name) === slug)
    if (!item) return null

    const section = await ctx.db.get(item.sectionId)
    const images = await itemImages(ctx, item)
    return {
      _id: item._id,
      menu,
      slug: item.slug ?? slugify(item.name),
      name: item.name,
      price: item.price,
      description: item.description,
      sectionTitle: section?.title ?? null,
      dietaryTags: await resolveDietaryTags(ctx, item.dietaryTags ?? []),
      orderUrl: item.orderUrl ?? null,
      images,
      image: images[0]?.url ?? null,
      likes: item.likes,
    }
  },
})

/** Public: every item's menu + slug, for building the sitemap / prerender list. */
export const listItemSlugs = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("menuItems").collect()
    return items.map((i) => ({
      menu: i.menu,
      slug: i.slug ?? slugify(i.name),
      name: i.name,
    }))
  },
})

// --- Sections ---------------------------------------------------------------

export const createSection = mutation({
  args: { menu: menuKind, title: v.string() },
  handler: async (ctx, { menu, title }) => {
    await requireAdmin(ctx)
    if (menu !== "merch") await ensureDefaultMenuPages(ctx)
    const existing = await ctx.db
      .query("menuSections")
      .withIndex("by_menu", (q) => q.eq("menu", menu))
      .collect()
    const order = existing.reduce((max, s) => Math.max(max, s.order), -1) + 1
    return await ctx.db.insert("menuSections", { menu, title, order })
  },
})

export const renameSection = mutation({
  args: { sectionId: v.id("menuSections"), title: v.string() },
  handler: async (ctx, { sectionId, title }) => {
    await requireAdmin(ctx)
    await ctx.db.patch(sectionId, { title })
  },
})

export const deleteSection = mutation({
  args: { sectionId: v.id("menuSections") },
  handler: async (ctx, { sectionId }) => {
    await requireAdmin(ctx)
    const items = await ctx.db
      .query("menuItems")
      .withIndex("by_section", (q) => q.eq("sectionId", sectionId))
      .collect()
    await Promise.all(items.map((item) => ctx.db.delete("menuItems", item._id)))
    await ctx.db.delete("menuSections", sectionId)
  },
})

/** Reorder sections by passing the full ordered list of section ids. */
export const reorderSections = mutation({
  args: { sectionIds: v.array(v.id("menuSections")) },
  handler: async (ctx, { sectionIds }) => {
    await requireAdmin(ctx)
    await Promise.all(sectionIds.map((id, index) => ctx.db.patch(id, { order: index })))
  },
})

/** Move a section and all of its items to another menu page. */
export const moveSectionToMenu = mutation({
  args: {
    sectionId: v.id("menuSections"),
    targetMenu: v.string(),
  },
  handler: async (ctx, { sectionId, targetMenu }) => {
    await requireAdmin(ctx)
    await ensureDefaultMenuPages(ctx)

    const [section, targetPage] = await Promise.all([
      ctx.db.get(sectionId),
      ctx.db
        .query("menuPages")
        .withIndex("by_slug", (q) => q.eq("slug", targetMenu))
        .unique(),
    ])
    if (!section) throw new Error("Section not found.")
    if (!targetPage || targetMenu === "merch") {
      throw new Error("Target menu page not found.")
    }
    if (section.menu === targetMenu) {
      throw new Error("Choose a different menu page.")
    }

    const [items, targetSections, targetItems] = await Promise.all([
      ctx.db
        .query("menuItems")
        .withIndex("by_section", (q) => q.eq("sectionId", sectionId))
        .collect(),
      ctx.db
        .query("menuSections")
        .withIndex("by_menu", (q) => q.eq("menu", targetMenu))
        .collect(),
      ctx.db
        .query("menuItems")
        .withIndex("by_menu", (q) => q.eq("menu", targetMenu))
        .collect(),
    ])

    const sectionOrder =
      targetSections.reduce((max, candidate) => Math.max(max, candidate.order), -1) + 1
    const takenSlugs = new Set(targetItems.flatMap((item) => (item.slug ? [item.slug] : [])))
    const itemUpdates = items.map((item) => {
      const base = item.slug ?? slugify(item.name)
      let slug = base
      let suffix = 2
      while (takenSlugs.has(slug)) slug = `${base}-${suffix++}`
      takenSlugs.add(slug)
      return { item, slug }
    })

    await ctx.db.patch(sectionId, { menu: targetMenu, order: sectionOrder })
    await Promise.all(
      itemUpdates.map(({ item, slug }) => ctx.db.patch(item._id, { menu: targetMenu, slug })),
    )
  },
})

// --- Items ------------------------------------------------------------------

const itemFields = {
  name: v.string(),
  price: v.string(),
  description: v.string(),
  orderUrl: v.optional(v.string()),
  dietaryTags: v.optional(v.array(v.string())),
  quizAnswers: v.optional(v.array(menuQuizAnswer)),
  images: v.array(
    v.object({
      storageId: v.optional(v.id("_storage")),
      path: v.optional(v.string()),
    }),
  ),
}

export const createItem = mutation({
  args: { sectionId: v.id("menuSections"), ...itemFields },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await validateQuizAnswers(ctx, args.quizAnswers)
    const section = await ctx.db.get(args.sectionId)
    if (!section) throw new Error("Section not found.")
    const siblings = await ctx.db
      .query("menuItems")
      .withIndex("by_section", (q) => q.eq("sectionId", args.sectionId))
      .collect()
    const order = siblings.reduce((max, i) => Math.max(max, i.order), -1) + 1
    const slug = await uniqueItemSlug(ctx, section.menu, args.name)
    return await ctx.db.insert("menuItems", {
      sectionId: args.sectionId,
      menu: section.menu,
      name: args.name,
      slug,
      price: args.price,
      description: args.description,
      dietaryTags: args.dietaryTags ?? [],
      quizAnswers: args.quizAnswers ?? [],
      orderUrl: args.orderUrl,
      images: args.images,
      likes: 0,
      reviews: [],
      order,
    })
  },
})

export const updateItem = mutation({
  args: { itemId: v.id("menuItems"), ...itemFields },
  handler: async (ctx, { itemId, ...fields }) => {
    await requireAdmin(ctx)
    await validateQuizAnswers(ctx, fields.quizAnswers)
    const existing = await ctx.db.get(itemId)
    // Keep an existing slug stable (it's a public URL); assign one if missing.
    const slug =
      existing?.slug ??
      (existing ? await uniqueItemSlug(ctx, existing.menu, fields.name, itemId) : undefined)
    // Persist the fields and clear any legacy single-image fields.
    await ctx.db.patch(itemId, {
      ...fields,
      dietaryTags: fields.dietaryTags ?? [],
      quizAnswers: fields.quizAnswers ?? [],
      ...(slug ? { slug } : {}),
      image: undefined,
      imageStorageId: undefined,
    })
  },
})

/**
 * Admin: assign slugs to any items that don't have one yet (e.g. seeded rows).
 * Idempotent; returns how many were backfilled.
 */
export const ensureSlugs = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    let filled = 0
    const menus = await ctx.db.query("menuSections").collect()
    const menuSlugs = [...new Set(menus.map((section) => section.menu))]
    for (const menu of menuSlugs) {
      const items = await ctx.db
        .query("menuItems")
        .withIndex("by_menu", (q) => q.eq("menu", menu))
        .collect()
      for (const item of items) {
        if (item.slug) continue
        await ctx.db.patch(item._id, {
          slug: await uniqueItemSlug(ctx, menu, item.name, item._id),
        })
        filled++
      }
    }
    return { filled }
  },
})

/** Move an item to a different section (within the same menu). */
export const moveItem = mutation({
  args: { itemId: v.id("menuItems"), sectionId: v.id("menuSections") },
  handler: async (ctx, { itemId, sectionId }) => {
    await requireAdmin(ctx)
    const section = await ctx.db.get(sectionId)
    if (!section) throw new Error("Target section not found.")
    const siblings = await ctx.db
      .query("menuItems")
      .withIndex("by_section", (q) => q.eq("sectionId", sectionId))
      .collect()
    const order = siblings.reduce((max, i) => Math.max(max, i.order), -1) + 1
    await ctx.db.patch(itemId, { sectionId, menu: section.menu, order })
  },
})

/** Persist a complete item order, including moves between sections. */
export const reorderItems = mutation({
  args: {
    menu: menuKind,
    positions: v.array(
      v.object({
        itemId: v.id("menuItems"),
        sectionId: v.id("menuSections"),
        order: v.number(),
      }),
    ),
  },
  handler: async (ctx, { menu, positions }) => {
    await requireAdmin(ctx)

    const itemIds = new Set(positions.map(({ itemId }) => itemId))
    if (itemIds.size !== positions.length) {
      throw new Error("Each menu item can only appear once in a reorder.")
    }

    const sectionIds = [...new Set(positions.map(({ sectionId }) => sectionId))]
    const sections = await Promise.all(sectionIds.map((id) => ctx.db.get(id)))
    if (sections.some((section) => !section || section.menu !== menu)) {
      throw new Error("Items can only be reordered within this menu page.")
    }

    const [items, currentItems] = await Promise.all([
      Promise.all(positions.map(({ itemId }) => ctx.db.get(itemId))),
      ctx.db
        .query("menuItems")
        .withIndex("by_menu", (q) => q.eq("menu", menu))
        .collect(),
    ])
    if (
      items.some((item) => !item || item.menu !== menu) ||
      currentItems.length !== positions.length
    ) {
      throw new Error("One or more menu items could not be reordered.")
    }

    await Promise.all(
      positions.map(({ itemId, sectionId, order }) =>
        ctx.db.patch(itemId, { sectionId, menu, order }),
      ),
    )
  },
})

export const deleteItem = mutation({
  args: { itemId: v.id("menuItems") },
  handler: async (ctx, { itemId }) => {
    await requireAdmin(ctx)
    await ctx.db.delete("menuItems", itemId)
  },
})

/** Toggle whether an item appears in the home-page "Best Sellers" carousel. */
export const setItemFeatured = mutation({
  args: { itemId: v.id("menuItems"), featured: v.boolean() },
  handler: async (ctx, { itemId, featured }) => {
    await requireAdmin(ctx)
    await ctx.db.patch(itemId, { featured })
  },
})

/** Public: featured menu items (coffee + food) for the Best Sellers carousel. */
export const listFeatured = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("menuItems").collect()
    const featured = items.filter((item) => item.featured)
    return await Promise.all(
      featured.map(async (item) => {
        const imgs = await itemImages(ctx, item)
        return {
          _id: item._id,
          name: item.name,
          menu: item.menu,
          slug: item.slug ?? slugify(item.name),
          price: item.price,
          description: item.description,
          orderUrl: item.orderUrl ?? null,
          image: imgs[0]?.url ?? null,
        }
      }),
    )
  },
})

// --- Menu PDF ---------------------------------------------------------------

export const setMenuPdf = mutation({
  args: {
    menu: menuKind,
    pdfStorageId: v.id("_storage"),
    pdfName: v.string(),
  },
  handler: async (ctx, { menu, pdfStorageId, pdfName }) => {
    await requireAdmin(ctx)
    const existing = await ctx.db
      .query("menuMeta")
      .withIndex("by_menu", (q) => q.eq("menu", menu))
      .unique()
    if (existing) {
      await ctx.db.patch(existing._id, { pdfStorageId, pdfName })
    } else {
      await ctx.db.insert("menuMeta", { menu, pdfStorageId, pdfName })
    }
  },
})

export const removeMenuPdf = mutation({
  args: { menu: menuKind },
  handler: async (ctx, { menu }) => {
    await requireAdmin(ctx)
    const existing = await ctx.db
      .query("menuMeta")
      .withIndex("by_menu", (q) => q.eq("menu", menu))
      .unique()
    if (existing) {
      await ctx.db.patch(existing._id, {
        pdfStorageId: undefined,
        pdfName: undefined,
      })
    }
  },
})

// --- Seed -------------------------------------------------------------------

async function seedMenu(ctx: MutationCtx, menu: string, sections: SeedSection[]) {
  const usedSlugs = new Set<string>()
  const slugFor = (name: string) => {
    const base = slugify(name)
    if (!usedSlugs.has(base)) {
      usedSlugs.add(base)
      return base
    }
    let n = 2
    while (usedSlugs.has(`${base}-${n}`)) n++
    usedSlugs.add(`${base}-${n}`)
    return `${base}-${n}`
  }
  for (let s = 0; s < sections.length; s++) {
    const section = sections[s]
    const sectionId = await ctx.db.insert("menuSections", {
      menu,
      title: section.title,
      order: s,
    })
    for (let i = 0; i < section.items.length; i++) {
      const item = section.items[i]
      await ctx.db.insert("menuItems", {
        sectionId,
        menu,
        name: item.name,
        slug: slugFor(item.name),
        price: item.price,
        description: item.description,
        dietaryTags: [],
        images: [{ path: item.image }],
        likes: item.likes,
        reviews: item.reviews,
        order: i,
      })
    }
  }
}

/**
 * Admin-only, idempotent seed. Populates the menu from the original static
 * data the first time it's run; does nothing if any sections already exist.
 */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    await ensureDefaultMenuPages(ctx)
    const existing = await ctx.db.query("menuSections").first()
    if (existing) {
      return { seeded: false, reason: "Menu already has data." }
    }
    await seedMenu(ctx, "coffee", COFFEE_SEED)
    await seedMenu(ctx, "food", FOOD_SEED)
    return { seeded: true }
  },
})

export const seedMerch = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const existing = await ctx.db
      .query("menuSections")
      .withIndex("by_menu", (q) => q.eq("menu", "merch"))
      .first()
    if (existing) {
      return { seeded: false, reason: "Merch already has data." }
    }
    await seedMenu(ctx, "merch", MERCH_SEED)
    return { seeded: true }
  },
})
