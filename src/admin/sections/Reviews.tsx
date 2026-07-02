import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

import { field, btn } from "@/admin/ui";
import { useDialogs } from "@/admin/dialogs";

/**
 * Reviews moderation: approve / archive / delete visitor reviews, feature up
 * to five on the home page, with a "new only" toggle, menu-item filter,
 * sorting, and a separate archived view.
 */

type Review = {
  _id: Id<"reviews">;
  _creationTime: number;
  menuItemName?: string;
  name: string;
  rating: number;
  text: string;
  status: "pending" | "approved" | "archived";
  featured: boolean;
};

const MAX_FEATURED = 5;

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-gold" aria-label={`${rating} of 5`}>
      {"★".repeat(rating)}
      <span className="text-espresso/20">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

function fmt(ms: number) {
  return new Date(ms).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function Reviews() {
  const { confirmThen } = useDialogs();
  const rows = useQuery(api.reviews.adminList) as Review[] | undefined;
  const seed = useMutation(api.reviews.seed);
  const setStatus = useMutation(api.reviews.setStatus);
  const setFeatured = useMutation(api.reviews.setFeatured);
  const remove = useMutation(api.reviews.remove);

  const [view, setView] = useState<"active" | "archived">("active");
  const [newOnly, setNewOnly] = useState(false);
  // Fixed at mount so the "new this week" cutoff stays stable across renders.
  const [nowTs] = useState(() => Date.now());
  const [itemFilter, setItemFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [featureError, setFeatureError] = useState<string | null>(null);

  const items = useMemo(() => {
    const set = new Set<string>();
    (rows ?? []).forEach((r) => r.menuItemName && set.add(r.menuItemName));
    return Array.from(set).sort();
  }, [rows]);

  const featuredCount = useMemo(
    () => (rows ?? []).filter((r) => r.featured).length,
    [rows],
  );

  const stats = useMemo(() => {
    const list = rows ?? [];
    const weekAgo = nowTs - 7 * 24 * 60 * 60 * 1000;
    return {
      total: list.length,
      pending: list.filter((r) => r.status === "pending").length,
      approved: list.filter((r) => r.status === "approved").length,
      newThisWeek: list.filter((r) => r._creationTime >= weekAgo).length,
    };
  }, [rows, nowTs]);

  const visible = useMemo(() => {
    let list = rows ?? [];
    list =
      view === "archived"
        ? list.filter((r) => r.status === "archived")
        : list.filter((r) => r.status !== "archived");
    if (view === "active" && newOnly)
      list = list.filter((r) => r.status === "pending");
    if (itemFilter !== "all")
      list = list.filter((r) => r.menuItemName === itemFilter);
    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return a._creationTime - b._creationTime;
        case "rating-high":
          return b.rating - a.rating;
        case "rating-low":
          return a.rating - b.rating;
        default:
          return b._creationTime - a._creationTime;
      }
    });
    return sorted;
  }, [rows, view, newOnly, itemFilter, sort]);

  async function toggleFeatured(r: Review) {
    setFeatureError(null);
    try {
      await setFeatured({ id: r._id, featured: !r.featured });
    } catch (err) {
      setFeatureError(
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: unknown }).data)
          : "Couldn't update featured reviews.",
      );
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl text-espresso">Reviews</h1>
        <span className="text-sm font-semibold text-espresso/70">
          Featured on home: {featuredCount}/{MAX_FEATURED}
        </span>
      </div>

      {/* Headline counts */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip label="Submitted" value={stats.total} />
        <StatChip label="Pending" value={stats.pending} accent={stats.pending > 0} />
        <StatChip label="Approved" value={stats.approved} />
        <StatChip label="New this week" value={stats.newThisWeek} accent={stats.newThisWeek > 0} />
      </div>

      {/* Active / Archived view toggle */}
      <div className="mt-5 inline-flex rounded-full border-2 border-sand bg-cream p-1">
        {(["active", "archived"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition-colors ${
              view === v
                ? "bg-brick text-cream"
                : "text-espresso/70 hover:bg-cream-deep"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {view === "active" && (
          <label className="flex items-center gap-2 text-sm font-semibold text-espresso">
            <input
              type="checkbox"
              checked={newOnly}
              onChange={(e) => setNewOnly(e.target.checked)}
              className="h-5 w-5 accent-brick"
            />
            New only (pending)
          </label>
        )}
        <select
          className={`${field} max-w-xs`}
          value={itemFilter}
          onChange={(e) => setItemFilter(e.target.value)}
        >
          <option value="all">All menu items</option>
          {items.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          className={`${field} max-w-[12rem]`}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="rating-high">Highest rating</option>
          <option value="rating-low">Lowest rating</option>
        </select>
      </div>

      {featureError && (
        <p className="mt-3 rounded-xl border border-brick/30 bg-brick/10 px-4 py-2 text-sm text-brick">
          {featureError}
        </p>
      )}

      {/* List */}
      <div className="mt-6 space-y-3">
        {rows === undefined && <p className="text-espresso/60">Loading…</p>}
        {rows?.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-sand p-6">
            <p className="text-espresso/60">
              No reviews yet. You can migrate the original built-in sample
              reviews to get started.
            </p>
            <button
              type="button"
              className={`${btn.secondary} mt-4`}
              onClick={() =>
                confirmThen(
                  "Import the original sample reviews as approved? Only runs if there are none.",
                  () => void seed({}),
                )
              }
            >
              Import sample reviews
            </button>
          </div>
        )}
        {rows !== undefined && rows.length > 0 && visible.length === 0 && (
          <p className="text-espresso/55">No reviews match these filters.</p>
        )}

        {visible.map((r) => (
          <div
            key={r._id}
            className="rounded-2xl border-2 border-sand bg-cream p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-espresso">
                  {r.name} <Stars rating={r.rating} />
                </p>
                <p className="text-xs text-espresso/55">
                  {r.menuItemName ?? "General"} · {fmt(r._creationTime)} ·{" "}
                  <StatusBadge status={r.status} />
                  {r.featured && (
                    <span className="ml-1 font-semibold text-brick">
                      · ★ Featured
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {r.status === "pending" && (
                  <button
                    type="button"
                    className={btn.small}
                    onClick={() =>
                      void setStatus({ id: r._id, status: "approved" })
                    }
                  >
                    Approve
                  </button>
                )}
                {r.status === "approved" && (
                  <>
                    <button
                      type="button"
                      className={`${btn.small} ${
                        r.featured ? "bg-brick text-cream hover:bg-maroon" : ""
                      }`}
                      onClick={() => void toggleFeatured(r)}
                    >
                      {r.featured ? "★ Featured" : "☆ Feature"}
                    </button>
                    <button
                      type="button"
                      className={btn.small}
                      onClick={() =>
                        void setStatus({ id: r._id, status: "pending" })
                      }
                    >
                      Unapprove
                    </button>
                  </>
                )}
                {r.status === "archived" ? (
                  <button
                    type="button"
                    className={btn.small}
                    onClick={() =>
                      void setStatus({ id: r._id, status: "approved" })
                    }
                  >
                    Restore
                  </button>
                ) : (
                  <button
                    type="button"
                    className={btn.small}
                    onClick={() =>
                      void setStatus({ id: r._id, status: "archived" })
                    }
                  >
                    Archive
                  </button>
                )}
                <button
                  type="button"
                  className={btn.danger}
                  onClick={() =>
                    confirmThen("Delete this review for good?", () =>
                      void remove({ id: r._id }),
                    )
                  }
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="mt-2 text-espresso/85">{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border-2 bg-cream px-4 py-3 ${
        accent ? "border-brick/40" : "border-sand"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-espresso/55">
        {label}
      </p>
      <p
        className={`mt-1 font-display text-2xl leading-none ${
          accent ? "text-brick" : "text-espresso"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: Review["status"] }) {
  const styles: Record<Review["status"], string> = {
    pending: "bg-gold/30 text-espresso",
    approved: "bg-green-600/15 text-green-800",
    archived: "bg-espresso/10 text-espresso/60",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[0.7rem] font-semibold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}
