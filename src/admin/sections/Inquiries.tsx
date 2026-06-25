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

export function Inquiries() {
  const [tab, setTab] = useState<Tab>("contact");

  return (
    <div>
      <h1 className="font-display text-4xl text-espresso">Inquiries</h1>

      <div className="mt-5 inline-flex rounded-full border-2 border-sand bg-cream p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "bg-brick text-cream"
                : "text-espresso/70 hover:bg-cream-deep"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "contact" && <ContactTab />}
        {tab === "hiring" && <HiringTab />}
        {tab === "captures" && <CapturesTab />}
      </div>
    </div>
  );
}

// --- Contact ----------------------------------------------------------------

function ContactTab() {
  const { confirmThen } = useDialogs();
  const rows = useQuery(api.inquiries.listContact);
  const del = useMutation(api.inquiries.deleteContact);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!rows) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      [r.firstName, r.lastName, r.email, r.phone, r.message]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [rows, q]);

  if (rows === undefined) return <Loading />;

  return (
    <div>
      <SearchBar value={q} onChange={setQ} count={filtered.length} />
      {filtered.length === 0 ? (
        <Empty label="contact submissions" />
      ) : (
        <div className="mt-4 space-y-3">
          {filtered.map((r) => (
            <div
              key={r._id}
              className="rounded-2xl border-2 border-sand bg-cream p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-espresso">
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

function HiringTab() {
  const { confirmThen } = useDialogs();
  const rows = useQuery(api.inquiries.listHiring);
  const del = useMutation(api.inquiries.deleteHiring);
  const [q, setQ] = useState("");
  const [position, setPosition] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const positions = useMemo(() => {
    const set = new Set<string>();
    (rows ?? []).forEach((r) => set.add(r.position));
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (position !== "all" && r.position !== position) return false;
      if (!needle) return true;
      return [r.firstName, r.lastName, r.email, r.phone, r.city, r.state]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [rows, q, position]);

  if (rows === undefined) return <Loading />;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={q} onChange={setQ} count={filtered.length} inline />
        <select
          className={`${field} max-w-xs`}
          value={position}
          onChange={(e) => setPosition(e.target.value)}
        >
          <option value="all">All positions</option>
          {positions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Empty label="hiring applications" />
      ) : (
        <div className="mt-4 space-y-3">
          {filtered.map((r) => (
            <div
              key={r._id}
              className="rounded-2xl border-2 border-sand bg-cream p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-espresso">
                    {r.firstName} {r.lastName}
                    <span className="ml-2 rounded-full bg-gold/30 px-2 py-0.5 text-xs font-semibold text-espresso">
                      {r.position}
                    </span>
                  </p>
                  <p className="text-sm text-espresso/70">
                    <a className="hover:underline" href={`mailto:${r.email}`}>
                      {r.email}
                    </a>{" "}
                    · {r.phone} · {r.city}, {r.state}
                  </p>
                  <p className="mt-1 text-sm text-espresso/70">
                    Desired: {r.desiredSalary} · {r.hoursDesired} hrs ·
                    Transport: {r.transportation}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-espresso/50">
                    {fmtDate(r._creationTime)}
                  </span>
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
                <button
                  type="button"
                  className="text-sm font-semibold text-brick hover:underline"
                  onClick={() =>
                    setOpenId(openId === r._id ? null : r._id)
                  }
                >
                  {openId === r._id ? "Hide details" : "View details"}
                </button>
              </div>
              {openId === r._id && <Details details={r.details} />}
            </div>
          ))}
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

  const filtered = useMemo(() => {
    if (!rows) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      [r.email, r.source].join(" ").toLowerCase().includes(needle),
    );
  }, [rows, q]);

  if (rows === undefined) return <Loading />;

  return (
    <div>
      <SearchBar value={q} onChange={setQ} count={filtered.length} />
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
