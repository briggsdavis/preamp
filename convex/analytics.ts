import { mutation, query, internalMutation } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./admin";

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
 *  - Order clicks measure *intent* — actual checkout happens off-site on Toast.
 *  - Signed-in admins are flagged `isStaff` and excluded from every number.
 */

const TZ = "America/New_York";
const RAW_RETENTION_DAYS = 90; // raw events older than this are pruned
const MAX_FINALIZE_PER_RUN = 90; // safety cap on catch-up days per cron run

const VALID_TYPES = new Set([
  "page_view",
  "order_click",
  "menu_click",
  "cta_click",
]);

// --- Time helpers (shop-local calendar math) --------------------------------

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Which shop-local day (YYYY-MM-DD) a timestamp falls in. */
function dayKey(ts: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(
    new Date(ts),
  );
}

/** Shop-local hour (0–23) for a timestamp. */
function hourOf(ts: number): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    hour: "2-digit",
  });
  let h = Number(dtf.formatToParts(new Date(ts)).find((p) => p.type === "hour")!
    .value);
  if (h === 24) h = 0;
  return h;
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
  });
  const p: Record<string, string> = {};
  for (const part of dtf.formatToParts(new Date(ts))) p[part.type] = part.value;
  let hour = Number(p.hour);
  if (hour === 24) hour = 0;
  const asUTC = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    hour,
    Number(p.minute),
    Number(p.second),
  );
  return asUTC - ts;
}

/** Epoch ms of shop-local midnight that begins `dateKey`. */
function dayStartMs(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, 0, 0, 0);
  const off = tzOffsetMs(guess);
  let start = guess - off;
  const off2 = tzOffsetMs(start); // refine across DST transitions
  if (off2 !== off) start = guess - off2;
  return start;
}

/** Calendar-date arithmetic on YYYY-MM-DD (UTC-anchored, DST-safe). */
function addDays(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d) + delta * 86400000;
  const nd = new Date(t);
  return `${nd.getUTCFullYear()}-${pad(nd.getUTCMonth() + 1)}-${pad(
    nd.getUTCDate(),
  )}`;
}

// --- Aggregation ------------------------------------------------------------

type DayStats = {
  pageViews: number;
  visitors: number;
  perPage: Record<string, number>;
  sources: Record<string, number>;
  orderClicks: number;
  orderBySource: Record<string, number>;
  orderByItem: Record<string, number>;
  orderTraffic: Record<string, number>;
  menuClicks: number;
  menuByKind: Record<string, number>;
  ctaClicks: Record<string, number>;
  funnelMenuViewers: number;
  funnelOrderClickers: number;
};

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
  };
}

function bump(map: Record<string, number>, key: string, by = 1) {
  map[key] = (map[key] ?? 0) + by;
}

/** Fold a day's raw events (already staff-filtered) into a stats document. */
function aggregateEvents(events: Doc<"analyticsEvents">[]): DayStats {
  const s = emptyStats();
  const visitors = new Set<string>();
  const menuViewers = new Set<string>();
  const orderClickers = new Set<string>();

  for (const e of events) {
    switch (e.type) {
      case "page_view": {
        s.pageViews++;
        visitors.add(e.visitorId);
        bump(s.perPage, e.path || "/");
        bump(s.sources, e.source || "direct");
        if (e.path.startsWith("/menu")) menuViewers.add(e.visitorId);
        break;
      }
      case "order_click": {
        s.orderClicks++;
        bump(s.orderBySource, e.clickSource || "other");
        if (e.menuItemName) bump(s.orderByItem, e.menuItemName);
        bump(s.orderTraffic, e.source || "direct");
        orderClickers.add(e.visitorId);
        break;
      }
      case "menu_click": {
        s.menuClicks++;
        bump(s.menuByKind, e.menu || "other");
        menuViewers.add(e.visitorId);
        break;
      }
      case "cta_click": {
        bump(s.ctaClicks, e.cta || "other");
        break;
      }
    }
  }

  s.visitors = visitors.size;
  s.funnelMenuViewers = menuViewers.size;
  s.funnelOrderClickers = orderClickers.size;
  return s;
}

