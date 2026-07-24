import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import type { Doc } from "./_generated/dataModel"
import { mutation, query, internalMutation } from "./_generated/server"
import type { MutationCtx, QueryCtx } from "./_generated/server"
import { requireAdmin } from "./admin"
import { menuKind } from "./schema"

/**
 * First-party analytics.
 *
 * The public site calls `track` (see src/lib/analytics.ts) on page views and
 * key clicks. Events land in `analyticsEvents`; an hourly cron (`rollup`, wired
 * in convex/crons.ts) folds them into one `analyticsDaily` document per
 * shop-local day. The admin dashboard reads those rollups for history and
 * computes "today" live, so range queries stay fast and bounded no matter the
 * timeframe.
 *
 * Honesty notes baked into the data:
 *  - "Visitors" is de-duplicated within a day (once per day), not across a range.
 *  - Order clicks measure *intent* - actual checkout happens off-site on Toast.
 *  - Signed-in admins are flagged `isStaff` and excluded from every number.
 */

const TZ = "America/New_York"
const RAW_RETENTION_DAYS = 90 // raw events older than this are pruned
const MAX_FINALIZE_PER_RUN = 90 // safety cap on catch-up days per cron run

const VALID_TYPES = new Set([
  "page_view",
  "order_click",
  "menu_click",
  "cta_click",
  "item_view",
  "announcement_view",
  "announcement_click",
  "popup_view",
  "popup_click",
  "popup_close",
])

// --- Time helpers (shop-local calendar math) --------------------------------

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

/** Which shop-local day (YYYY-MM-DD) a timestamp falls in. */
function dayKey(ts: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(ts))
}

/** Shop-local hour (0–23) for a timestamp. */
function hourOf(ts: number): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    hour: "2-digit",
  })
  let h = Number(dtf.formatToParts(new Date(ts)).find((p) => p.type === "hour")!.value)
  if (h === 24) h = 0
  return h
}

/** Offset (local − UTC) in ms for the given instant, in the shop timezone. */
function tzOffsetMs(ts: number): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
  const p: Record<string, string> = {}
  for (const part of dtf.formatToParts(new Date(ts))) p[part.type] = part.value
  let hour = Number(p.hour)
  if (hour === 24) hour = 0
  const asUTC = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    hour,
    Number(p.minute),
    Number(p.second),
  )
  return asUTC - ts
}

/** Epoch ms of shop-local midnight that begins `dateKey`. */
function dayStartMs(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number)
  const guess = Date.UTC(y, m - 1, d, 0, 0, 0)
  const off = tzOffsetMs(guess)
  let start = guess - off
  const off2 = tzOffsetMs(start) // refine across DST transitions
  if (off2 !== off) start = guess - off2
  return start
}

/** Calendar-date arithmetic on YYYY-MM-DD (UTC-anchored, DST-safe). */
function addDays(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split("-").map(Number)
  const t = Date.UTC(y, m - 1, d) + delta * 86400000
  const nd = new Date(t)
  return `${nd.getUTCFullYear()}-${pad(nd.getUTCMonth() + 1)}-${pad(nd.getUTCDate())}`
}

// --- Aggregation ------------------------------------------------------------

type DayStats = {
  pageViews: number
  visitors: number
  perPage: Record<string, number>
  sources: Record<string, number>
  orderClicks: number
  orderBySource: Record<string, number>
  orderByItem: Record<string, number>
  orderTraffic: Record<string, number>
  menuClicks: number
  menuByKind: Record<string, number>
  ctaClicks: Record<string, number>
  funnelMenuViewers: number
  funnelOrderClickers: number
  // Menu-item detail opens, keyed "menu|Item Name".
  itemViews: Record<string, number>
  // Marketing per-entity metrics, keyed by announcement / pop-up id.
  annViews: Record<string, number>
  annClicks: Record<string, number>
  popupViews: Record<string, number>
  popupClicks: Record<string, number>
  popupCloses: Record<string, number>
  popupDwellMs: Record<string, number>
}

function emptyStats(): DayStats {
  return {
    pageViews: 0,
    visitors: 0,
    perPage: {},
    sources: {},
    orderClicks: 0,
    orderBySource: {},
    orderByItem: {},
    orderTraffic: {},
    menuClicks: 0,
    menuByKind: {},
    ctaClicks: {},
    funnelMenuViewers: 0,
    funnelOrderClickers: 0,
    itemViews: {},
    annViews: {},
    annClicks: {},
    popupViews: {},
    popupClicks: {},
    popupCloses: {},
    popupDwellMs: {},
  }
}

function bump(map: Record<string, number>, key: string, by = 1) {
  map[key] = (map[key] ?? 0) + by
}

