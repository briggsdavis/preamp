import type { ReactNode } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

/**
 * Shared building blocks for every analytics surface: the main dashboard, the
 * per-menu panel on the menu managers, and the per-entity toggles on the
 * announcement / pop-up editors. Keeping them here keeps the look consistent.
 */

// Brand palette (mirrors the CSS tokens in styles/index.css).
export const C = {
  gold: "#d9883b",
  amber: "#e0a042",
  orange: "#ce6b38",
  terracotta: "#b55335",
  brick: "#9e4a3c",
  maroon: "#6b2f26",
  espresso: "#2a1a12",
  sand: "#e3d3b8",
};
export const PIE = [
  C.gold,
  C.terracotta,
  C.amber,
  C.brick,
  C.orange,
  C.maroon,
  "#3b2417",
  C.sand,
];

export const nf = new Intl.NumberFormat("en-US");

export function pct(n: number): string {
  return `${(n * 100).toFixed(n >= 0.1 ? 0 : 1)}%`;
}

/** Human duration from milliseconds ("1m 12s", "8s", "-"). */
export function duration(ms: number): string {
  if (!ms || ms < 0) return "-";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem ? `${m}m ${rem}s` : `${m}m`;
}

export function titleCase(s: string): string {
  return s.replace(
    /(^|[\s_-])(\w)/g,
    (_, p, c) => p.replace(/[_-]/, " ") + c.toUpperCase(),
  );
}

/** Friendly label for a trend bucket key ("13:00" | "2026-06-21" | "2026-06"). */
export function formatBucket(label: string): string {
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
export function pageName(path: string): string {
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

export const TIMEFRAMES = [
  { id: "today", label: "Today" },
  { id: "week", label: "1 Week" },
  { id: "month", label: "1 Month" },
  { id: "3months", label: "3 Months" },
  { id: "6months", label: "6 Months" },
  { id: "year", label: "1 Year" },
  { id: "2years", label: "2 Years" },
] as const;

export function TimeframeBar({
  value,
  onChange,
  size = "md",
}: {
  value: string;
  onChange: (id: string) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {TIMEFRAMES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`rounded-full font-semibold transition-colors ${
            size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"
          } ${
            value === t.id
              ? "bg-brick text-cream"
              : "border-2 border-sand bg-cream text-espresso/70 hover:bg-cream-deep"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-sand bg-cream p-5">
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-groovy text-sm uppercase tracking-[0.2em] text-terracotta">
      {children}
    </h2>
  );
}

export function Empty({ label = "No data yet." }: { label?: string }) {
  return <p className="mt-6 text-center text-sm text-espresso/40">{label}</p>;
}

export function Kpi({
  label,
  value,
  prev,
  isRate,
  hint,
}: {
  label: string;
  value: number;
  prev?: number;
  isRate?: boolean;
  hint?: string;
}) {
  const showDelta = prev !== undefined && prev > 0;
  const delta = showDelta ? (value - (prev as number)) / (prev as number) : 0;
  const up = delta >= 0;
  return (
    <div className="rounded-2xl border-2 border-sand bg-cream p-4" title={hint}>
      <p className="text-xs font-semibold uppercase tracking-wide text-espresso/55">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl leading-none text-espresso">
        {isRate ? pct(value) : nf.format(value)}
      </p>
      {showDelta ? (
        <p
          className={`mt-2 text-xs font-semibold ${
            up ? "text-[#4a7c4e]" : "text-brick"
          }`}
        >
          {up ? "▲" : "▼"} {pct(Math.abs(delta))}
          <span className="font-normal text-espresso/40"> vs prev.</span>
        </p>
      ) : (
        <p className="mt-2 text-xs text-espresso/35">-</p>
      )}
    </div>
  );
}

/** A KPI-shaped card for a plain string value with no delta. */
export function PlainStat({
  label,
  value,
  hint,
  sub = "this period",
}: {
  label: string;
  value: string;
  hint?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-sand bg-cream p-4" title={hint}>
      <p className="text-xs font-semibold uppercase tracking-wide text-espresso/55">
        {label}
      </p>
      <p
        className="mt-1 truncate font-display text-3xl leading-none text-espresso"
        title={value}
      >
        {value}
      </p>
      <p className="mt-2 text-xs text-espresso/35">{sub}</p>
    </div>
  );
}

export function MiniBars({
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

type Series = { key: string; name: string; color: string };

/** A small stacked-gradient area chart for one or two numeric series. */
export function TrendChart({
  data,
  series,
  height = 260,
}: {
  data: Record<string, number | string>[];
  series: Series[];
  height?: number;
}) {
  return (
    <div className="mt-3 w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient
                key={s.key}
                id={`grad-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity={0.5} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={C.sand} />
          <XAxis
            dataKey="label"
            tickFormatter={formatBucket}
            stroke={C.espresso}
            tick={{ fontSize: 12 }}
            minTickGap={16}
          />
          <YAxis
            stroke={C.espresso}
            tick={{ fontSize: 12 }}
            allowDecimals={false}
            width={44}
          />
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
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** A compact button that downloads whatever the handler produces. */
export function ExportButton({
  onClick,
  children = "Export CSV",
  title,
}: {
  onClick: () => void;
  children?: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="rounded-full border-2 border-espresso/20 px-4 py-2 text-sm font-semibold text-espresso transition-colors hover:bg-espresso/5"
    >
      ⤓ {children}
    </button>
  );
}
