import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import { downloadCsv } from "@/admin/csv";
import {
  C,
  nf,
  pct,
  duration,
  TimeframeBar,
  Empty,
  PlainStat,
  TrendChart,
  ExportButton,
} from "@/admin/analyticsShared";

/**
 * Reusable analytics panels shown on the individual editor pages: a per-menu
 * item breakdown on each menu manager, and a compact per-entity toggle on each
 * announcement bar / pop-up. They mirror the main dashboard but scoped to one
 * thing, with their own timeframe selector + CSV export.
 */

// --- Per-menu analytics (menu managers) -------------------------------------

export function MenuAnalyticsPanel({ menu }: { menu: "coffee" | "food" }) {
  const [timeframe, setTimeframe] = useState("week");
  const [now, setNow] = useState(() => Date.now());
  const data = useQuery(api.analytics.getMenuAnalytics, { menu, timeframe, now });

  function exportCsv() {
    if (!data) return;
    downloadCsv(
      `preamp-${menu}-items-${timeframe}.csv`,
      data.rows.map((r) => ({
        item: r.name,
        views: r.views,
        order_clicks: r.orders,
      })),
      ["item", "views", "order_clicks"],
    );
  }

  return (
    <div className="border-t-2 border-sand p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <TimeframeBar value={timeframe} onChange={setTimeframe} size="sm" />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNow(Date.now())}
            className="rounded-full border-2 border-espresso/20 px-3 py-1.5 text-xs font-semibold text-espresso transition-colors hover:bg-espresso/5"
          >
            ↻
          </button>
          <ExportButton onClick={exportCsv}>Export</ExportButton>
        </div>
      </div>

      {data === undefined ? (
        <p className="text-sm text-espresso/50">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <PlainStat label="Item Views" value={nf.format(data.totals.views)} />
            <PlainStat label="Order Clicks" value={nf.format(data.totals.orders)} />
            <PlainStat label="Top Item" value={data.rows[0]?.name ?? "—"} />
          </div>

          <div className="mt-4">
            <TrendChart
              height={200}
              data={data.trend as unknown as Record<string, number | string>[]}
              series={[
                { key: "views", name: "Item Views", color: C.terracotta },
                { key: "clicks", name: "Order Clicks", color: C.gold },
              ]}
            />
          </div>

          {data.totals.views === 0 && data.totals.orders === 0 ? (
            <Empty label="No item views or order clicks in this period yet." />
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[26rem] text-sm">
                <thead>
                  <tr className="border-b-2 border-sand text-left text-xs uppercase tracking-wide text-espresso/50">
                    <th className="py-2 pr-3 font-semibold">Item</th>
                    <th className="py-2 pr-3 font-semibold">Views</th>
                    <th className="py-2 font-semibold">Order Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.id} className="border-b border-sand/60">
                      <td className="py-2 pr-3 font-medium text-espresso">
                        {r.name}
                      </td>
                      <td className="py-2 pr-3 tabular-nums text-espresso/80">
                        {nf.format(r.views)}
                      </td>
                      <td className="py-2 tabular-nums text-espresso/80">
                        {nf.format(r.orders)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// --- Per-entity analytics (announcement bar / pop-up rows) ------------------

export function EntityAnalytics({
  kind,
  id,
}: {
  kind: "announcement" | "popup";
  id: string;
}) {
  const [timeframe, setTimeframe] = useState("week");
  const [now, setNow] = useState(() => Date.now());
  const data = useQuery(api.analytics.getEntityAnalytics, {
    kind,
    id,
    timeframe,
    now,
  });

  function exportCsv() {
    if (!data) return;
    downloadCsv(
      `preamp-${kind}-${id}-${timeframe}.csv`,
      data.trend.map((t) => ({
        bucket: t.label,
        views: t.views,
        clicks: t.clicks,
      })),
      ["bucket", "views", "clicks"],
    );
  }

  return (
    <div className="mt-3 w-full rounded-xl border border-sand bg-white/60 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <TimeframeBar value={timeframe} onChange={setTimeframe} size="sm" />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNow(Date.now())}
            className="rounded-full border-2 border-espresso/20 px-3 py-1.5 text-xs font-semibold text-espresso transition-colors hover:bg-espresso/5"
          >
            ↻
          </button>
          <ExportButton onClick={exportCsv}>Export</ExportButton>
        </div>
      </div>

      {data === undefined ? (
        <p className="text-sm text-espresso/50">Loading…</p>
      ) : (
        <>
          <div
            className={`grid gap-3 ${
              kind === "popup" ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-3"
            }`}
          >
            <PlainStat label="Views" value={nf.format(data.totals.views)} />
            <PlainStat
              label={kind === "popup" ? "Btn Clicks" : "Clicks"}
              value={nf.format(data.totals.clicks)}
            />
            <PlainStat label="CTR" value={pct(data.totals.ctr)} />
            {kind === "popup" && (
              <>
                <PlainStat
                  label="Emails"
                  value={nf.format(data.totals.emails)}
                />
                <PlainStat
                  label="Avg. Time"
                  value={duration(data.totals.avgDwellMs)}
                  sub="before dismiss"
                />
              </>
            )}
          </div>

          <div className="mt-3">
            <TrendChart
              height={180}
              data={data.trend as unknown as Record<string, number | string>[]}
              series={[
                { key: "views", name: "Views", color: C.terracotta },
                { key: "clicks", name: "Clicks", color: C.gold },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
}