/** Fold a day's raw events (already staff-filtered) into a stats document. */
function aggregateEvents(events: Doc<"analyticsEvents">[]): DayStats {
  const s = emptyStats()
  const visitors = new Set<string>()
  const menuViewers = new Set<string>()
  const orderClickers = new Set<string>()

  for (const e of events) {
    switch (e.type) {
      case "page_view": {
        s.pageViews++
        visitors.add(e.visitorId)
        bump(s.perPage, e.path || "/")
        bump(s.sources, e.source || "direct")
        if (e.path.startsWith("/menu")) menuViewers.add(e.visitorId)
        break
      }
      case "order_click": {
        s.orderClicks++
        bump(s.orderBySource, e.clickSource || "other")
        if (e.menuItemName) bump(s.orderByItem, e.menuItemName)
        bump(s.orderTraffic, e.source || "direct")
        orderClickers.add(e.visitorId)
        break
      }
      case "menu_click": {
        s.menuClicks++
        bump(s.menuByKind, e.menu || "other")
        menuViewers.add(e.visitorId)
        break
      }
      case "cta_click": {
        bump(s.ctaClicks, e.cta || "other")
        break
      }
      case "item_view": {
        // Key by "menu|Name" so same-named coffee/food items stay distinct.
        if (e.menuItemName) {
          bump(s.itemViews, `${e.menu || "other"}|${e.menuItemName}`)
          menuViewers.add(e.visitorId)
        }
        break
      }
      case "announcement_view": {
        if (e.entityId) bump(s.annViews, e.entityId)
        break
      }
      case "announcement_click": {
        if (e.entityId) bump(s.annClicks, e.entityId)
        break
      }
      case "popup_view": {
        if (e.entityId) bump(s.popupViews, e.entityId)
        break
      }
      case "popup_click": {
        if (e.entityId) bump(s.popupClicks, e.entityId)
        break
      }
      case "popup_close": {
        if (e.entityId) {
          bump(s.popupCloses, e.entityId)
          if (typeof e.dwellMs === "number") bump(s.popupDwellMs, e.entityId, e.dwellMs)
        }
        break
      }
    }
  }

  s.visitors = visitors.size
  s.funnelMenuViewers = menuViewers.size
  s.funnelOrderClickers = orderClickers.size
  return s
}

async function fetchDayEvents(
  ctx: QueryCtx | MutationCtx,
  dateKey: string,
): Promise<Doc<"analyticsEvents">[]> {
  const start = dayStartMs(dateKey)
  const end = dayStartMs(addDays(dateKey, 1))
  const rows = await ctx.db
    .query("analyticsEvents")
    .withIndex("by_ts", (q) => q.gte("ts", start).lt("ts", end))
    .collect()
  return rows.filter((r) => !r.isStaff)
}

// --- Public: record an event ------------------------------------------------

export const track = mutation({
  args: {
    type: v.string(),
    path: v.string(),
    visitorId: v.string(),
    sessionId: v.string(),
    source: v.optional(v.string()),
    clickSource: v.optional(v.string()),
    menuItemName: v.optional(v.string()),
    menu: v.optional(v.string()),
    cta: v.optional(v.string()),
    destination: v.optional(v.string()),
    entityId: v.optional(v.string()),
    entityTitle: v.optional(v.string()),
    buttonKey: v.optional(v.string()),
    dwellMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!VALID_TYPES.has(args.type)) return // ignore unknown event types
    if (!args.visitorId || args.visitorId.length > 64) return

    // Exclude staff: anyone signed in is an admin (see admin.ts). We still
    // record the event (flagged) so totals can be audited, but rollups skip it.
    const userId = await getAuthUserId(ctx)

    await ctx.db.insert("analyticsEvents", {
      type: args.type,
      path: args.path.slice(0, 256),
      visitorId: args.visitorId,
      sessionId: args.sessionId,
      source: args.source?.slice(0, 64),
      clickSource: args.clickSource?.slice(0, 32),
      menuItemName: args.menuItemName?.slice(0, 128),
      menu: args.menu?.slice(0, 32),
      cta: args.cta?.slice(0, 64),
      destination: args.destination?.slice(0, 256),
      entityId: args.entityId?.slice(0, 64),
      entityTitle: args.entityTitle?.slice(0, 128),
      buttonKey: args.buttonKey?.slice(0, 32),
      dwellMs:
        typeof args.dwellMs === "number" && args.dwellMs >= 0
          ? Math.min(args.dwellMs, 3_600_000) // clamp to 1h to bound outliers
          : undefined,
      isStaff: userId !== null,
      ts: Date.now(),
    })
  },
})

// --- Internal: hourly rollup + prune ----------------------------------------

type CountEntry = { key: string; count: number }

function rec2arr(r: Record<string, number>): CountEntry[] {
  return Object.entries(r).map(([key, count]) => ({ key, count }))
}

function arr2rec(a: CountEntry[]): Record<string, number> {
  const r: Record<string, number> = {}
  for (const { key, count } of a) r[key] = count
  return r
}