async function fetchDayEvents(
  ctx: QueryCtx | MutationCtx,
  dateKey: string,
): Promise<Doc<"analyticsEvents">[]> {
  const start = dayStartMs(dateKey);
  const end = dayStartMs(addDays(dateKey, 1));
  const rows = await ctx.db
    .query("analyticsEvents")
    .withIndex("by_ts", (q) => q.gte("ts", start).lt("ts", end))
    .collect();
  return rows.filter((r) => !r.isStaff);
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
  },
  handler: async (ctx, args) => {
    if (!VALID_TYPES.has(args.type)) return; // ignore unknown event types
    if (!args.visitorId || args.visitorId.length > 64) return;

    // Exclude staff: anyone signed in is an admin (see admin.ts). We still
    // record the event (flagged) so totals can be audited, but rollups skip it.
    const userId = await getAuthUserId(ctx);

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
      isStaff: userId !== null,
      ts: Date.now(),
    });
  },
});

// --- Internal: hourly rollup + prune ----------------------------------------

type CountEntry = { key: string; count: number };

function rec2arr(r: Record<string, number>): CountEntry[] {
  return Object.entries(r).map(([key, count]) => ({ key, count }));
}

function arr2rec(a: CountEntry[]): Record<string, number> {
  const r: Record<string, number> = {};
  for (const { key, count } of a) r[key] = count;
  return r;
}

async function upsertDay(ctx: MutationCtx, date: string, stats: DayStats) {
  const existing = await ctx.db
    .query("analyticsDaily")
    .withIndex("by_date", (q) => q.eq("date", date))
    .unique();
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
  };
  if (existing) await ctx.db.patch(existing._id, doc);
  else await ctx.db.insert("analyticsDaily", doc);
}

export const rollup = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const today = dayKey(now);

    let state = await ctx.db.query("analyticsState").first();
    if (!state) {
      const id = await ctx.db.insert("analyticsState", {});
      state = await ctx.db.get(id);
    }

    // Decide the first day that still needs finalizing.
    let cursor: string | null = null;
    if (state?.rolledThrough) {
      cursor = addDays(state.rolledThrough, 1);
    } else {
      const earliest = await ctx.db.query("analyticsEvents").withIndex("by_ts").first();
      if (earliest) cursor = dayKey(earliest.ts);
    }

    // Finalize completed past days (catches up any gaps), bounded per run.
    let finalized = 0;
    while (cursor && cursor < today && finalized < MAX_FINALIZE_PER_RUN) {
      const events = await fetchDayEvents(ctx, cursor);
      await upsertDay(ctx, cursor, aggregateEvents(events));
      if (state) await ctx.db.patch(state._id, { rolledThrough: cursor });
      cursor = addDays(cursor, 1);
      finalized++;
    }

    // Always refresh today's (not-yet-final) rollup.
    const todayEvents = await fetchDayEvents(ctx, today);
    await upsertDay(ctx, today, aggregateEvents(todayEvents));

    // Prune raw events past the retention window (rollups keep the history).
    const cutoff = dayStartMs(addDays(today, -RAW_RETENTION_DAYS));
    const stale = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_ts", (q) => q.lt("ts", cutoff))
      .take(2000);
    for (const row of stale) await ctx.db.delete(row._id);

    return { finalized, today };
  },
});

// --- Admin: the dashboard payload -------------------------------------------

type Timeframe = {
  daysBack: number;
  granularity: "hour" | "day" | "week" | "month";
};

const TIMEFRAMES: Record<string, Timeframe> = {
  today: { daysBack: 1, granularity: "hour" },
  week: { daysBack: 7, granularity: "day" },
  month: { daysBack: 30, granularity: "day" },
  "3months": { daysBack: 90, granularity: "week" },
  "6months": { daysBack: 180, granularity: "week" },
  year: { daysBack: 365, granularity: "month" },
  "2years": { daysBack: 730, granularity: "month" },
};

function mergeMap(into: Record<string, number>, from: Record<string, number>) {
  for (const [k, val] of Object.entries(from)) into[k] = (into[k] ?? 0) + val;
}

function topEntries(map: Record<string, number>, limit?: number) {
  const arr = Object.entries(map)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
  return limit ? arr.slice(0, limit) : arr;
}

