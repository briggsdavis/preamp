import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { api } from "@convex/_generated/api";

/**
 * The admin analytics dashboard. Reads a single pre-aggregated payload from
 * `api.analytics.getDashboard` (rollups + live "today") and renders headline
 * numbers plus graphs. Everything reacts to the timeframe selector.
 */

const TIMEFRAMES = [
  { id: "today", label: "Today" },
  { id: "week", label: "1 Week" },
  { id: "month", label: "1 Month" },
  { id: "3months", label: "3 Months" },
  { id: "6months", label: "6 Months" },
  { id: "year", label: "1 Year" },
  { id: "2years", label: "2 Years" },
] as const;

// Brand palette (mirrors the CSS tokens in styles/index.css).
const C = {
  gold: "#d9883b",
  amber: "#e0a042",
  orange: "#ce6b38",
  terracotta: "#b55335",
  brick: "#9e4a3c",
  maroon: "#6b2f26",
  espresso: "#2a1a12",
  sand: "#e3d3b8",
};
const PIE = [C.gold, C.terracotta, C.amber, C.brick, C.orange, C.maroon, "#3b2417", C.sand];

const nf = new Intl.NumberFormat("en-US");

function pct(n: number): string {
  return `${(n * 100).toFixed(n >= 0.1 ? 0 : 1)}%`;
}

/** Friendly label for a trend bucket key ("13:00" | "2026-06-21" | "2026-06"). */
function formatBucket(label: string): string {
  if (/^\d{1,2}:00$/.test(label)) return label;
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
    const [y, m, d] = label.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
  if (/^\d{4}-\d{2}$/.test(label)) {
    const [y, m] = label.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
  }
  return label;
}

/** Map an internal path to a human page name. */
function pageName(path: string): string {
  const map: Record<string, string> = {
    "/": "Home",
    "/menu/coffee": "Coffee Menu",
    "/menu/food": "Food Menu",
    "/about": "About",
    "/contact": "Contact",
    "/events": "Events",
    "/hiring": "Hiring",
    "/retail": "Merch",
    "/gift-cards": "Gift Cards",
  };
  return map[path] ?? path;
}

function titleCase(s: string): string {
  return s.replace(/(^|[\s_-])(\w)/g, (_, p, c) => p.replace(/[_-]/, " ") + c.toUpperCase());
}

const VIEWS = [
  { id: "overview", label: "Overview" },
  { id: "ordering", label: "Ordering" },
] as const;