async function upsertDay(ctx: MutationCtx, date: string, stats: DayStats) {
  const existing = await ctx.db
    .query("analyticsDaily")
    .withIndex("by_date", (q) => q.eq("date", date))
    .unique()
  const doc = {
    date,
    pageViews: stats.pageViews,
    visitors: stats.visitors,
    perPage: rec2arr(stats.perPage),
    sources: rec2arr(stats.sources),
    orderClicks: stats.orderClicks,
    orderBySource: rec2arr(stats.orderBySource),
    orderByItem: rec2arr(stats.orderByItem),
    orderTraffic: rec2arr(stats.orderTraffic),
    menuClicks: stats.menuClicks,
    menuByKind: rec2arr(stats.menuByKind),
    ctaClicks: rec2arr(stats.ctaClicks),
    funnelMenuViewers: stats.funnelMenuViewers,
    funnelOrderClickers: stats.funnelOrderClickers,
    itemViews: rec2arr(stats.itemViews),
    annViews: rec2arr(stats.annViews),
    annClicks: rec2arr(stats.annClicks),
    popupViews: rec2arr(stats.popupViews),
    popupClicks: rec2arr(stats.popupClicks),
    popupCloses: rec2arr(stats.popupCloses),
    popupDwellMs: rec2arr(stats.popupDwellMs),
  }
  if (existing) await ctx.db.patch(existing._id, doc)
  else await ctx.db.insert("analyticsDaily", doc)
}

export const rollup = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const today = dayKey(now)

    let state = await ctx.db.query("analyticsState").first()
    if (!state) {
      const id = await ctx.db.insert("analyticsState", {})
      state = await ctx.db.get(id)
    }

    // Decide the first day that still needs finalizing.
    let cursor: string | null = null
    if (state?.rolledThrough) {
      cursor = addDays(state.rolledThrough, 1)
    } else {
      const earliest = await ctx.db.query("analyticsEvents").withIndex("by_ts").first()
      if (earliest) cursor = dayKey(earliest.ts)
    }

    // Finalize completed past days (catches up any gaps), bounded per run.
    let finalized = 0
    while (cursor && cursor < today && finalized < MAX_FINALIZE_PER_RUN) {
      const events = await fetchDayEvents(ctx, cursor)
      await upsertDay(ctx, cursor, aggregateEvents(events))
      if (state) await ctx.db.patch(state._id, { rolledThrough: cursor })
      cursor = addDays(cursor, 1)
      finalized++
    }

    // Always refresh today's (not-yet-final) rollup.
    const todayEvents = await fetchDayEvents(ctx, today)
    await upsertDay(ctx, today, aggregateEvents(todayEvents))

    // Prune raw events past the retention window (rollups keep the history).
    const cutoff = dayStartMs(addDays(today, -RAW_RETENTION_DAYS))
    const stale = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_ts", (q) => q.lt("ts", cutoff))
      .take(2000)
    for (const row of stale) await ctx.db.delete(row._id)

    return { finalized, today }
  },
})

// --- Admin: the dashboard payload -------------------------------------------

type Timeframe = {
  daysBack: number
  granularity: "hour" | "day" | "week" | "month"
}

const TIMEFRAMES: Record<string, Timeframe> = {
  today: { daysBack: 1, granularity: "hour" },
  week: { daysBack: 7, granularity: "day" },
  month: { daysBack: 30, granularity: "day" },
  "3months": { daysBack: 90, granularity: "week" },
  "6months": { daysBack: 180, granularity: "week" },
  year: { daysBack: 365, granularity: "month" },
  "2years": { daysBack: 730, granularity: "month" },
}

function mergeMap(into: Record<string, number>, from: Record<string, number>) {
  for (const [k, val] of Object.entries(from)) into[k] = (into[k] ?? 0) + val
}

function topEntries(map: Record<string, number>, limit?: number) {
  const arr = Object.entries(map)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
  return limit ? arr.slice(0, limit) : arr
}

function totalsOf(days: DayStats[]) {
  let pageViews = 0
  let visitors = 0
  let orderClicks = 0
  let menuClicks = 0
  let orderClickers = 0
  for (const d of days) {
    pageViews += d.pageViews
    visitors += d.visitors
    orderClicks += d.orderClicks
    menuClicks += d.menuClicks
    orderClickers += d.funnelOrderClickers
  }
  return { pageViews, visitors, orderClicks, menuClicks, orderClickers }
}

/** Read finalized rollups for [startDate, endDateExclusive). */
async function readRollups(
  ctx: QueryCtx,
  startDate: string,
  endExclusive: string,
): Promise<Map<string, DayStats>> {
  const rows = await ctx.db
    .query("analyticsDaily")
    .withIndex("by_date", (q) => q.gte("date", startDate).lt("date", endExclusive))
    .collect()
  const map = new Map<string, DayStats>()
  for (const r of rows) {
    map.set(r.date, {
      pageViews: r.pageViews,
      visitors: r.visitors,
      perPage: arr2rec(r.perPage),
      sources: arr2rec(r.sources),
      orderClicks: r.orderClicks,
      orderBySource: arr2rec(r.orderBySource),
      orderByItem: arr2rec(r.orderByItem ?? []),
      orderTraffic: arr2rec(r.orderTraffic ?? []),
      menuClicks: r.menuClicks,
      menuByKind: arr2rec(r.menuByKind),
      ctaClicks: arr2rec(r.ctaClicks),
      funnelMenuViewers: r.funnelMenuViewers,
      funnelOrderClickers: r.funnelOrderClickers,
      itemViews: arr2rec(r.itemViews ?? []),
      annViews: arr2rec(r.annViews ?? []),
      annClicks: arr2rec(r.annClicks ?? []),
      popupViews: arr2rec(r.popupViews ?? []),
      popupClicks: arr2rec(r.popupClicks ?? []),
      popupCloses: arr2rec(r.popupCloses ?? []),
      popupDwellMs: arr2rec(r.popupDwellMs ?? []),
    })
  }
  return map
}

