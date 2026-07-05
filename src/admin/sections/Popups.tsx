import { lazy, Suspense, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

import { field, label, btn, Modal } from "@/admin/ui";
import { useDialogs } from "@/admin/dialogs";
import {
  PUBLIC_PAGES,
  POPUP_POSITIONS,
  DISPLAY_FREQUENCIES,
  ACTION_TRIGGERS,
} from "@/lib/cms";
import { useUpload } from "@/admin/useUpload";
import {
  ScheduleFields,
  StatusBadge,
  scheduleStatus,
} from "@/admin/ScheduleFields";

// Recharts-backed panel: load it (and recharts) only when Stats is opened.
const EntityAnalytics = lazy(() =>
  import("@/admin/analyticsPanels").then((m) => ({
    default: m.EntityAnalytics,
  })),
);

/**
 * Pop-up manager: create / edit / delete pop-ups and toggle them active. Two
 * active pop-ups can't share the same on-screen position (enforced server-side;
 * the error surfaces inline when activation is rejected).
 */

type MediaItem = {
  storageId: Id<"_storage">;
  type: "image" | "video";
  url: string | null;
};

type Trigger = { type: "time" | "action"; seconds?: number; action?: string };

type PopupPosition =
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top-edge"
  | "bottom-edge"
  | "left-edge"
  | "right-edge";

type Popup = {
  _id: Id<"popups">;
  internalTitle: string;
  heading?: string;
  body?: string;
  media: MediaItem[];
  position: PopupPosition;
  frequency: "every-visit" | "session" | "daily";
  buttonLabel?: string;
  buttonLink?: string;
  trigger: Trigger;
  emailCapture: boolean;
  showOn: "all" | string[];
  active: boolean;
  backdropBlur?: boolean;
  startsAt?: number;
  endsAt?: number;
};

const MAX_IMAGES = 5;

export function Popups() {
  const { confirmThen } = useDialogs();
  const rows = useQuery(api.marketing.listPopups);
  const remove = useMutation(api.marketing.deletePopup);
  const setActive = useMutation(api.marketing.setPopupActive);
  const [editing, setEditing] = useState<Popup | "new" | null>(null);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Id<"popups"> | null>(null);

  async function toggle(id: Id<"popups">, active: boolean) {
    setActivateError(null);
    try {
      await setActive({ id, active });
    } catch (err) {
      setActivateError(
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: unknown }).data)
          : "Couldn't activate this pop-up.",
      );
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl text-espresso">Pop-up</h1>
        <button
          type="button"
          className={btn.primary}
          onClick={() => setEditing("new")}
        >
          + New pop-up
        </button>
      </div>
      <p className="mt-2 text-sm text-espresso/60">
        One pop-up shows per on-screen position. Give a pop-up a schedule to run
        it for a set window; a later one automatically replaces it in the same
        spot.
      </p>
      {activateError && (
        <p className="mt-3 rounded-xl border border-brick/30 bg-brick/10 px-4 py-2 text-sm text-brick">
          {activateError}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {rows === undefined && <p className="text-espresso/60">Loading…</p>}
        {rows?.length === 0 && (
          <p className="text-espresso/55">No pop-ups yet.</p>
        )}
        {rows?.map((p) => (
          <div
            key={p._id}
            className="rounded-2xl border-2 border-sand bg-cream p-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cream-deep">
                {p.media[0]?.url && p.media[0].type === "image" && (
                  <img
                    src={p.media[0].url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-[12rem] flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-espresso">
                    {p.internalTitle}
                  </p>
                  <StatusBadge
                    status={scheduleStatus(p.active, p.startsAt, p.endsAt)}
                  />
                </div>
                <p className="text-xs text-espresso/55">
                  {labelFor(POPUP_POSITIONS, p.position)} ·{" "}
                  {labelFor(DISPLAY_FREQUENCIES, p.frequency)} ·{" "}
                  {p.trigger.type === "time"
                    ? `after ${p.trigger.seconds ?? 0}s`
                    : labelFor(ACTION_TRIGGERS, p.trigger.action ?? "")}
                  {p.emailCapture ? " · email capture" : ""}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-espresso">
                <input
                  type="checkbox"
                  checked={p.active}
                  onChange={(e) => void toggle(p._id, e.target.checked)}
                  className="h-5 w-5 accent-brick"
                />
                {p.active ? "On" : "Off"}
              </label>
              <button
                type="button"
                className={btn.small}
                onClick={() =>
                  setExpanded((cur) => (cur === p._id ? null : p._id))
                }
              >
                {expanded === p._id ? "Hide stats" : "Stats"}
              </button>
              <button
                type="button"
                className={btn.small}
                onClick={() => setEditing(p as Popup)}
              >
                Edit
              </button>
              <button
                type="button"
                className={btn.danger}
                onClick={() =>
                  confirmThen(`Delete "${p.internalTitle}"?`, () =>
                    void remove({ id: p._id }),
                  )
                }
              >
                Delete
              </button>
            </div>
            {expanded === p._id && (
              <Suspense
                fallback={
                  <p className="mt-3 text-sm text-espresso/50">Loading…</p>
                }
              >
                <EntityAnalytics kind="popup" id={p._id} />
              </Suspense>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <PopupForm
          existing={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function labelFor(list: { key: string; label: string }[], key: string): string {
  return list.find((x) => x.key === key)?.label ?? key;
}

function PopupForm({
  existing,
  onClose,
}: {
  existing: Popup | null;
  onClose: () => void;
}) {
  const upload = useUpload();
  const create = useMutation(api.marketing.createPopup);
  const update = useMutation(api.marketing.updatePopup);

  const [internalTitle, setInternalTitle] = useState(
    existing?.internalTitle ?? "",
  );
  const [heading, setHeading] = useState(existing?.heading ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [media, setMedia] = useState<MediaItem[]>(existing?.media ?? []);
  const [position, setPosition] = useState<PopupPosition>(
    existing?.position ?? "center",
  );
  const [frequency, setFrequency] = useState(
    existing?.frequency ?? "session",
  );
  const [buttonLabel, setButtonLabel] = useState(existing?.buttonLabel ?? "");
  const [buttonLink, setButtonLink] = useState(existing?.buttonLink ?? "");
  const [triggerType, setTriggerType] = useState<"time" | "action">(
    existing?.trigger.type ?? "time",
  );
  const [seconds, setSeconds] = useState(existing?.trigger.seconds ?? 5);
  const [action, setAction] = useState(
    existing?.trigger.action ?? ACTION_TRIGGERS[0].key,
  );
  const [emailCapture, setEmailCapture] = useState(
    existing?.emailCapture ?? false,
  );
  const [backdropBlur, setBackdropBlur] = useState(
    existing?.backdropBlur ?? true,
  );
  const [allPages, setAllPages] = useState(
    existing ? existing.showOn === "all" : true,
  );
  const [pages, setPages] = useState<string[]>(
    existing && existing.showOn !== "all" ? existing.showOn : [],
  );
  const [startsAt, setStartsAt] = useState<number | undefined>(
    existing?.startsAt,
  );
  const [endsAt, setEndsAt] = useState<number | undefined>(existing?.endsAt);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageCount = media.filter((m) => m.type === "image").length;
  const hasVideo = media.some((m) => m.type === "video");

  async function addMedia(
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video",
  ) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const next: MediaItem[] = [];
      for (const file of files) {
        if (type === "image" && imageCount + next.length >= MAX_IMAGES) break;
        const storageId = await upload(file);
        next.push({ storageId, type, url: URL.createObjectURL(file) });
      }
      setMedia((prev) => {
        // Only one video allowed; replace any existing one.
        const base = type === "video" ? prev.filter((m) => m.type !== "video") : prev;
        return [...base, ...next];
      });
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  function removeMedia(index: number) {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  }

  function togglePage(key: string) {
    setPages((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  }

  async function save() {
    if (!internalTitle.trim()) {
      setError("An internal title is required.");
      return;
    }
    if (startsAt != null && endsAt != null && endsAt <= startsAt) {
      setError("The end time must be after the start time.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      internalTitle: internalTitle.trim(),
      heading: heading.trim() || undefined,
      body: body.trim() || undefined,
      media: media.map((m) => ({ storageId: m.storageId, type: m.type })),
      position: position as Popup["position"],
      frequency: frequency as Popup["frequency"],
      buttonLabel: buttonLabel.trim() || undefined,
      buttonLink: buttonLink.trim() || undefined,
      trigger:
        triggerType === "time"
          ? { type: "time" as const, seconds }
          : { type: "action" as const, action },
      emailCapture,
      backdropBlur,
      showOn: (allPages ? "all" : pages) as "all" | string[],
      startsAt,
      endsAt,
    };
    try {
      if (existing) await update({ id: existing._id, ...payload });
      else await create(payload);
      onClose();
    } catch (err) {
      setError(
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: unknown }).data)
          : "Couldn't save the pop-up.",
      );
      setSaving(false);
    }
  }

  return (
    <Modal
      title={existing ? "Edit pop-up" : "New pop-up"}
      onClose={onClose}
      wide
    >
      <div className="space-y-4">
        {/* Media */}
        <div>
          <label className={label}>
            Media — up to {MAX_IMAGES} images and one video
          </label>
          <div className="flex flex-wrap gap-2">
            {media.map((m, i) => (
              <div
                key={i}
                className="relative h-20 w-20 overflow-hidden rounded-lg border-2 border-sand bg-cream-deep"
              >
                {m.type === "image" ? (
                  m.url && (
                    <img
                      src={m.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-espresso/60">
                    ▶ video
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(i)}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-espresso/80 text-xs text-cream"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <label
              className={`${btn.small} cursor-pointer ${
                imageCount >= MAX_IMAGES ? "pointer-events-none opacity-50" : ""
              }`}
            >
              + Image
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => addMedia(e, "image")}
              />
            </label>
            <label
              className={`${btn.small} cursor-pointer ${
                hasVideo ? "opacity-60" : ""
              }`}
            >
              {hasVideo ? "Replace video" : "+ Video"}
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => addMedia(e, "video")}
              />
            </label>
            {uploading && (
              <span className="self-center text-sm text-espresso/55">
                Uploading…
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Internal title (admin only)</label>
            <input
              className={field}
              value={internalTitle}
              onChange={(e) => setInternalTitle(e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Heading (optional)</label>
            <input
              className={field}
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className={label}>Body text (optional)</label>
          <textarea
            className={`${field} resize-none`}
            rows={2}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Position</label>
            <select
              className={field}
              value={position}
              onChange={(e) => setPosition(e.target.value as PopupPosition)}
            >
              {POPUP_POSITIONS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Display frequency</label>
            <select
              className={field}
              value={frequency}
              onChange={(e) =>
                setFrequency(e.target.value as Popup["frequency"])
              }
            >
              {DISPLAY_FREQUENCIES.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Trigger */}
        <div>
          <label className={label}>Trigger</label>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={triggerType === "time"}
                onChange={() => setTriggerType("time")}
                className="accent-brick"
              />
              After a delay
            </label>
            {triggerType === "time" && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={seconds}
                  onChange={(e) => setSeconds(Number(e.target.value))}
                  className={`${field} w-20`}
                />
                <span className="text-espresso/70">seconds</span>
              </div>
            )}
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={triggerType === "action"}
                onChange={() => setTriggerType("action")}
                className="accent-brick"
              />
              On a user action
            </label>
            {triggerType === "action" && (
              <select
                className={`${field} max-w-xs`}
                value={action}
                onChange={(e) => setAction(e.target.value)}
              >
                {ACTION_TRIGGERS.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Button label (optional)</label>
            <input
              className={field}
              value={buttonLabel}
              onChange={(e) => setButtonLabel(e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Button link (optional)</label>
            <input
              className={field}
              value={buttonLink}
              onChange={(e) => setButtonLink(e.target.value)}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold text-espresso">
          <input
            type="checkbox"
            checked={emailCapture}
            onChange={(e) => setEmailCapture(e.target.checked)}
            className="h-5 w-5 accent-brick"
          />
          Collect email addresses in this pop-up
        </label>

        <label className="flex items-center gap-2 text-sm font-semibold text-espresso">
          <input
            type="checkbox"
            checked={backdropBlur}
            onChange={(e) => setBackdropBlur(e.target.checked)}
            className="h-5 w-5 accent-brick"
          />
          Blur &amp; dim the background (centered pop-ups only)
        </label>

        <div>
          <label className={label}>Show on</label>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={allPages}
                onChange={() => setAllPages(true)}
                className="accent-brick"
              />
              All pages
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={!allPages}
                onChange={() => setAllPages(false)}
                className="accent-brick"
              />
              Specific pages
            </label>
          </div>
          {!allPages && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PUBLIC_PAGES.map((p) => (
                <label
                  key={p.key}
                  className="flex items-center gap-2 text-sm text-espresso/80"
                >
                  <input
                    type="checkbox"
                    checked={pages.includes(p.key)}
                    onChange={() => togglePage(p.key)}
                    className="accent-brick"
                  />
                  {p.label}
                </label>
              ))}
            </div>
          )}
        </div>

        <ScheduleFields
          startsAt={startsAt}
          endsAt={endsAt}
          onChange={({ startsAt: s, endsAt: e }) => {
            setStartsAt(s);
            setEndsAt(e);
          }}
        />

        {error && <p className="text-sm text-brick">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={btn.secondary} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={btn.primary}
            onClick={save}
            disabled={saving || uploading}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