export function Analytics() {
  const [timeframe, setTimeframe] = useState<string>("week");
  const [view, setView] = useState<"overview" | "ordering">("overview");
  // Fix "now" per load so the query args are stable; bump it to refresh.
  const [now, setNow] = useState(() => Date.now());
  const data = useQuery(api.analytics.getDashboard, { timeframe, now });
  const reviewStats = useQuery(api.reviews.stats);

  const rangeLabel = useMemo(() => {
    if (!data) return "";
    const fmt = (d: string) => formatBucket(d);
    return data.range.start === data.range.end
      ? fmt(data.range.start)
      : `${fmt(data.range.start)} – ${fmt(data.range.end)}`;
  }, [data]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-espresso">Analytics</h1>
          <p className="mt-1 text-sm text-espresso/60">
            First-party traffic &amp; engagement · {rangeLabel || "…"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNow(Date.now())}
          className="rounded-full border-2 border-espresso/20 px-4 py-2 text-sm font-semibold text-espresso transition-colors hover:bg-espresso/5"
        >
          ↻ Refresh
        </button>
      </div>

      {/* View toggle: overview vs a focused ordering breakdown */}
      <div className="mb-5 inline-flex rounded-full border-2 border-sand bg-cream p-1">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              view === v.id
                ? "bg-brick text-cream"
                : "text-espresso/70 hover:bg-cream-deep"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Timeframe selector — applies to both views */}
      <div className="mb-7 flex flex-wrap gap-2">
        {TIMEFRAMES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTimeframe(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              timeframe === t.id
                ? "bg-brick text-cream"
                : "border-2 border-sand bg-cream text-espresso/70 hover:bg-cream-deep"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {data === undefined ? (
        <DashboardSkeleton />
      ) : view === "overview" ? (
        <Dashboard data={data} reviewStats={reviewStats} />
      ) : (
        <OrderingDashboard data={data} />
      )}
    </div>
  );
}

type DashboardData = NonNullable<
  ReturnType<typeof useQuery<typeof api.analytics.getDashboard>>
>;

type ReviewStats = NonNullable<
  ReturnType<typeof useQuery<typeof api.reviews.stats>>
>;

function Dashboard({
  data,
  reviewStats,
}: {
  data: DashboardData;
  reviewStats: ReviewStats | undefined;
}) {
  const { kpis, trend, topPages, sources, funnel, orderBySource, menuByKind, ctaClicks } =
    data;
  const hasData =
    kpis.pageViews > 0 ||
    kpis.visitors > 0 ||
    kpis.orderClicks > 0 ||
    kpis.menuClicks > 0;

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
        <Kpi label="Page Views" value={kpis.pageViews} prev={kpis.previous.pageViews}
          hint="Total pages loaded in this period." />
        <Kpi label="Visitors" value={kpis.visitors} prev={kpis.previous.visitors}
          hint="Distinct visitors (counted once per day). Approximate — anonymous, cookieless." />
        <Kpi label="Order Clicks" value={kpis.orderClicks} prev={kpis.previous.orderClicks}
          hint="Clicks on any 'Order' button. Checkout itself happens on Toast and isn't tracked." />
        <Kpi label="Menu Clicks" value={kpis.menuClicks} prev={kpis.previous.menuClicks}
          hint="Clicks on Coffee/Food in the navigation." />
        <Kpi label="Order Click Rate" value={kpis.orderClickRate} prev={kpis.previous.orderClickRate}
          isRate hint="Share of visitors who clicked an Order button." />
        <ReviewsKpi stats={reviewStats} />
      </div>

      {/* Main trend */}
      <Card>
        <CardTitle>Traffic over time</CardTitle>
        <div className="mt-3 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.terracotta} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={C.terracotta} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gVis" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.gold} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={C.gold} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.sand} />
              <XAxis dataKey="label" tickFormatter={formatBucket} stroke={C.espresso}
                tick={{ fontSize: 12 }} minTickGap={16} />
              <YAxis stroke={C.espresso} tick={{ fontSize: 12 }} allowDecimals={false} width={44} />
              <Tooltip
                labelFormatter={(l) => formatBucket(String(l))}
                contentStyle={{
                  background: "#fff",
                  border: `2px solid ${C.sand}`,
                  borderRadius: 12,
                  fontSize: 13,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="pageViews" name="Page Views" stroke={C.terracotta}
                strokeWidth={2} fill="url(#gViews)" />
              <Area type="monotone" dataKey="visitors" name="Visitors" stroke={C.gold}
                strokeWidth={2} fill="url(#gVis)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
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
                  <XAxis type="number" stroke={C.espresso} tick={{ fontSize: 12 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke={C.espresso}
                    tick={{ fontSize: 12 }} width={90} />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: `2px solid ${C.sand}`, borderRadius: 12, fontSize: 13 }}
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
                    contentStyle={{ background: "#fff", border: `2px solid ${C.sand}`, borderRadius: 12, fontSize: 13 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
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
          Order = clicked through to online ordering; completed orders happen on Toast and aren&apos;t tracked.
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
  );
}

// --- Ordering view ----------------------------------------------------------

/** Friendly label for an order-button key. */
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
  };
  return map[key] ?? titleCase(key);
}

/**
 * A focused breakdown of order intent: how many clicked Order, which button
 * they used, which items drew the most clicks, and where those visitors came
 * from. Everything is click-based — completed orders happen on Toast off-site.
 */