// --- Dev: seed demo data ----------------------------------------------------

/**
 * Populate realistic sample events across the last N days so the dashboard can
 * be reviewed before real traffic arrives. Internal-only: run it from the
 * Convex dashboard's function runner (Functions → analytics:seedDemo). Safe to
 * re-run; it adds more data and re-rolls each touched day.
 */
export const seedDemo = internalMutation({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days = 30 }) => {
    const today = dayKey(Date.now())
    const paths = ["/", "/menu/coffee", "/menu/food", "/about", "/contact", "/events"]
    const srcs = ["direct", "instagram", "google", "tiktok", "yelp"]
    const ctas = ["directions", "instagram", "tiktok", "gift_card"]
    const orderItems = [
      "Smokey Robinson",
      "Yuzu Espresso Tonic",
      "Latte",
      "Focaccia Sandwich",
      "Pre Amp Cheeseburger",
      "Kyoto Cold Brew",
      "Matcha Latte",
    ]
    const orderButtons = [
      "navbar",
      "featured",
      "menu-item",
      "menu-header",
      "hero",
      "footer",
      "sticky-mobile",
      "quiz",
      "location",
    ]
    const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)]
    let inserted = 0

    for (let d = days - 1; d >= 0; d--) {
      const date = addDays(today, -d)
      const start = dayStartMs(date)
      const views = 15 + Math.floor(Math.random() * 55)
      const pool = Math.max(6, Math.floor(views * 0.7))
      for (let i = 0; i < views; i++) {
        const vid = `seed-${date}-${Math.floor(Math.random() * pool)}`
        const sid = `${vid}-s`
        const ts = start + Math.floor(Math.random() * 86_400_000)
        const path = pick(paths)
        await ctx.db.insert("analyticsEvents", {
          type: "page_view",
          path,
          visitorId: vid,
          sessionId: sid,
          source: pick(srcs),
          isStaff: false,
          ts,
        })
        inserted++
        if (Math.random() < 0.15)
          await ctx.db.insert("analyticsEvents", {
            type: "menu_click",
            path: "/",
            visitorId: vid,
            sessionId: sid,
            menu: Math.random() < 0.6 ? "coffee" : "food",
            clickSource: "navbar",
            isStaff: false,
            ts,
          })
        if (Math.random() < 0.08) {
          const button = pick(orderButtons)
          await ctx.db.insert("analyticsEvents", {
            type: "order_click",
            path,
            visitorId: vid,
            sessionId: sid,
            clickSource: button,
            // Per-item clicks come from the menu item buttons.
            menuItemName: button === "menu-item" ? pick(orderItems) : undefined,
            source: pick(srcs),
            isStaff: false,
            ts,
          })
        }
        if (Math.random() < 0.05)
          await ctx.db.insert("analyticsEvents", {
            type: "cta_click",
            path,
            visitorId: vid,
            sessionId: sid,
            cta: pick(ctas),
            isStaff: false,
            ts,
          })
      }
      await upsertDay(ctx, date, aggregateEvents(await fetchDayEvents(ctx, date)))
    }
    return { inserted, days }
  },
})

