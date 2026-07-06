import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

import { field, btn } from "@/admin/ui";
import { useDialogs } from "@/admin/dialogs";

/**
 * Inquiries dashboard with three tabs: contact-form submissions, hiring
 * applications, and pop-up email captures. Each tab supports free-text search;
 * hiring also filters by position.
 */

type Tab = "contact" | "hiring" | "captures";

const TABS: { key: Tab; label: string }[] = [
  { key: "contact", label: "Contact Form" },
  { key: "hiring", label: "Hiring" },
  { key: "captures", label: "Email Captures" },
];

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type ReadStatus = "all" | "unread" | "read";

/** Segmented All / Unread / Read filter shared by the contact + hiring tabs. */
function ReadFilter({
  value,
  onChange,
}: {
  value: ReadStatus;
  onChange: (v: ReadStatus) => void;
}) {
  const opts: { v: ReadStatus; label: string }[] = [
    { v: "all", label: "All" },
    { v: "unread", label: "Unread" },
    { v: "read", label: "Read" },
  ];
  return (
    <div className="inline-flex rounded-full border-2 border-sand bg-cream p-1">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
            value === o.v
              ? "bg-brick text-cream"
              : "text-espresso/70 hover:bg-cream-deep"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Apply an All/Unread/Read filter to a list of rows with an optional `read`. */
function matchesRead(read: boolean | undefined, status: ReadStatus): boolean {
  if (status === "unread") return !read;
  if (status === "read") return !!read;
  return true;
}

/** Escape one CSV cell (quote if it contains a comma, quote, or newline). */
function csvCell(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function Inquiries() {
  const [tab, setTab] = useState<Tab>("contact");
  const counts = useQuery(api.inquiries.counts);

  const unreadFor = (key: Tab): number => {
    if (!counts) return 0;
    if (key === "contact") return counts.contact.unread;
    if (key === "hiring") return counts.hiring.unread;
    return 0;
  };

  return (
    <div>
      <h1 className="font-display text-4xl text-espresso">Inquiries</h1>

      {/* Summary counts across all three streams */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Contact Form"
          total={counts?.contact.total}
          unread={counts?.contact.unread}
        />
        <SummaryCard
          label="Hiring"
          total={counts?.hiring.total}
          unread={counts?.hiring.unread}
        />
        <SummaryCard label="Email Captures" total={counts?.captures.total} />
      </div>

      <div className="mt-5 inline-flex rounded-full border-2 border-sand bg-cream p-1">
        {TABS.map((t) => {
          const unread = unreadFor(t.key);
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                tab === t.key
                  ? "bg-brick text-cream"
                  : "text-espresso/70 hover:bg-cream-deep"
              }`}
            >
              {t.label}
              {unread > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold ${
                    tab === t.key ? "bg-cream text-brick" : "bg-brick text-cream"
                  }`}
                >
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {tab === "contact" && <ContactTab />}
        {tab === "hiring" && <HiringTab />}
        {tab === "captures" && <CapturesTab />}
      </div>
    </div>
  );
}

/** A total + unread summary tile for one inquiry stream. */
function SummaryCard({
  label,
  total,
  unread,
}: {
  label: string;
  total: number | undefined;
  unread?: number;
}) {
  return (
    <div className="rounded-2xl border-2 border-sand bg-cream px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-espresso/55">
        {label}
      </p>
      <div className="mt-1 flex items-baseline gap-3">
        <span className="font-display text-2xl leading-none text-espresso">
          {total ?? "—"}
        </span>
        {unread !== undefined && unread > 0 && (
          <span className="text-sm font-semibold text-brick">
            {unread} unread
          </span>
        )}
      </div>
    </div>
  );
}

// --- Contact ----------------------------------------------------------------

function ContactTab() {
  const { confirmThen } = useDialogs();
  const rows = useQuery(api.inquiries.listContact);
  const del = useMutation(api.inquiries.deleteContact);
  const markRead = useMutation(api.inquiries.setContactRead);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ReadStatus>("all");

  const filtered = useMemo(() => {
    if (!rows) return [];
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (!matchesRead(r.read, status)) return false;
      if (!needle) return true;
      return [r.firstName, r.lastName, r.email, r.phone, r.message]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [rows, q, status]);

  if (rows === undefined) return <Loading />;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={q} onChange={setQ} count={filtered.length} inline />
        <ReadFilter value={status} onChange={setStatus} />
        <span className="text-sm text-espresso/55">{filtered.length} result(s)</span>
      </div>
      {filtered.length === 0 ? (
        <Empty label="contact submissions" />
      ) : (
        <div className="mt-4 space-y-3">
          {filtered.map((r) => (
            <div
              key={r._id}
              className={`rounded-2xl border-2 bg-cream p-4 ${
                r.read ? "border-sand opacity-70" : "border-brick/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-semibold text-espresso">
                    {!r.read && <UnreadDot />}
                    {r.firstName} {r.lastName}
                  </p>
                  <p className="text-sm text-espresso/70">
                    <a className="hover:underline" href={`mailto:${r.email}`}>
                      {r.email}
                    </a>{" "}
                    · {r.phone}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-espresso/50">
                    {fmtDate(r._creationTime)}
                  </span>
                  <ReadBtn
                    read={!!r.read}
                    onClick={() =>
                      void markRead({ id: r._id, read: !r.read })
                    }
                  />
                  <DeleteBtn
                    onClick={() =>
                      confirmThen("Delete this submission?", () =>
                        void del({ id: r._id as Id<"contactSubmissions"> }),
                      )
                    }
                  />
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-espresso/85">
                {r.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Hiring -----------------------------------------------------------------

/** Display name for an application (new `name`, or legacy first + last). */
function applicantName(r: {
  name?: string;
  firstName?: string;
  lastName?: string;
}): string {
  if (r.name && r.name.trim()) return r.name;
  const legacy = [r.firstName, r.lastName].filter(Boolean).join(" ").trim();
  return legacy || "—";
}

function HiringTab() {
  const { confirmThen } = useDialogs();
  const rows = useQuery(api.inquiries.listHiring);
  const del = useMutation(api.inquiries.deleteHiring);
  const markRead = useMutation(api.inquiries.setHiringRead);
  const [q, setQ] = useState("");
  const [coffee, setCoffee] = useState("all");
  const [status, setStatus] = useState<ReadStatus>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (!matchesRead(r.read, status)) return false;
      if (coffee !== "all" && (r.coffeeExperience ?? "") !== coffee)
        return false;
      if (!needle) return true;
      return [
        applicantName(r),
        r.email,
        r.phone,
        r.favoriteCoffeeShop,
        r.favoriteRecord,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [rows, q, coffee, status]);

  if (rows === undefined) return <Loading />;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={q} onChange={setQ} count={filtered.length} inline />
        <ReadFilter value={status} onChange={setStatus} />
        <select
          className={`${field} max-w-xs`}
          value={coffee}
          onChange={(e) => setCoffee(e.target.value)}
        >
          <option value="all">All applicants</option>
          <option value="yes">Coffee experience</option>
          <option value="no">No coffee experience</option>
        </select>
        <span className="text-sm text-espresso/55">{filtered.length} result(s)</span>
      </div>

      {filtered.length === 0 ? (
        <Empty label="hiring applications" />
      ) : (
        <div className="mt-4 space-y-3">
          {filtered.map((r) => {
            const availability = Array.isArray(r.availability)
              ? r.availability
              : [];
            return (
              <div
                key={r._id}
                className={`rounded-2xl border-2 bg-cream p-4 ${
                  r.read ? "border-sand opacity-70" : "border-brick/40"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-espresso">
                      {!r.read && <UnreadDot />}
                      {applicantName(r)}
                      {r.coffeeExperience && (
                        <span className="ml-1 rounded-full bg-gold/30 px-2 py-0.5 text-xs font-semibold text-espresso">
                          {r.coffeeExperience === "yes"
                            ? "Coffee exp ✓"
                            : "No coffee exp"}
                        </span>
                      )}
                      {availability.map((a) => (
                        <span
                          key={a}
                          className="rounded-full bg-espresso/10 px-2 py-0.5 text-xs font-semibold text-espresso/70"
                        >
                          {a}
                        </span>
                      ))}
                    </p>
                    <p className="text-sm text-espresso/70">
                      <a className="hover:underline" href={`mailto:${r.email}`}>
                        {r.email}
                      </a>
                      {r.phone ? ` · ${r.phone}` : ""}
                    </p>
                    {(r.favoriteCoffeeShop || r.favoriteRecord) && (
                      <p className="mt-1 text-sm text-espresso/70">
                        {r.favoriteCoffeeShop && (
                          <>☕ {r.favoriteCoffeeShop}</>
                        )}
                        {r.favoriteCoffeeShop && r.favoriteRecord && " · "}
                        {r.favoriteRecord && <>🎵 {r.favoriteRecord}</>}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-espresso/50">
                      {fmtDate(r._creationTime)}
                    </span>
                    <ReadBtn
                      read={!!r.read}
                      onClick={() =>
                        void markRead({ id: r._id, read: !r.read })
                      }
                    />
                    <DeleteBtn
                      onClick={() =>
                        confirmThen("Delete this application?", () =>
                          void del({ id: r._id as Id<"hiringSubmissions"> }),
                        )
                      }
                    />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {r.resumeUrl && (
                    <a
                      href={r.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={btn.small}
                    >
                      Resume{r.resumeName ? `: ${r.resumeName}` : ""}
                    </a>
                  )}
                  {/* Legacy applications carry a richer `details` blob. */}
                  {r.details && (
                    <button
                      type="button"
                      className="text-sm font-semibold text-brick hover:underline"
                      onClick={() =>
                        setOpenId(openId === r._id ? null : r._id)
                      }
                    >
                      {openId === r._id ? "Hide details" : "View details"}
                    </button>
                  )}
                </div>
                {openId === r._id && r.details && (
                  <Details details={r.details} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Pretty-print the free-form hiring `details` blob. */
function Details({ details }: { details: unknown }) {
  const entries =
    details && typeof details === "object"
      ? Object.entries(details as Record<string, unknown>)
      : [];
  if (entries.length === 0) {
    return (
      <p className="mt-3 text-sm text-espresso/55">No extra details captured.</p>
    );
  }
  return (
    <dl className="mt-3 grid gap-x-6 gap-y-1 border-t border-sand pt-3 text-sm sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex gap-2">
          <dt className="font-semibold text-espresso/70">{key}:</dt>
          <dd className="text-espresso/80">
            {typeof value === "object"
              ? JSON.stringify(value)
              : String(value ?? "")}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// --- Email captures ---------------------------------------------------------

function CapturesTab() {
  const { confirmThen } = useDialogs();
  const rows = useQuery(api.inquiries.listEmailCaptures);
  const del = useMutation(api.inquiries.deleteEmailCapture);
  const [q, setQ] = useState("");
  const [source, setSource] = useState("all");
  const [copied, setCopied] = useState(false);

  const sources = useMemo(() => {
    const set = new Set<string>();
    (rows ?? []).forEach((r) => set.add(r.source));
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (source !== "all" && r.source !== source) return false;
      if (!needle) return true;
      return [r.email, r.source].join(" ").toLowerCase().includes(needle);
    });
  }, [rows, q, source]);

  function exportCsv() {
    const header = ["Email", "Source", "Captured"];
    const body = filtered.map((r) => [
      r.email,
      r.source,
      new Date(r._creationTime).toISOString(),
    ]);
    const csv = [header, ...body]
      .map((cols) => cols.map(csvCell).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `email-captures-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyEmails() {
    const emails = filtered.map((r) => r.email).join(", ");
    try {
      await navigator.clipboard.writeText(emails);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  if (rows === undefined) return <Loading />;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={q} onChange={setQ} count={filtered.length} inline />
        <select
          className={`${field} max-w-xs`}
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="all">All sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={btn.small}
          onClick={exportCsv}
          disabled={filtered.length === 0}
        >
          Download CSV
        </button>
        <button
          type="button"
          className={btn.small}
          onClick={() => void copyEmails()}
          disabled={filtered.length === 0}
        >
          {copied ? "Copied ✓" : "Copy emails"}
        </button>
        <span className="text-sm text-espresso/55">{filtered.length} result(s)</span>
      </div>
      {filtered.length === 0 ? (
        <Empty label="email captures" />
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border-2 border-sand">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-deep text-espresso/70">
              <tr>
                <th className="px-4 py-2 font-semibold">Email</th>
                <th className="px-4 py-2 font-semibold">Source</th>
                <th className="px-4 py-2 font-semibold">Captured</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r._id} className="border-t border-sand bg-cream">
                  <td className="px-4 py-2">
                    <a className="hover:underline" href={`mailto:${r.email}`}>
                      {r.email}
                    </a>
                  </td>
                  <td className="px-4 py-2 text-espresso/70">{r.source}</td>
                  <td className="px-4 py-2 text-espresso/55">
                    {fmtDate(r._creationTime)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <DeleteBtn
                      onClick={() =>
                        confirmThen("Delete this email capture?", () =>
                          void del({ id: r._id as Id<"emailCaptures"> }),
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// --- Shared bits ------------------------------------------------------------

function SearchBar({
  value,
  onChange,
  count,
  inline,
}: {
  value: string;
  onChange: (v: string) => void;
  count: number;
  inline?: boolean;
}) {
  return (
    <div className={inline ? "" : "flex items-center gap-3"}>
      <input
        className={`${field} ${inline ? "max-w-xs" : "max-w-sm"}`}
        placeholder="Search…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {!inline && (
        <span className="text-sm text-espresso/55">{count} result(s)</span>
      )}
    </div>
  );
}

/** A small filled dot flagging an unread inquiry. */
function UnreadDot() {
  return (
    <span
      aria-label="Unread"
      title="Unread"
      className="inline-block h-2 w-2 shrink-0 rounded-full bg-brick"
    />
  );
}

/** Toggle button to mark an inquiry as read / unread. */
function ReadBtn({ read, onClick }: { read: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
        read
          ? "bg-espresso/10 text-espresso/60 hover:bg-espresso/20"
          : "bg-brick/15 text-brick hover:bg-brick/25"
      }`}
    >
      {read ? "Read ✓" : "Mark as read"}
    </button>
  );
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Delete"
      className="rounded-full px-2 py-1 text-sm text-espresso/40 transition-colors hover:bg-brick/10 hover:text-brick"
    >
      ✕
    </button>
  );
}

function Loading() {
  return <p className="mt-4 text-espresso/60">Loading…</p>;
}

function Empty({ label }: { label: string }) {
  return <p className="mt-6 text-espresso/55">No {label} yet.</p>;
}