function OrderingDashboard({ data }: { data: DashboardData }) {
  const { kpis, funnel, orderBySource, orderByItem, orderTraffic } = data;
  const hasOrders = kpis.orderClicks > 0;
  const topItem = orderByItem[0]?.key ?? "—";
  const buttonRows = orderBySource.map((r) => ({
    key: orderButtonLabel(r.key),
    count: r.count,
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-dashed border-sand bg-cream px-5 py-3 text-xs text-espresso/55">
        These numbers measure <span className="font-semibold">Order-button clicks
        (intent)</span>, not completed orders or revenue — checkout happens on
        Toast and isn&apos;t visible here.
      </div>

      {!hasOrders && (
        <div className="rounded-2xl border-2 border-dashed border-sand bg-cream p-6 text-center text-espresso/60">
          <p className="font-groovy text-xl text-espresso">No order clicks in this period yet</p>
          <p className="mt-1 text-sm">Try a longer timeframe, or check back as traffic comes in.</p>
        </div>
      )}

      {/* KPI scorecards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Order Clicks" value={kpis.orderClicks} prev={kpis.previous.orderClicks}
          hint="Total clicks on any 'Order' button in this period." />
        <Kpi label="Order Click Rate" value={kpis.orderClickRate} prev={kpis.previous.orderClickRate}
          isRate hint="Share of visitors who clicked an Order button." />
        <PlainStat label="People Who Clicked" value={nf.format(funnel.orderClickers)}
          hint="Distinct visitors who clicked Order (counted once per day)." />
        <PlainStat label="Top Item" value={topItem}
          hint="Menu item with the most Order-button clicks this period." />
      </div>

      {/* Most-clicked items */}
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
                <XAxis type="number" stroke={C.espresso} tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke={C.espresso}
                  tick={{ fontSize: 12 }} width={130} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: `2px solid ${C.sand}`, borderRadius: 12, fontSize: 13 }}
                  cursor={{ fill: C.sand, opacity: 0.3 }}
                />
                <Bar dataKey="count" name="Order clicks" fill={C.terracotta} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Which button + traffic origin */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Which Button They Clicked</CardTitle>
          <MiniBars rows={buttonRows} colorize label="clicks" />
        </Card>
        <Card>
          <CardTitle>Where Order-Clickers Came From</CardTitle>
          <p className="mt-1 text-xs text-espresso/50">
            Traffic source of the visit where the Order click happened. Best-effort — in-app browsers often report as “direct”.
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
                    contentStyle={{ background: "#fff", border: `2px solid ${C.sand}`, borderRadius: 12, fontSize: 13 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// --- Small building blocks --------------------------------------------------

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border-2 border-sand bg-cream p-5">{children}</div>;
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-groovy text-sm uppercase tracking-[0.2em] text-terracotta">
      {children}
    </h2>
  );
}

function Empty() {
  return <p className="mt-6 text-center text-sm text-espresso/40">No data yet.</p>;
}

function Kpi({
  label,
  value,
  prev,
  isRate,
  hint,
}: {
  label: string;
  value: number;
  prev: number;
  isRate?: boolean;
  hint: string;
}) {
  const delta = prev > 0 ? (value - prev) / prev : value > 0 ? 1 : 0;
  const up = delta >= 0;
  const showDelta = prev > 0;
  return (
    <div className="rounded-2xl border-2 border-sand bg-cream p-4" title={hint}>
      <p className="text-xs font-semibold uppercase tracking-wide text-espresso/55">{label}</p>
      <p className="mt-1 font-display text-3xl leading-none text-espresso">
        {isRate ? pct(value) : nf.format(value)}
      </p>
      {showDelta ? (
        <p className={`mt-2 text-xs font-semibold ${up ? "text-[#4a7c4e]" : "text-brick"}`}>
          {up ? "▲" : "▼"} {pct(Math.abs(delta))}
          <span className="font-normal text-espresso/40"> vs prev.</span>
        </p>
      ) : (
        <p className="mt-2 text-xs text-espresso/35">— no prior data</p>
      )}
    </div>
  );
}

/** A KPI-shaped card for a plain value with no period-over-period delta. */
function PlainStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-sand bg-cream p-4" title={hint}>
      <p className="text-xs font-semibold uppercase tracking-wide text-espresso/55">{label}</p>
      <p className="mt-1 truncate font-display text-3xl leading-none text-espresso" title={value}>
        {value}
      </p>
      <p className="mt-2 text-xs text-espresso/35">this period</p>
    </div>
  );
}

/** All-time review submissions, with a "new this week" callout. */
function ReviewsKpi({ stats }: { stats: ReviewStats | undefined }) {
  return (
    <div
      className="rounded-2xl border-2 border-sand bg-cream p-4"
      title="Total visitor reviews submitted (all time). Moderate them under Reviews."
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-espresso/55">
        Reviews Submitted
      </p>
      <p className="mt-1 font-display text-3xl leading-none text-espresso">
        {stats ? nf.format(stats.total) : "—"}
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
  );
}

function Funnel({
  funnel,
}: {
  funnel: { visitors: number; menuViewers: number; orderClickers: number };
}) {
  const steps = [
    { name: "Visited site", value: funnel.visitors, color: C.gold },
    { name: "Viewed a menu", value: funnel.menuViewers, color: C.orange },
    { name: "Clicked Order", value: funnel.orderClickers, color: C.terracotta },
  ];
  const max = Math.max(funnel.visitors, 1);
  return (
    <div className="mt-4 space-y-3">
      {steps.map((s, i) => {
        const fromPrev =
          i === 0 ? null : steps[i - 1].value > 0 ? s.value / steps[i - 1].value : 0;
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
                style={{ width: `${Math.max((s.value / max) * 100, s.value > 0 ? 4 : 0)}%`, background: s.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MiniBars({
  rows,
  label,
  colorize,
}: {
  rows: { key: string; count: number }[];
  label: string;
  colorize?: boolean;
}) {
  if (rows.length === 0) return <Empty />;
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="mt-3 space-y-2.5">
      {rows.map((r, i) => (
        <div key={r.key}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-medium text-espresso">{titleCase(r.key)}</span>
            <span className="text-espresso/60">
              {nf.format(r.count)} {label}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-cream-deep">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(r.count / max) * 100}%`,
                background: colorize ? PIE[i % PIE.length] : C.terracotta,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
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
  );
}