export const getDashboard = query({
  args: { timeframe: v.string(), now: v.number() },
  handler: async (ctx, { timeframe, now }) => {
    await requireAdmin(ctx)
    const tf = TIMEFRAMES[timeframe] ?? TIMEFRAMES.week
    const today = dayKey(now)
    const startDate = addDays(today, -(tf.daysBack - 1))

    // History from rollups; today computed live (bounded to one day).
    const rollups = await readRollups(ctx, startDate, today)
    const todayStats = aggregateEvents(await fetchDayEvents(ctx, today))

    // Ordered per-day stats across the whole window (missing days → zeros).
    const dates: string[] = []
    for (let dk = startDate; dk <= today; dk = addDays(dk, 1)) dates.push(dk)
    const perDay = dates.map((dk) =>
      dk === today ? todayStats : (rollups.get(dk) ?? emptyStats()),
    )

    // --- KPIs + previous-period deltas ---
    const cur = totalsOf(perDay)
    const prevStart = addDays(startDate, -tf.daysBack)
    const prevRollups = await readRollups(ctx, prevStart, startDate)
    const prev = totalsOf([...prevRollups.values()])

    // --- Trend buckets ---
    type Bucket = { label: string; pageViews: number; visitors: number }
    let trend: Bucket[] = []
    if (tf.granularity === "hour") {
      const events = await fetchDayEvents(ctx, today)
      const hours: { views: number; vis: Set<string> }[] = Array.from({ length: 24 }, () => ({
        views: 0,
        vis: new Set<string>(),
      }))
      for (const e of events) {
        if (e.type !== "page_view") continue
        const h = hourOf(e.ts)
        hours[h].views++
        hours[h].vis.add(e.visitorId)
      }
      trend = hours.map((h, i) => ({
        label: `${i}:00`,
        pageViews: h.views,
        visitors: h.vis.size,
      }))
    } else if (tf.granularity === "day") {
      trend = perDay.map((d, i) => ({
        label: dates[i],
        pageViews: d.pageViews,
        visitors: d.visitors,
      }))
    } else if (tf.granularity === "week") {
      for (let i = 0; i < perDay.length; i += 7) {
        const chunk = perDay.slice(i, i + 7)
        trend.push({
          label: dates[i],
          pageViews: chunk.reduce((a, d) => a + d.pageViews, 0),
          visitors: chunk.reduce((a, d) => a + d.visitors, 0),
        })
      }
    } else {
      const byMonth = new Map<string, Bucket>()
      perDay.forEach((d, i) => {
        const month = dates[i].slice(0, 7) // YYYY-MM
        const b = byMonth.get(month) ?? {
          label: month,
          pageViews: 0,
          visitors: 0,
        }
        b.pageViews += d.pageViews
        b.visitors += d.visitors
        byMonth.set(month, b)
      })
      trend = [...byMonth.values()]
    }

    // --- Breakdowns merged across the window ---
    const perPage: Record<string, number> = {}
    const sources: Record<string, number> = {}
    const orderBySource: Record<string, number> = {}
    const orderByItem: Record<string, number> = {}
    const orderTraffic: Record<string, number> = {}
    const menuByKind: Record<string, number> = {}
    const ctaClicks: Record<string, number> = {}
    let menuViewers = 0
    for (const d of perDay) {
      mergeMap(perPage, d.perPage)
      mergeMap(sources, d.sources)
      mergeMap(orderBySource, d.orderBySource)
      mergeMap(orderByItem, d.orderByItem)
      mergeMap(orderTraffic, d.orderTraffic)
      mergeMap(menuByKind, d.menuByKind)
      mergeMap(ctaClicks, d.ctaClicks)
      menuViewers += d.funnelMenuViewers
    }

    return {
      timeframe,
      range: { start: startDate, end: today },
      kpis: {
        pageViews: cur.pageViews,
        visitors: cur.visitors,
        orderClicks: cur.orderClicks,
        menuClicks: cur.menuClicks,
        orderClickRate: cur.visitors > 0 ? cur.orderClickers / cur.visitors : 0,
        previous: {
          pageViews: prev.pageViews,
          visitors: prev.visitors,
          orderClicks: prev.orderClicks,
          menuClicks: prev.menuClicks,
          orderClickRate: prev.visitors > 0 ? prev.orderClickers / prev.visitors : 0,
        },
      },
      trend,
      topPages: topEntries(perPage, 8),
      sources: topEntries(sources),
      funnel: {
        visitors: cur.visitors,
        menuViewers,
        orderClickers: cur.orderClickers,
      },
      orderBySource: topEntries(orderBySource),
      orderByItem: topEntries(orderByItem, 10),
      orderTraffic: topEntries(orderTraffic),
      menuByKind: topEntries(menuByKind),
      ctaClicks: topEntries(ctaClicks),
    }
  },
})

// --- Shared window loader (used by the per-section analytics below) ---------

type Window = {
  tf: Timeframe
  today: string
  startDate: string
  dates: string[]
  perDay: DayStats[]
}

/** Build the ordered per-day stats window for a timeframe (today live). */
async function loadWindow(ctx: QueryCtx, timeframe: string, now: number): Promise<Window> {
  const tf = TIMEFRAMES[timeframe] ?? TIMEFRAMES.week
  const today = dayKey(now)
  const startDate = addDays(today, -(tf.daysBack - 1))
  const rollups = await readRollups(ctx, startDate, today)
  const todayStats = aggregateEvents(await fetchDayEvents(ctx, today))
  const dates: string[] = []
  for (let dk = startDate; dk <= today; dk = addDays(dk, 1)) dates.push(dk)
  const perDay = dates.map((dk) => (dk === today ? todayStats : (rollups.get(dk) ?? emptyStats())))
  return { tf, today, startDate, dates, perDay }
}

type TrendPoint = { label: string; views: number; clicks: number }

/**
 * Bucket a per-day {views,clicks} series into the timeframe's granularity.
 * "today" (hour granularity, one day back) renders as a single point - fine
 * for the compact per-entity cards.
 */
function bucketSeries(
  { tf, dates, perDay }: Window,
  extract: (d: DayStats) => { views: number; clicks: number },
): TrendPoint[] {
  const per = perDay.map(extract)
  if (tf.granularity === "hour" || tf.granularity === "day") {
    return per.map((p, i) => ({ label: dates[i], ...p }))
  }
  if (tf.granularity === "week") {
    const out: TrendPoint[] = []
    for (let i = 0; i < per.length; i += 7) {
      const chunk = per.slice(i, i + 7)
      out.push({
        label: dates[i],
        views: chunk.reduce((a, p) => a + p.views, 0),
        clicks: chunk.reduce((a, p) => a + p.clicks, 0),
      })
    }
    return out
  }
  const byMonth = new Map<string, TrendPoint>()
  per.forEach((p, i) => {
    const month = dates[i].slice(0, 7)
    const b = byMonth.get(month) ?? { label: month, views: 0, clicks: 0 }
    b.views += p.views
    b.clicks += p.clicks
    byMonth.set(month, b)
  })
  return [...byMonth.values()]
}

