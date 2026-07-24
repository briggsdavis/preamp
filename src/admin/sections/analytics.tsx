import { api } from "@convex/_generated/api"
import { useQuery, useConvex } from "convex/react"
import { Fragment, useMemo, useState } from "react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  C,
  PIE,
  nf,
  pct,
  duration,
  titleCase,
  formatBucket,
  pageName,
  TimeframeBar,
  Card,
  CardTitle,
  Empty,
  Kpi,
  PlainStat,
  MiniBars,
  TrendChart,
  ExportButton,
} from "@/admin/analytics-shared"
import { downloadCsv } from "@/admin/csv"

/**
 * The admin analytics dashboard. A view toggle switches between the traffic
 * Overview, the Ordering breakdown, per-item Menu analytics, and the
 * Announcement / Pop-up marketing analytics. Every view reacts to the shared
 * timeframe selector and can be exported to CSV (aggregated or raw events).
 */

const VIEWS = [
  { id: "overview", label: "Overview" },
  { id: "ordering", label: "Ordering" },
  { id: "menu", label: "Menu Items" },
  { id: "announcements", label: "Announcements" },
  { id: "popups", label: "Pop-ups" },
] as const

type View = (typeof VIEWS)[number]["id"]

export function Analytics() {
  const [timeframe, setTimeframe] = useState<string>("week")
  const [view, setView] = useState<View>("overview")
  // Fix "now" per load so the query args are stable; bump it to refresh.
  const [now, setNow] = useState(() => Date.now())
  const convex = useConvex()

  const data = useQuery(api.analytics.getDashboard, { timeframe, now })
  const reviewStats = useQuery(api.reviews.stats)
  const menuData = useQuery(
    api.analytics.getMenuAnalytics,
    view === "menu" ? { timeframe, now } : "skip",
  )
  const marketing = useQuery(
    api.analytics.getMarketingAnalytics,
    view === "announcements" || view === "popups" ? { timeframe, now } : "skip",
  )

  const rangeLabel = useMemo(() => {
    if (!data) return ""
    const fmt = (d: string) => formatBucket(d)
    return data.range.start === data.range.end
      ? fmt(data.range.start)
      : `${fmt(data.range.start)} – ${fmt(data.range.end)}`
  }, [data])

  /** Export the aggregated numbers currently on screen. */
  function exportAggregated() {
    const stamp = `${timeframe}-${data?.range.end ?? ""}`
    if (view === "menu" && menuData) {
      downloadCsv(
        `preamp-menu-items-${stamp}.csv`,
        menuData.rows.map((r) => ({
          item: r.name,
          menu: r.menu,
          section: r.section,
          views: r.views,
          order_clicks: r.orders,
          conversion: pct(r.views > 0 ? r.orders / r.views : 0),
        })),
        ["item", "menu", "section", "views", "order_clicks", "conversion"],
      )
      return
    }
    if (view === "announcements" && marketing) {
      downloadCsv(
        `preamp-announcements-${stamp}.csv`,
        marketing.announcements.map((a) => ({
          announcement: a.title,
          active: a.active,
          views: a.views,
          clicks: a.clicks,
          ctr: pct(a.ctr),
        })),
        ["announcement", "active", "views", "clicks", "ctr"],
      )
      return
    }
    if (view === "popups" && marketing) {
      downloadCsv(
        `preamp-popups-${stamp}.csv`,
        marketing.popups.map((p) => ({
          popup: p.title,
          active: p.active,
          position: p.position,
          views: p.views,
          button_clicks: p.clicks,
          closes: p.closes,
          emails: p.emails,
          avg_dwell_seconds: Math.round(p.avgDwellMs / 1000),
          ctr: pct(p.ctr),
        })),
        [
          "popup",
          "active",
          "position",
          "views",
          "button_clicks",
          "closes",
          "emails",
          "avg_dwell_seconds",
          "ctr",
        ],
      )
      return
    }
    if (!data) return
    // Overview / Ordering: a flat section/label/value sheet.
    const rows: { section: string; label: string; value: string | number }[] = []
    const k = data.kpis
    rows.push({ section: "KPI", label: "Page Views", value: k.pageViews })
    rows.push({ section: "KPI", label: "Visitors", value: k.visitors })
    rows.push({ section: "KPI", label: "Order Clicks", value: k.orderClicks })
    rows.push({ section: "KPI", label: "Menu Clicks", value: k.menuClicks })
    rows.push({
      section: "KPI",
      label: "Order Click Rate",
      value: pct(k.orderClickRate),
    })
    for (const p of data.topPages)
      rows.push({ section: "Top Pages", label: pageName(p.key), value: p.count })
    for (const s of data.sources)
      rows.push({ section: "Sources", label: titleCase(s.key), value: s.count })
    for (const o of data.orderByItem)
      rows.push({ section: "Order Clicks by Item", label: o.key, value: o.count })
    for (const o of data.orderBySource)
      rows.push({
        section: "Order Clicks by Button",
        label: titleCase(o.key),
        value: o.count,
      })
    downloadCsv(`preamp-analytics-${stamp}.csv`, rows, ["section", "label", "value"])
  }

  /** Fetch + download the raw event rows for this timeframe on demand. */
  async function exportRaw() {
    const rows = await convex.query(api.analytics.exportRawEvents, {
      timeframe,
      now,
    })
    const stamp = `${timeframe}-${data?.range.end ?? ""}`
    downloadCsv(
      `preamp-raw-events-${stamp}.csv`,
      rows.map((r) => ({
        ...r,
        // ISO timestamp alongside the epoch ms for readability.
        timestamp: new Date(r.ts).toISOString(),
      })),
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-espresso">Analytics</h1>
          <p className="mt-1 text-sm text-espresso/60">
            First-party traffic &amp; engagement · {rangeLabel || "…"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButton
            onClick={exportAggregated}
            title="Export the numbers shown for this timeframe"
          >
            Export CSV
          </ExportButton>
          <ExportButton
            onClick={() => void exportRaw()}
            title="Export raw event rows (within the retention window)"
          >
            Raw events
          </ExportButton>
          <button
            type="button"
            onClick={() => setNow(Date.now())}
            className="rounded-full border-2 border-espresso/20 px-4 py-2 text-sm font-semibold text-espresso transition-colors hover:bg-espresso/5"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* View toggle */}
      <div className="mb-5 inline-flex flex-wrap rounded-full border-2 border-sand bg-cream p-1">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              view === v.id ? "bg-brick text-cream" : "text-espresso/70 hover:bg-cream-deep"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Timeframe selector - applies to every view */}
      <div className="mb-7">
        <TimeframeBar value={timeframe} onChange={setTimeframe} />
      </div>

      {data === undefined ? (
        <DashboardSkeleton />
      ) : view === "overview" ? (
        <Dashboard data={data} reviewStats={reviewStats} />
      ) : view === "ordering" ? (
        <OrderingDashboard data={data} />
      ) : view === "menu" ? (
        <MenuItemsDashboard data={menuData} />
      ) : view === "announcements" ? (
        <AnnouncementsDashboard data={marketing} />
      ) : (
        <PopupsDashboard data={marketing} />
      )}
    </div>
  )
}