function totalsOf(days: DayStats[]) {
  let pageViews = 0;
  let visitors = 0;
  let orderClicks = 0;
  let menuClicks = 0;
  let orderClickers = 0;
  for (const d of days) {
    pageViews += d.pageViews;
    visitors += d.visitors;
    orderClicks += d.orderClicks;
    menuClicks += d.menuClicks;
    orderClickers += d.funnelOrderClickers;
  }
  return { pageViews, visitors, orderClicks, menuClicks, orderClickers };
}

/** Read finalized rollups for [startDate, endDateExclusive). */
async function readRollups(
  ctx: QueryCtx,
  startDate: string,
  endExclusive: string,
): Promise<Map<string, DayStats>> {
  const rows = await ctx.db
    .query("analyticsDaily")
    .withIndex("by_date", (q) =>
      q.gte("date", startDate).lt("date", endExclusive),
    )
    .collect();
  const map = new Map<string, DayStats>();
  for (const r of rows) {
    map.set(r.date, {
      pageViews: r.pageViews,
      visitors: r.visitors,
      perPage: arr2rec(r.perPage),
      sources: arr2rec(r.sources),
      orderClicks: r.orderClicks,
      orderBySource: arr2rec(r.orderBySource),
      orderByItem: arr2rec(r.orderByItem),
      orderTraffic: arr2rec(r.orderTraffic),
      menuClicks: r.menuClicks,
      menuByKind: arr2rec(r.menuByKind),
      ctaClicks: arr2rec(r.ctaClicks),
      funnelMenuViewers: r.funnelMenuViewers,
      funnelOrderClickers: r.funnelOrderClickers,
    });
  }
  return map;
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
    const today = dayKey(Date.now());
    const paths = ["/", "/menu/coffee", "/menu/food", "/about", "/contact", "/events"];
    const srcs = ["direct", "instagram", "google", "tiktok", "yelp"];
    const ctas = ["directions", "instagram", "tiktok", "gift_card"];
    const orderItems = [
      "Smokey Robinson", "Yuzu Espresso Tonic", "Latte", "Focaccia Sandwich",
      "Pre Amp Cheeseburger", "Kyoto Cold Brew", "Matcha Latte",
    ];
    const orderButtons = [
      "navbar", "featured", "menu-item", "menu-header", "hero",
      "footer", "sticky-mobile", "quiz", "location",
    ];
    const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
    let inserted = 0;

    for (let d = days - 1; d >= 0; d--) {
      const date = addDays(today, -d);
      const start = dayStartMs(date);
      const views = 15 + Math.floor(Math.random() * 55);
      const pool = Math.max(6, Math.floor(views * 0.7));
      for (let i = 0; i < views; i++) {
        const vid = `seed-${date}-${Math.floor(Math.random() * pool)}`;
        const sid = `${vid}-s`;
        const ts = start + Math.floor(Math.random() * 86_400_000);
        const path = pick(paths);
        await ctx.db.insert("analyticsEvents", {
          type: "page_view", path, visitorId: vid, sessionId: sid,
          source: pick(srcs), isStaff: false, ts,
        });
        inserted++;
        if (Math.random() < 0.15)
          await ctx.db.insert("analyticsEvents", {
            type: "menu_click", path: "/", visitorId: vid, sessionId: sid,
            menu: Math.random() < 0.6 ? "coffee" : "food", clickSource: "navbar",
            isStaff: false, ts,
          });
        if (Math.random() < 0.08) {
          const button = pick(orderButtons);
          await ctx.db.insert("analyticsEvents", {
            type: "order_click", path, visitorId: vid, sessionId: sid,
            clickSource: button,
            // Per-item clicks come from the menu item buttons.
            menuItemName: button === "menu-item" ? pick(orderItems) : undefined,
            source: pick(srcs), isStaff: false, ts,
          });
        }
        if (Math.random() < 0.05)
          await ctx.db.insert("analyticsEvents", {
            type: "cta_click", path, visitorId: vid, sessionId: sid,
            cta: pick(ctas), isStaff: false, ts,
          });
      }
      await upsertDay(ctx, date, aggregateEvents(await fetchDayEvents(ctx, date)));
    }
    return { inserted, days };
  },
});

