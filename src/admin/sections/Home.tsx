import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

/**
 * Admin home "command center" - the landing after sign-in. A single lightweight
 * summary query (`analytics.getHomeSummary`) feeds an at-a-glance view: things
 * needing attention, today's traffic snapshot vs yesterday, unread inquiries,
 * pending reviews, live campaigns, and the week's top item. Every card jumps to
 * the relevant section. Deliberately chart-free so it loads instantly.
 */

const nf = new Intl.NumberFormat("en-US");

function pct(n: number): string {
  return `${Math.abs(n * 100).toFixed(n >= 0.1 || n <= -0.1 ? 0 : 1)}%`;
}

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function positionLabel(position: string): string {
  return position
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export function Home({ onNavigate }: { onNavigate: (section: string) => void }) {
  const [now, setNow] = useState(() => Date.now());
  const data = useQuery(api.analytics.getHomeSummary, { now });

  const dateLabel = new Date(now).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-espresso">
            {greeting(new Date(now).getHours())}
          </h1>
          <p className="mt-1 text-sm text-espresso/60">{dateLabel}</p>
        </div>
        <button
          type="button"
          onClick={() => setNow(Date.now())}
          className="rounded-full border-2 border-espresso/20 px-4 py-2 text-sm font-semibold text-espresso transition-colors hover:bg-espresso/5"
        >
          ↻ Refresh
        </button>
      </div>

      {data === undefined ? (
        <HomeSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Alerts */}
          {data.alerts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.alerts.map((a, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onNavigate(a.section)}
                  className={`flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-transform hover:-translate-y-0.5 ${
                    a.level === "warning"
                      ? "border-brick/40 bg-brick/10 text-brick"
                      : "border-gold/50 bg-gold/10 text-espresso"
                  }`}
                >
                  <span aria-hidden>{a.level === "warning" ? "⚠" : "◷"}</span>
                  {a.text}
                  <span className="text-xs opacity-60">→</span>
                </button>
              ))}
            </div>
          )}

          {/* Today's snapshot */}
          <section>
            <h2 className="mb-3 font-groovy text-sm uppercase tracking-[0.2em] text-terracotta">
              Today at a glance
            </h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <SnapStat label="Visitors" value={data.today.visitors} prev={data.today.prev.visitors} />
              <SnapStat label="Page Views" value={data.today.pageViews} prev={data.today.prev.pageViews} />
              <SnapStat label="Order Clicks" value={data.today.orderClicks} prev={data.today.prev.orderClicks} />
              <SnapStat label="Menu Clicks" value={data.today.menuClicks} prev={data.today.prev.menuClicks} />
            </div>
          </section>

          {/* Command cards */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {/* Inquiries */}
            <CommandCard
              title="Inquiries"
              onClick={() => onNavigate("inquiries")}
              accent={data.inquiries.unread > 0}
            >
              <p className="font-display text-4xl leading-none text-espresso">
                {nf.format(data.inquiries.unread)}
                <span className="ml-2 align-middle text-sm font-semibold text-espresso/50">
                  unread
                </span>
              </p>
              <p className="mt-3 text-sm text-espresso/70">
                {data.inquiries.contactUnread} contact · {data.inquiries.hiringUnread} hiring
              </p>
              <p className="mt-1 text-xs text-espresso/50">
                {nf.format(data.inquiries.captures)} email captures all-time
              </p>
            </CommandCard>

            {/* Reviews */}
            <CommandCard
              title="Reviews"
              onClick={() => onNavigate("reviews")}
              accent={data.reviews.pending > 0}
            >
              <p className="font-display text-4xl leading-none text-espresso">
                {nf.format(data.reviews.pending)}
                <span className="ml-2 align-middle text-sm font-semibold text-espresso/50">
                  pending
                </span>
              </p>
              <p className="mt-3 text-sm text-espresso/70">
                {nf.format(data.reviews.total)} total
              </p>
              {data.reviews.newThisWeek > 0 && (
                <p className="mt-1 text-xs font-semibold text-[#4a7c4e]">
                  +{nf.format(data.reviews.newThisWeek)} this week
                </p>
              )}
            </CommandCard>

            {/* Campaigns */}
            <CommandCard
              title="Active Campaigns"
              onClick={() => onNavigate("announcements")}
            >
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Dot on={!!data.campaigns.liveAnnouncement} />
                  <span className="truncate text-espresso/80">
                    {data.campaigns.liveAnnouncement
                      ? data.campaigns.liveAnnouncement.title
                      : "No bar live"}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Dot on={data.campaigns.livePopups.length > 0} />
                  <span className="text-espresso/80">
                    {data.campaigns.livePopups.length > 0
                      ? `${data.campaigns.livePopups.length} pop-up${
                          data.campaigns.livePopups.length === 1 ? "" : "s"
                        } live`
                      : "No pop-up live"}
                    {data.campaigns.livePopups.length > 0 && (
                      <span className="block text-xs text-espresso/50">
                        {data.campaigns.livePopups
                          .map((p) => positionLabel(p.position))
                          .join(" · ")}
                      </span>
                    )}
                  </span>
                </div>
              </div>
              {data.campaigns.scheduledCount > 0 && (
                <p className="mt-3 text-xs font-semibold text-gold">
                  ◷ {data.campaigns.scheduledCount} scheduled
                </p>
              )}
            </CommandCard>

            {/* Top item */}
            <CommandCard
              title="Top Item · 7 days"
              onClick={() =>
                onNavigate(
                  data.topItem ? `menu-${data.topItem.menu}` : "menu-coffee",
                )
              }
            >
              {data.topItem ? (
                <>
                  <p className="font-display text-2xl leading-tight text-espresso">
                    {data.topItem.name}
                  </p>
                  <p className="mt-2 text-sm text-espresso/70">
                    {nf.format(data.topItem.views)} views ·{" "}
                    <span className="capitalize">{data.topItem.menu}</span>
                  </p>
                  {data.topItem.slug && (
                    <a
                      href={`/menu/${data.topItem.menu}/${data.topItem.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 inline-block text-xs font-semibold text-brick hover:underline"
                    >
                      View on site →
                    </a>
                  )}
                </>
              ) : (
                <p className="text-sm text-espresso/50">
                  No item views yet this week.
                </p>
              )}
            </CommandCard>
          </div>

          {/* Quick jumps */}
          <section>
            <h2 className="mb-3 font-groovy text-sm uppercase tracking-[0.2em] text-terracotta">
              Jump to
            </h2>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "analytics", label: "Full Analytics" },
                { id: "menu-coffee", label: "Coffee Menu" },
                { id: "menu-food", label: "Food Menu" },
                { id: "announcements", label: "Announcement Bar" },
                { id: "popups", label: "Pop-ups" },
                { id: "events", label: "Events" },
              ].map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => onNavigate(q.id)}
                  className="rounded-full border-2 border-sand bg-cream px-4 py-2 text-sm font-semibold text-espresso/80 transition-colors hover:bg-cream-deep"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function SnapStat({
  label,
  value,
  prev,
}: {
  label: string;
  value: number;
  prev: number;
}) {
  const showDelta = prev > 0;
  const delta = showDelta ? (value - prev) / prev : 0;
  const up = delta >= 0;
  return (
    <div className="rounded-2xl border-2 border-sand bg-cream p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-espresso/55">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl leading-none text-espresso">
        {nf.format(value)}
      </p>
      {showDelta ? (
        <p
          className={`mt-2 text-xs font-semibold ${
            up ? "text-[#4a7c4e]" : "text-brick"
          }`}
        >
          {up ? "▲" : "▼"} {pct(delta)}
          <span className="font-normal text-espresso/40"> vs yesterday</span>
        </p>
      ) : (
        <p className="mt-2 text-xs text-espresso/35">vs yesterday</p>
      )}
    </div>
  );
}

function CommandCard({
  title,
  children,
  onClick,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[9rem] flex-col rounded-2xl border-2 bg-cream p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-maroon/10 ${
        accent ? "border-brick/50" : "border-sand"
      }`}
    >
      <p className="mb-2 font-groovy text-xs uppercase tracking-[0.2em] text-terracotta">
        {title}
      </p>
      <div className="flex-1">{children}</div>
    </button>
  );
}

function Dot({ on }: { on: boolean }) {
  return (
    <span
      className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${
        on ? "bg-[#4a7c4e]" : "bg-espresso/25"
      }`}
    />
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border-2 border-sand bg-cream" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl border-2 border-sand bg-cream" />
        ))}
      </div>
    </div>
  );
}