/** Sum email captures per pop-up id created on/after `sinceMs`. */
async function emailsByPopup(ctx: QueryCtx, sinceMs: number): Promise<Record<string, number>> {
  const rows = await ctx.db.query("emailCaptures").collect()
  const out: Record<string, number> = {}
  for (const r of rows) {
    if (r._creationTime < sinceMs || !r.popupId) continue
    out[r.popupId] = (out[r.popupId] ?? 0) + 1
  }
  return out
}

// --- Admin: per-menu item analytics -----------------------------------------

/**
 * Per-item views (detail opens) and order-button clicks for a menu - or for
 * both menus when `menu` is omitted (powers the home dashboard's Menu toggle
 * and the per-menu analytics on each menu manager).
 */
export const getMenuAnalytics = query({
  args: {
    menu: v.optional(menuKind),
    timeframe: v.string(),
    now: v.number(),
  },
  handler: async (ctx, { menu, timeframe, now }) => {
    await requireAdmin(ctx)
    const win = await loadWindow(ctx, timeframe, now)

    const items = menu
      ? await ctx.db
          .query("menuItems")
          .withIndex("by_menu", (q) => q.eq("menu", menu))
          .collect()
      : await ctx.db.query("menuItems").collect()

    // Section titles (+ order) so the dashboard can group/filter by section.
    const sections = await ctx.db.query("menuSections").collect()
    const secById = new Map(sections.map((s) => [s._id, s]))

    const views: Record<string, number> = {}
    const orders: Record<string, number> = {}
    for (const d of win.perDay) {
      mergeMap(views, d.itemViews)
      mergeMap(orders, d.orderByItem)
    }

    const rows = items
      .map((it) => {
        const sec = secById.get(it.sectionId)
        return {
          id: it._id,
          name: it.name,
          menu: it.menu,
          sectionId: it.sectionId as string,
          section: sec?.title ?? "Uncategorized",
          sectionOrder: sec?.order ?? 999,
          views: views[`${it.menu}|${it.name}`] ?? 0,
          // Order clicks aren't tagged by menu, so join on item name.
          orders: orders[it.name] ?? 0,
        }
      })
      .sort((a, b) => b.views - a.views || b.orders - a.orders)

    const trend = bucketSeries(win, (d) => ({
      views: Object.entries(d.itemViews).reduce(
        (a, [k, c]) => a + (!menu || k.startsWith(`${menu}|`) ? c : 0),
        0,
      ),
      clicks: rows.length
        ? Object.entries(d.orderByItem).reduce(
            (a, [k, c]) => a + (items.some((it) => it.name === k) ? c : 0),
            0,
          )
        : 0,
    }))

    return {
      menu: menu ?? null,
      range: { start: win.startDate, end: win.today },
      rows,
      trend,
      totals: {
        views: rows.reduce((a, r) => a + r.views, 0),
        orders: rows.reduce((a, r) => a + r.orders, 0),
      },
    }
  },
})

// --- Admin: marketing (announcement + pop-up) analytics ---------------------

/** All announcements + pop-ups with their per-entity metrics for a timeframe. */
export const getMarketingAnalytics = query({
  args: { timeframe: v.string(), now: v.number() },
  handler: async (ctx, { timeframe, now }) => {
    await requireAdmin(ctx)
    const win = await loadWindow(ctx, timeframe, now)
    const sinceMs = dayStartMs(win.startDate)

    const annViews: Record<string, number> = {}
    const annClicks: Record<string, number> = {}
    const popupViews: Record<string, number> = {}
    const popupClicks: Record<string, number> = {}
    const popupCloses: Record<string, number> = {}
    const popupDwellMs: Record<string, number> = {}
    for (const d of win.perDay) {
      mergeMap(annViews, d.annViews)
      mergeMap(annClicks, d.annClicks)
      mergeMap(popupViews, d.popupViews)
      mergeMap(popupClicks, d.popupClicks)
      mergeMap(popupCloses, d.popupCloses)
      mergeMap(popupDwellMs, d.popupDwellMs)
    }
    const emails = await emailsByPopup(ctx, sinceMs)

    const announcementDocs = await ctx.db.query("announcements").collect()
    const popupDocs = await ctx.db.query("popups").collect()

    const announcements = announcementDocs
      .map((a) => {
        const views = annViews[a._id] ?? 0
        const clicks = annClicks[a._id] ?? 0
        return {
          id: a._id,
          title: a.internalTitle,
          active: a.active,
          views,
          clicks,
          ctr: views > 0 ? clicks / views : 0,
        }
      })
      .sort((a, b) => b.views - a.views)

    const popups = popupDocs
      .map((p) => {
        const views = popupViews[p._id] ?? 0
        const clicks = popupClicks[p._id] ?? 0
        const closes = popupCloses[p._id] ?? 0
        const dwell = popupDwellMs[p._id] ?? 0
        return {
          id: p._id,
          title: p.internalTitle,
          active: p.active,
          position: p.position,
          emailCapture: p.emailCapture,
          views,
          clicks,
          closes,
          emails: emails[p._id] ?? 0,
          ctr: views > 0 ? clicks / views : 0,
          avgDwellMs: closes > 0 ? Math.round(dwell / closes) : 0,
        }
      })
      .sort((a, b) => b.views - a.views)

    return {
      range: { start: win.startDate, end: win.today },
      announcements,
      popups,
    }
  },
})