type DashboardData = NonNullable<ReturnType<typeof useQuery<typeof api.analytics.getDashboard>>>
type ReviewStats = NonNullable<ReturnType<typeof useQuery<typeof api.reviews.stats>>>
type MenuData = ReturnType<typeof useQuery<typeof api.analytics.getMenuAnalytics>>
type Marketing = ReturnType<typeof useQuery<typeof api.analytics.getMarketingAnalytics>>

function Dashboard({
  data,
  reviewStats,
}: {
  data: DashboardData
  reviewStats: ReviewStats | undefined
}) {
  const { kpis, trend, topPages, sources, funnel, orderBySource, menuByKind, ctaClicks } = data
  const hasData =
    kpis.pageViews > 0 || kpis.visitors > 0 || kpis.orderClicks > 0 || kpis.menuClicks > 0

  return (
    <div className="space-y-6">
      {!hasData && (
        <div className="rounded-2xl border-2 border-dashed border-sand bg-cream p-6 text-center text-espresso/60">
          <p className="font-groovy text-xl text-espresso">No data for this period yet</p>
          <p className="mt-1 text-sm">
            Numbers appear here as visits come in. Longer timeframes fill out over time.
          </p>
        </div>
      )}

      {/* KPI scorecards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <Kpi
          label="Page Views"
          value={kpis.pageViews}
          prev={kpis.previous.pageViews}
          hint="Total pages loaded in this period."
        />
        <Kpi
          label="Visitors"
          value={kpis.visitors}
          prev={kpis.previous.visitors}
          hint="Distinct visitors (counted once per day). Approximate - anonymous, cookieless."
        />
        <Kpi
          label="Order Clicks"
          value={kpis.orderClicks}
          prev={kpis.previous.orderClicks}
          hint="Clicks on any 'Order' button. Checkout itself happens on Toast and isn't tracked."
        />
        <Kpi
          label="Menu Clicks"
          value={kpis.menuClicks}
          prev={kpis.previous.menuClicks}
          hint="Clicks on Coffee/Food in the navigation."
        />
        <Kpi
          label="Order Click Rate"
          value={kpis.orderClickRate}
          prev={kpis.previous.orderClickRate}
          isRate
          hint="Share of visitors who clicked an Order button."
        />
        <ReviewsKpi stats={reviewStats} />
      </div>

      {/* Main trend */}
      <Card>
        <CardTitle>Traffic over time</CardTitle>
        <TrendChart
          height={288}
          data={trend as unknown as Record<string, number | string>[]}
          series={[
            { key: "pageViews", name: "Page Views", color: C.terracotta },
            { key: "visitors", name: "Visitors", color: C.gold },
          ]}
        />
      </Card>

      {/* Top pages + sources */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Top Pages</CardTitle>
          {topPages.length === 0 ? (
            <Empty />
          ) : (
            <div className="mt-3 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topPages.map((p) => ({ name: pageName(p.key), count: p.count }))}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={C.sand} horizontal={false} />
                  <XAxis
                    type="number"
                    stroke={C.espresso}
                    tick={{ fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke={C.espresso}
                    tick={{ fontSize: 12 }}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: `2px solid ${C.sand}`,
                      borderRadius: 12,
                      fontSize: 13,
                    }}
                    cursor={{ fill: C.sand, opacity: 0.3 }}
                  />
                  <Bar dataKey="count" name="Views" fill={C.terracotta} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>Where Views Come From</CardTitle>
          {sources.length === 0 ? (
            <Empty />
          ) : (
            <div className="mt-3 flex h-64 w-full items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sources.map((s) => ({ name: titleCase(s.key), value: s.count }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {sources.map((_, i) => (
                      <Cell key={i} fill={PIE[i % PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: `2px solid ${C.sand}`,
                      borderRadius: 12,
                      fontSize: 13,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Funnel */}
      <Card>
        <CardTitle>Conversion Funnel</CardTitle>
        <p className="mt-1 text-xs text-espresso/50">
          Order = clicked through to online ordering; completed orders happen on Toast and
          aren&apos;t tracked.
        </p>
        <Funnel funnel={funnel} />
      </Card>

      {/* Click breakdowns */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardTitle>Order Clicks by Source</CardTitle>
          <MiniBars rows={orderBySource} colorize label="clicks" />
        </Card>
        <Card>
          <CardTitle>Menu Clicks</CardTitle>
          <MiniBars rows={menuByKind} colorize label="clicks" />
        </Card>
        <Card>
          <CardTitle>Other CTA Clicks</CardTitle>
          <MiniBars rows={ctaClicks} label="clicks" />
        </Card>
      </div>
    </div>
  )
}

// --- Ordering view ----------------------------------------------------------

function orderButtonLabel(key: string): string {
  const map: Record<string, string> = {
    navbar: "Navbar",
    featured: "Best Sellers",
    "menu-item": "Menu Item",
    "menu-header": "Menu Header",
    hero: "Hero",
    footer: "Footer",
    "sticky-mobile": "Mobile Bar",
    quiz: "Coffee Quiz",
    location: "Find Us",
    other: "Other",
  }
  return map[key] ?? titleCase(key)
}

function OrderingDashboard({ data }: { data: DashboardData }) {
  const { kpis, funnel, orderBySource, orderByItem, orderTraffic } = data
  const hasOrders = kpis.orderClicks > 0
  const topItem = orderByItem[0]?.key ?? "-"
  const buttonRows = orderBySource.map((r) => ({
    key: orderButtonLabel(r.key),
    count: r.count,
  }))

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-dashed border-sand bg-cream px-5 py-3 text-xs text-espresso/55">
        These numbers measure <span className="font-semibold">Order-button clicks (intent)</span>,
        not completed orders or revenue - checkout happens on Toast and isn&apos;t visible here.
      </div>

      {!hasOrders && (
        <div className="rounded-2xl border-2 border-dashed border-sand bg-cream p-6 text-center text-espresso/60">
          <p className="font-groovy text-xl text-espresso">No order clicks in this period yet</p>
          <p className="mt-1 text-sm">Try a longer timeframe, or check back as traffic comes in.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Order Clicks"
          value={kpis.orderClicks}
          prev={kpis.previous.orderClicks}
          hint="Total clicks on any 'Order' button in this period."
        />
        <Kpi
          label="Order Click Rate"
          value={kpis.orderClickRate}
          prev={kpis.previous.orderClickRate}
          isRate
          hint="Share of visitors who clicked an Order button."
        />
        <PlainStat
          label="People Who Clicked"
          value={nf.format(funnel.orderClickers)}
          hint="Distinct visitors who clicked Order (counted once per day)."
        />
        <PlainStat
          label="Top Item"
          value={topItem}
          hint="Menu item with the most Order-button clicks this period."
        />
      </div>

      <Card>
        <CardTitle>Most-Clicked Items</CardTitle>
        <p className="mt-1 text-xs text-espresso/50">
          Ranked by Order-button clicks on each item (menu cards + Best Sellers).
        </p>
        {orderByItem.length === 0 ? (
          <Empty />
        ) : (
          <div className="mt-3 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={orderByItem.map((p) => ({ name: p.key, count: p.count }))}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={C.sand} horizontal={false} />
                <XAxis
                  type="number"
                  stroke={C.espresso}
                  tick={{ fontSize: 12 }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke={C.espresso}
                  tick={{ fontSize: 12 }}
                  width={130}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: `2px solid ${C.sand}`,
                    borderRadius: 12,
                    fontSize: 13,
                  }}
                  cursor={{ fill: C.sand, opacity: 0.3 }}
                />
                <Bar
                  dataKey="count"
                  name="Order clicks"
                  fill={C.terracotta}
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Which Button They Clicked</CardTitle>
          <MiniBars rows={buttonRows} colorize label="clicks" />
        </Card>
        <Card>
          <CardTitle>Where Order-Clickers Came From</CardTitle>
          <p className="mt-1 text-xs text-espresso/50">
            Traffic source of the visit where the Order click happened. Best-effort - in-app
            browsers often report as “direct”.
          </p>
          {orderTraffic.length === 0 ? (
            <Empty />
          ) : (
            <div className="mt-3 flex h-64 w-full items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderTraffic.map((s) => ({ name: titleCase(s.key), value: s.count }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {orderTraffic.map((_, i) => (
                      <Cell key={i} fill={PIE[i % PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: `2px solid ${C.sand}`,
                      borderRadius: 12,
                      fontSize: 13,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

// --- Menu Items view --------------------------------------------------------

type ItemRow = {
  id: string
  name: string
  menu: string
  sectionId: string
  section: string
  sectionOrder: number
  views: number
  orders: number
}

type SortKey = "views" | "orders" | "conversion" | "name"
type Sort = { key: SortKey; dir: "asc" | "desc" }

/** Order clicks ÷ views - how many lookers went on to click Order. */
function conversion(r: { views: number; orders: number }): number {
  return r.views > 0 ? r.orders / r.views : 0
}

function compareRows(a: ItemRow, b: ItemRow, sort: Sort): number {
  const sign = sort.dir === "asc" ? 1 : -1
  if (sort.key === "name") return sign * a.name.localeCompare(b.name)
  if (sort.key === "conversion") return sign * (conversion(a) - conversion(b)) || b.views - a.views
  if (sort.key === "orders") return sign * (a.orders - b.orders) || b.views - a.views
  return sign * (a.views - b.views) || b.orders - a.orders
}

function MenuItemsDashboard({ data }: { data: MenuData }) {
  const [menuFilter, setMenuFilter] = useState<"all" | "coffee" | "food">("all")
  const [sectionId, setSectionId] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<Sort>({ key: "views", dir: "desc" })
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const rows = useMemo(() => (data?.rows ?? []) as ItemRow[], [data])

  // Sections available for the current menu filter (for the dropdown), ordered
  // the way they appear on the menu (coffee before food, then section order).
  const sectionOptions = useMemo(() => {
    const seen = new Map<string, ItemRow>()
    for (const r of rows) {
      if (menuFilter !== "all" && r.menu !== menuFilter) continue
      if (!seen.has(r.sectionId)) seen.set(r.sectionId, r)
    }
    return [...seen.values()].sort(
      (a, b) =>
        a.menu.localeCompare(b.menu) ||
        a.sectionOrder - b.sectionOrder ||
        a.section.localeCompare(b.section),
    )
  }, [rows, menuFilter])

  const q = search.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (menuFilter === "all" || r.menu === menuFilter) &&
          (sectionId === "all" || r.sectionId === sectionId) &&
          (q === "" || r.name.toLowerCase().includes(q)),
      ),
    [rows, menuFilter, sectionId, q],
  )

  // Group the filtered rows into ordered, sortable section groups.
  const groups = useMemo(() => {
    const byId = new Map<string, ItemRow[]>()
    for (const r of filtered) {
      const arr = byId.get(r.sectionId) ?? []
      arr.push(r)
      byId.set(r.sectionId, arr)
    }
    return [...byId.entries()]
      .map(([id, items]) => ({
        id,
        title: items[0].section,
        menu: items[0].menu,
        sectionOrder: items[0].sectionOrder,
        views: items.reduce((a, r) => a + r.views, 0),
        orders: items.reduce((a, r) => a + r.orders, 0),
        items: [...items].sort((a, b) => compareRows(a, b, sort)),
      }))
      .sort(
        (a, b) =>
          a.menu.localeCompare(b.menu) ||
          a.sectionOrder - b.sectionOrder ||
          a.title.localeCompare(b.title),
      )
  }, [filtered, sort])

  const totals = useMemo(
    () =>
      filtered.reduce((a, r) => ({ views: a.views + r.views, orders: a.orders + r.orders }), {
        views: 0,
        orders: 0,
      }),
    [filtered],
  )

  if (data === undefined) return <DashboardSkeleton />

  const hasAnyData = data.totals.views > 0 || data.totals.orders > 0
  const maxViews = Math.max(...filtered.map((r) => r.views), 1)
  const allCollapsed = groups.length > 0 && groups.every((g) => collapsed.has(g.id))

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "desc" ? "asc" : "desc" }
        : { key, dir: key === "name" ? "asc" : "desc" },
    )
  }

  function setMenu(m: "all" | "coffee" | "food") {
    setMenuFilter(m)
    setSectionId("all") // sections belong to a menu; reset when it changes
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-dashed border-sand bg-cream px-5 py-3 text-xs text-espresso/55">
        A <span className="font-semibold">view</span> is a visitor opening an item's page/detail;{" "}
        <span className="font-semibold">order clicks</span> are that item's Order-button clicks;{" "}
        <span className="font-semibold">conv.</span> is order clicks ÷ views. Use the filters to
        focus on one menu or section.
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <PlainStat
          label="Item Views"
          value={nf.format(totals.views)}
          hint="Menu-item detail opens for the current filter this period."
        />
        <PlainStat
          label="Order Clicks"
          value={nf.format(totals.orders)}
          hint="Per-item Order-button clicks for the current filter this period."
        />
        <PlainStat
          label="Conversion"
          value={pct(conversion(totals))}
          hint="Order clicks ÷ views for the current filter."
        />
        <PlainStat
          label="Items Shown"
          value={nf.format(filtered.length)}
          sub={menuFilter === "all" ? "all menus" : `${menuFilter} menu`}
          hint="How many menu items match the current filter."
        />
      </div>

      <Card>
        <CardTitle>Views over time</CardTitle>
        <TrendChart
          data={data.trend as unknown as Record<string, number | string>[]}
          series={[
            { key: "views", name: "Item Views", color: C.terracotta },
            { key: "clicks", name: "Order Clicks", color: C.gold },
          ]}
        />
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Every Item, By Section</CardTitle>
          {groups.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setCollapsed(allCollapsed ? new Set() : new Set(groups.map((g) => g.id)))
              }
              className="text-xs font-semibold text-terracotta hover:underline"
            >
              {allCollapsed ? "Expand all" : "Collapse all"}
            </button>
          )}
        </div>

        {/* Filter bar */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border-2 border-sand bg-cream p-0.5">
            {(["all", "coffee", "food"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMenu(m)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  menuFilter === m ? "bg-brick text-cream" : "text-espresso/70 hover:bg-cream-deep"
                }`}
              >
                {m === "all" ? "All menus" : m}
              </button>
            ))}
          </div>

          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="rounded-full border-2 border-sand bg-cream px-4 py-1.5 text-xs font-semibold text-espresso outline-none focus:border-terracotta"
          >
            <option value="all">All sections</option>
            {sectionOptions.map((s) => (
              <option key={s.sectionId} value={s.sectionId}>
                {menuFilter === "all" ? `${titleCase(s.menu)} · ${s.section}` : s.section}
              </option>
            ))}
          </select>

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="min-w-[10rem] flex-1 rounded-full border-2 border-sand bg-cream px-4 py-1.5 text-xs text-espresso outline-none placeholder:text-espresso/40 focus:border-terracotta"
          />
        </div>

        {!hasAnyData ? (
          <Empty label="No item views or order clicks in this period yet." />
        ) : filtered.length === 0 ? (
          <Empty label="No items match these filters." />
        ) : (
          <ItemsTable
            groups={groups}
            maxViews={maxViews}
            showMenu={menuFilter === "all"}
            sort={sort}
            onSort={toggleSort}
            collapsed={collapsed}
            onToggleCollapse={(id) =>
              setCollapsed((prev) => {
                const next = new Set(prev)
                if (next.has(id)) next.delete(id)
                else next.add(id)
                return next
              })
            }
          />
        )}
      </Card>
    </div>
  )
}

type Group = {
  id: string
  title: string
  menu: string
  views: number
  orders: number
  items: ItemRow[]
}

function SortHead({
  label,
  sortKey,
  sort,
  onSort,
  align = "left",
}: {
  label: string
  sortKey: SortKey
  sort: Sort
  onSort: (k: SortKey) => void
  align?: "left" | "right"
}) {
  const active = sort.key === sortKey
  return (
    <th className={`py-2 pr-3 font-semibold ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 tracking-wide uppercase transition-colors hover:text-espresso ${
          active ? "text-espresso" : ""
        }`}
      >
        {label}
        <span className={active ? "opacity-100" : "opacity-25"}>
          {active ? (sort.dir === "desc" ? "▼" : "▲") : "▲"}
        </span>
      </button>
    </th>
  )
}

function ItemsTable({
  groups,
  maxViews,
  showMenu,
  sort,
  onSort,
  collapsed,
  onToggleCollapse,
}: {
  groups: Group[]
  maxViews: number
  showMenu: boolean
  sort: Sort
  onSort: (k: SortKey) => void
  collapsed: Set<string>
  onToggleCollapse: (id: string) => void
}) {
  const cols = showMenu ? 5 : 4
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[38rem] text-sm">
        <thead>
          <tr className="border-b-2 border-sand text-left text-xs tracking-wide text-espresso/50 uppercase">
            <SortHead label="Item" sortKey="name" sort={sort} onSort={onSort} />
            {showMenu && <th className="py-2 pr-3 font-semibold">Menu</th>}
            <SortHead label="Views" sortKey="views" sort={sort} onSort={onSort} />
            <SortHead
              label="Order Clicks"
              sortKey="orders"
              sort={sort}
              onSort={onSort}
              align="right"
            />
            <SortHead
              label="Conv."
              sortKey="conversion"
              sort={sort}
              onSort={onSort}
              align="right"
            />
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => {
            const isCollapsed = collapsed.has(g.id)
            return (
              <Fragment key={g.id}>
                <tr className="border-b border-sand/60 bg-cream-deep/40">
                  <td colSpan={cols} className="py-1.5">
                    <button
                      type="button"
                      onClick={() => onToggleCollapse(g.id)}
                      className="flex w-full items-center gap-2 text-left"
                    >
                      <span className="text-espresso/40">{isCollapsed ? "▸" : "▾"}</span>
                      <span className="font-groovy text-xs tracking-[0.15em] text-terracotta uppercase">
                        {showMenu ? `${titleCase(g.menu)} · ${g.title}` : g.title}
                      </span>
                      <span className="text-xs text-espresso/45">
                        {g.items.length} {g.items.length === 1 ? "item" : "items"}
                      </span>
                      <span className="ml-auto text-xs text-espresso/55">
                        {nf.format(g.views)} views · {nf.format(g.orders)} clicks
                      </span>
                    </button>
                  </td>
                </tr>
                {!isCollapsed &&
                  g.items.map((r) => (
                    <tr key={r.id} className="border-b border-sand/60">
                      <td className="py-2 pr-3 font-medium text-espresso">{r.name}</td>
                      {showMenu && (
                        <td className="py-2 pr-3 text-espresso/60 capitalize">{r.menu}</td>
                      )}
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-cream-deep">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(r.views / maxViews) * 100}%`,
                                background: C.terracotta,
                              }}
                            />
                          </div>
                          <span className="text-espresso/80 tabular-nums">
                            {nf.format(r.views)}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-right text-espresso/80 tabular-nums">
                        {nf.format(r.orders)}
                      </td>
                      <td className="py-2 text-right text-espresso/60 tabular-nums">
                        {r.views > 0 ? pct(conversion(r)) : "-"}
                      </td>
                    </tr>
                  ))}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// --- Announcements view -----------------------------------------------------

function AnnouncementsDashboard({ data }: { data: Marketing }) {
  if (data === undefined) return <DashboardSkeleton />
  const rows = data.announcements
  const totals = rows.reduce(
    (a, r) => ({ views: a.views + r.views, clicks: a.clicks + r.clicks }),
    { views: 0, clicks: 0 },
  )
  const ctr = totals.views > 0 ? totals.clicks / totals.views : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <PlainStat
          label="Impressions"
          value={nf.format(totals.views)}
          hint="Times an announcement bar was shown on a page."
        />
        <PlainStat
          label="Button Clicks"
          value={nf.format(totals.clicks)}
          hint="Clicks on an announcement bar's button."
        />
        <PlainStat
          label="Click-Through Rate"
          value={pct(ctr)}
          hint="Button clicks ÷ impressions."
        />
      </div>
      <Card>
        <CardTitle>Announcement Bars</CardTitle>
        {rows.length === 0 ? (
          <Empty label="No announcement bars yet." />
        ) : (
          <MarketingTable
            columns={["Bar", "Status", "Views", "Clicks", "CTR"]}
            rows={rows.map((a) => [
              a.title,
              a.active ? "On" : "Off",
              nf.format(a.views),
              nf.format(a.clicks),
              pct(a.ctr),
            ])}
          />
        )}
      </Card>
    </div>
  )
}

// --- Pop-ups view -----------------------------------------------------------

function PopupsDashboard({ data }: { data: Marketing }) {
  if (data === undefined) return <DashboardSkeleton />
  const rows = data.popups
  const totals = rows.reduce(
    (a, r) => ({
      views: a.views + r.views,
      clicks: a.clicks + r.clicks,
      emails: a.emails + r.emails,
    }),
    { views: 0, clicks: 0, emails: 0 },
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <PlainStat
          label="Impressions"
          value={nf.format(totals.views)}
          hint="Times a pop-up was shown."
        />
        <PlainStat
          label="Button Clicks"
          value={nf.format(totals.clicks)}
          hint="Clicks on a pop-up's call-to-action button."
        />
        <PlainStat
          label="Emails Captured"
          value={nf.format(totals.emails)}
          hint="Email addresses submitted through pop-ups this period."
        />
        <PlainStat
          label="CTR"
          value={pct(totals.views > 0 ? totals.clicks / totals.views : 0)}
          hint="Button clicks ÷ impressions."
        />
      </div>
      <Card>
        <CardTitle>Pop-ups</CardTitle>
        {rows.length === 0 ? (
          <Empty label="No pop-ups yet." />
        ) : (
          <MarketingTable
            columns={["Pop-up", "Status", "Views", "Clicks", "Emails", "Avg. Time", "CTR"]}
            rows={rows.map((p) => [
              p.title,
              p.active ? "On" : "Off",
              nf.format(p.views),
              nf.format(p.clicks),
              nf.format(p.emails),
              duration(p.avgDwellMs),
              pct(p.ctr),
            ])}
          />
        )}
      </Card>
    </div>
  )
}

function MarketingTable({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[34rem] text-sm">
        <thead>
          <tr className="border-b-2 border-sand text-left text-xs tracking-wide text-espresso/50 uppercase">
            {columns.map((c) => (
              <th key={c} className="py-2 pr-3 font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-sand/60">
              {r.map((cellValue, j) => (
                <td
                  key={j}
                  className={`py-2 pr-3 ${
                    j === 0 ? "font-medium text-espresso" : "text-espresso/80 tabular-nums"
                  }`}
                >
                  {cellValue}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// --- Small building blocks --------------------------------------------------

function ReviewsKpi({ stats }: { stats: ReviewStats | undefined }) {
  return (
    <div
      className="rounded-2xl border-2 border-sand bg-cream p-4"
      title="Total visitor reviews submitted (all time). Moderate them under Reviews."
    >
      <p className="text-xs font-semibold tracking-wide text-espresso/55 uppercase">
        Reviews Submitted
      </p>
      <p className="mt-1 font-display text-3xl leading-none text-espresso">
        {stats ? nf.format(stats.total) : "-"}
      </p>
      {stats && stats.newThisWeek > 0 ? (
        <p className="mt-2 text-xs font-semibold text-[#4a7c4e]">
          +{nf.format(stats.newThisWeek)}
          <span className="font-normal text-espresso/40"> this week</span>
        </p>
      ) : (
        <p className="mt-2 text-xs text-espresso/35">
          {stats ? `${nf.format(stats.pending)} pending` : "all-time total"}
        </p>
      )}
    </div>
  )
}

function Funnel({
  funnel,
}: {
  funnel: { visitors: number; menuViewers: number; orderClickers: number }
}) {
  const steps = [
    { name: "Visited site", value: funnel.visitors, color: C.gold },
    { name: "Viewed a menu", value: funnel.menuViewers, color: C.orange },
    { name: "Clicked Order", value: funnel.orderClickers, color: C.terracotta },
  ]
  const max = Math.max(funnel.visitors, 1)
  return (
    <div className="mt-4 space-y-3">
      {steps.map((s, i) => {
        const fromPrev = i === 0 ? null : steps[i - 1].value > 0 ? s.value / steps[i - 1].value : 0
        return (
          <div key={s.name}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-semibold text-espresso">{s.name}</span>
              <span className="text-espresso/70">
                {nf.format(s.value)}
                {fromPrev !== null && (
                  <span className="ml-2 text-xs text-espresso/45">
                    {pct(fromPrev)} of previous step
                  </span>
                )}
              </span>
            </div>
            <div className="h-7 w-full overflow-hidden rounded-lg bg-cream-deep">
              <div
                className="h-full rounded-lg transition-all"
                style={{
                  width: `${Math.max((s.value / max) * 100, s.value > 0 ? 4 : 0)}%`,
                  background: s.color,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border-2 border-sand bg-cream" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl border-2 border-sand bg-cream" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl border-2 border-sand bg-cream" />
        <div className="h-72 animate-pulse rounded-2xl border-2 border-sand bg-cream" />
      </div>
    </div>
  )
}