export const getDashboard = query({
  args: { timeframe: v.string(), now: v.number() },
  handler: async (ctx, { timeframe, now }) => {
    await requireAdmin(ctx);
    const tf = TIMEFRAMES[timeframe] ?? TIMEFRAMES.week;
    const today = dayKey(now);
    const startDate = addDays(today, -(tf.daysBack - 1));

    // History from rollups; today computed live (bounded to one day).
    const rollups = await readRollups(ctx, startDate, today);
    const todayStats = aggregateEvents(await fetchDayEvents(ctx, today));

    // Ordered per-day stats across the whole window (missing days → zeros).
    const dates: string[] = [];
    for (let dk = startDate; dk <= today; dk = addDays(dk, 1)) dates.push(dk);
    const perDay = dates.map((dk) =>
      dk === today ? todayStats : (rollups.get(dk) ?? emptyStats()),
    );

    // --- KPIs + previous-period deltas ---
    const cur = totalsOf(perDay);
    const prevStart = addDays(startDate, -tf.daysBack);
    const prevRollups = await readRollups(ctx, prevStart, startDate);
    const prev = totalsOf([...prevRollups.values()]);

    // --- Trend buckets ---
    type Bucket = { label: string; pageViews: number; visitors: number };
    let trend: Bucket[] = [];
    if (tf.granularity === "hour") {
      const events = await fetchDayEvents(ctx, today);
      const hours: { views: number; vis: Set<string> }[] = Array.from(
        { length: 24 },
        () => ({ views: 0, vis: new Set<string>() }),
      );
      for (const e of events) {
        if (e.type !== "page_view") continue;
        const h = hourOf(e.ts);
        hours[h].views++;
        hours[h].vis.add(e.visitorId);
      }
      trend = hours.map((h, i) => ({
        label: `${i}:00`,
        pageViews: h.views,
        visitors: h.vis.size,
      }));
    } else if (tf.granularity === "day") {
      trend = perDay.map((d, i) => ({
        label: dates[i],
        pageViews: d.pageViews,
        visitors: d.visitors,
      }));
    } else if (tf.granularity === "week") {
      for (let i = 0; i < perDay.length; i += 7) {
        const chunk = perDay.slice(i, i + 7);
        trend.push({
          label: dates[i],
          pageViews: chunk.reduce((a, d) => a + d.pageViews, 0),
          visitors: chunk.reduce((a, d) => a + d.visitors, 0),
        });
      }
    } else {
      const byMonth = new Map<string, Bucket>();
      perDay.forEach((d, i) => {
        const month = dates[i].slice(0, 7); // YYYY-MM
        const b = byMonth.get(month) ?? {
          label: month,
          pageViews: 0,
          visitors: 0,
        };
        b.pageViews += d.pageViews;
        b.visitors += d.visitors;
        byMonth.set(month, b);
      });
      trend = [...byMonth.values()];
    }

    // --- Breakdowns merged across the window ---
    const perPage: Record<string, number> = {};
    const sources: Record<string, number> = {};
    const orderBySource: Record<string, number> = {};
    const orderByItem: Record<string, number> = {};
    const orderTraffic: Record<string, number> = {};
    const menuByKind: Record<string, number> = {};
    const ctaClicks: Record<string, number> = {};
    let menuViewers = 0;
    for (const d of perDay) {
      mergeMap(perPage, d.perPage);
      mergeMap(sources, d.sources);
      mergeMap(orderBySource, d.orderBySource);
      mergeMap(orderByItem, d.orderByItem);
      mergeMap(orderTraffic, d.orderTraffic);
      mergeMap(menuByKind, d.menuByKind);
      mergeMap(ctaClicks, d.ctaClicks);
      menuViewers += d.funnelMenuViewers;
    }

    return {
      timeframe,
      range: { start: startDate, end: today },
      kpis: {
        pageViews: cur.pageViews,
        visitors: cur.visitors,
        orderClicks: cur.orderClicks,
        menuClicks: cur.menuClicks,
        orderClickRate:
          cur.visitors > 0 ? cur.orderClickers / cur.visitors : 0,
        previous: {
          pageViews: prev.pageViews,
          visitors: prev.visitors,
          orderClicks: prev.orderClicks,
          menuClicks: prev.menuClicks,
          orderClickRate:
            prev.visitors > 0 ? prev.orderClickers / prev.visitors : 0,
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
    };
  },
});