/**
 * Focused analytics for a single announcement or pop-up - the compact toggle
 * shown on that entity's own editor page.
 */
export const getEntityAnalytics = query({
  args: {
    kind: v.union(v.literal("announcement"), v.literal("popup")),
    id: v.string(),
    timeframe: v.string(),
    now: v.number(),
  },
  handler: async (ctx, { kind, id, timeframe, now }) => {
    await requireAdmin(ctx)
    const win = await loadWindow(ctx, timeframe, now)

    if (kind === "announcement") {
      const trend = bucketSeries(win, (d) => ({
        views: d.annViews[id] ?? 0,
        clicks: d.annClicks[id] ?? 0,
      }))
      const views = trend.reduce((a, t) => a + t.views, 0)
      const clicks = trend.reduce((a, t) => a + t.clicks, 0)
      return {
        kind,
        range: { start: win.startDate, end: win.today },
        trend,
        // Uniform totals shape across kinds (announcements have no email/dwell).
        totals: {
          views,
          clicks,
          closes: 0,
          emails: 0,
          ctr: views > 0 ? clicks / views : 0,
          avgDwellMs: 0,
        },
      }
    }

    // pop-up
    const trend = bucketSeries(win, (d) => ({
      views: d.popupViews[id] ?? 0,
      clicks: d.popupClicks[id] ?? 0,
    }))
    let closes = 0
    let dwell = 0
    for (const d of win.perDay) {
      closes += d.popupCloses[id] ?? 0
      dwell += d.popupDwellMs[id] ?? 0
    }
    const emails = await emailsByPopup(ctx, dayStartMs(win.startDate))
    const views = trend.reduce((a, t) => a + t.views, 0)
    const clicks = trend.reduce((a, t) => a + t.clicks, 0)
    return {
      kind,
      range: { start: win.startDate, end: win.today },
      trend,
      totals: {
        views,
        clicks,
        closes,
        emails: emails[id] ?? 0,
        ctr: views > 0 ? clicks / views : 0,
        avgDwellMs: closes > 0 ? Math.round(dwell / closes) : 0,
      },
    }
  },
})

// --- Admin: raw event export ------------------------------------------------

/**
 * Raw, non-staff events within the timeframe for CSV export. Bounded to a
 * sane cap; raw events are pruned after the retention window, so timeframes
 * longer than that only return what still exists.
 */
export const exportRawEvents = query({
  args: { timeframe: v.string(), now: v.number() },
  handler: async (ctx, { timeframe, now }) => {
    await requireAdmin(ctx)
    const tf = TIMEFRAMES[timeframe] ?? TIMEFRAMES.week
    const today = dayKey(now)
    const startDate = addDays(today, -(tf.daysBack - 1))
    const start = dayStartMs(startDate)
    const rows = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_ts", (q) => q.gte("ts", start))
      .take(20000)
    return rows
      .filter((r) => !r.isStaff)
      .map((r) => ({
        ts: r.ts,
        type: r.type,
        path: r.path,
        visitorId: r.visitorId,
        sessionId: r.sessionId,
        source: r.source ?? "",
        clickSource: r.clickSource ?? "",
        menuItemName: r.menuItemName ?? "",
        menu: r.menu ?? "",
        cta: r.cta ?? "",
        entityId: r.entityId ?? "",
        entityTitle: r.entityTitle ?? "",
        buttonKey: r.buttonKey ?? "",
        dwellMs: r.dwellMs ?? "",
        destination: r.destination ?? "",
      }))
  },
})

// --- Admin: home command-center summary --------------------------------------

/** Is a schedulable marketing entity live at `now`? */
function liveAt(
  doc: { active: boolean; startsAt?: number; endsAt?: number },
  now: number,
): boolean {
  if (!doc.active) return false
  if (doc.startsAt != null && now < doc.startsAt) return false
  if (doc.endsAt != null && now > doc.endsAt) return false
  return true
}

/**
 * One-shot summary powering the admin home "command center": today's traffic
 * snapshot (vs yesterday), unread inquiries, pending reviews, live/scheduled
 * campaigns, the week's top item, and a computed list of things needing
 * attention. Kept lightweight (no chart payloads) so it loads instantly.
 */
export const getHomeSummary = query({
  args: { now: v.number() },
  handler: async (ctx, { now }) => {
    await requireAdmin(ctx)
    const today = dayKey(now)
    const yesterday = addDays(today, -1)

    // Today (live) vs yesterday (rollup, falling back to a live aggregate).
    const todayStats = aggregateEvents(await fetchDayEvents(ctx, today))
    const yRollups = await readRollups(ctx, yesterday, today)
    const yStats = yRollups.get(yesterday) ?? aggregateEvents(await fetchDayEvents(ctx, yesterday))

    // Inquiries + reviews (mirror inquiries.counts / reviews.stats).
    const [contact, hiring, captures, reviews, announcements, popups, items] = await Promise.all([
      ctx.db.query("contactSubmissions").collect(),
      ctx.db.query("hiringSubmissions").collect(),
      ctx.db.query("emailCaptures").collect(),
      ctx.db.query("reviews").collect(),
      ctx.db.query("announcements").collect(),
      ctx.db.query("popups").collect(),
      ctx.db.query("menuItems").collect(),
    ])

    const contactUnread = contact.reduce((n, r) => n + (r.read ? 0 : 1), 0)
    const hiringUnread = hiring.reduce((n, r) => n + (r.read ? 0 : 1), 0)
    const weekAgo = now - 7 * 86_400_000
    let pendingReviews = 0
    let newReviews = 0
    for (const r of reviews) {
      if (r.status === "pending") pendingReviews++
      if (r._creationTime >= weekAgo) newReviews++
    }

    // Live + scheduled campaigns.
    const liveAnnouncement =
      announcements
        .filter((a) => liveAt(a, now))
        .sort(
          (a, b) => (b.startsAt ?? 0) - (a.startsAt ?? 0) || b._creationTime - a._creationTime,
        )[0] ?? null
    // One live pop-up per position.
    const livePopupByPos = new Map<string, (typeof popups)[number]>()
    for (const p of popups.filter((pp) => liveAt(pp, now))) {
      const cur = livePopupByPos.get(p.position)
      if (
        !cur ||
        (p.startsAt ?? 0) > (cur.startsAt ?? 0) ||
        ((p.startsAt ?? 0) === (cur.startsAt ?? 0) && p._creationTime > cur._creationTime)
      )
        livePopupByPos.set(p.position, p)
    }
    const livePopups = [...livePopupByPos.values()]
    const scheduledCount =
      announcements.filter((a) => a.active && a.startsAt != null && now < a.startsAt).length +
      popups.filter((p) => p.active && p.startsAt != null && now < p.startsAt).length

    // Top item over the last 7 days (by detail views).
    const win = await loadWindow(ctx, "week", now)
    const itemViews: Record<string, number> = {}
    for (const d of win.perDay) mergeMap(itemViews, d.itemViews)
    let topKey = ""
    let topViews = 0
    for (const [k, c] of Object.entries(itemViews)) {
      if (c > topViews) {
        topViews = c
        topKey = k
      }
    }
    let topItem: {
      name: string
      menu: string
      slug: string | null
      views: number
    } | null = null
    if (topKey) {
      const sep = topKey.indexOf("|")
      const menu = sep >= 0 ? topKey.slice(0, sep) : ""
      const name = sep >= 0 ? topKey.slice(sep + 1) : topKey
      const match = items.find((i) => i.menu === menu && i.name === name)
      topItem = { name, menu, slug: match?.slug ?? null, views: topViews }
    }

    // Computed alerts (most actionable first).
    type Alert = { level: "warning" | "info"; text: string; section: string }
    const alerts: Alert[] = []
    const unreadTotal = contactUnread + hiringUnread
    if (unreadTotal > 0)
      alerts.push({
        level: "warning",
        text: `${unreadTotal} unread ${unreadTotal === 1 ? "inquiry" : "inquiries"}`,
        section: "inquiries",
      })
    if (pendingReviews > 0)
      alerts.push({
        level: "warning",
        text: `${pendingReviews} ${pendingReviews === 1 ? "review" : "reviews"} awaiting moderation`,
        section: "reviews",
      })
    // Campaigns ending within 24h.
    const soon = now + 86_400_000
    const ending: { title: string; endsAt: number; section: string }[] = []
    if (liveAnnouncement?.endsAt != null)
      ending.push({
        title: liveAnnouncement.internalTitle,
        endsAt: liveAnnouncement.endsAt,
        section: "announcements",
      })
    for (const p of livePopups)
      if (p.endsAt != null)
        ending.push({ title: p.internalTitle, endsAt: p.endsAt, section: "popups" })
    for (const c of ending) {
      if (c.endsAt <= soon) {
        const hrs = Math.max(1, Math.round((c.endsAt - now) / 3_600_000))
        alerts.push({
          level: "info",
          text: `"${c.title}" ends in ~${hrs}h`,
          section: c.section,
        })
      }
    }
    if (!liveAnnouncement && announcements.length > 0)
      alerts.push({
        level: "info",
        text: "No announcement bar is live right now",
        section: "announcements",
      })

    return {
      today: {
        date: today,
        pageViews: todayStats.pageViews,
        visitors: todayStats.visitors,
        orderClicks: todayStats.orderClicks,
        menuClicks: todayStats.menuClicks,
        prev: {
          pageViews: yStats.pageViews,
          visitors: yStats.visitors,
          orderClicks: yStats.orderClicks,
          menuClicks: yStats.menuClicks,
        },
      },
      inquiries: {
        unread: unreadTotal,
        contactUnread,
        hiringUnread,
        captures: captures.length,
      },
      reviews: {
        pending: pendingReviews,
        total: reviews.length,
        newThisWeek: newReviews,
      },
      campaigns: {
        liveAnnouncement: liveAnnouncement
          ? { id: liveAnnouncement._id, title: liveAnnouncement.internalTitle }
          : null,
        livePopups: livePopups.map((p) => ({
          id: p._id,
          title: p.internalTitle,
          position: p.position,
        })),
        scheduledCount,
      },
      topItem,
      alerts,
    }
  },
})
