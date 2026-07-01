import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

import { field, label, btn, Modal } from "@/admin/ui";
import { useDialogs } from "@/admin/dialogs";
import { PUBLIC_PAGES } from "@/lib/cms";

/**
 * Announcement bar manager: create / edit / delete bars and toggle exactly one
 * active at a time (single-active is enforced server-side).
 */

type Announcement = {
  _id: Id<"announcements">;
  internalTitle: string;
  text: string;
  buttonLabel?: string;
  buttonLink?: string;
  bgColor: string;
  textColor: string;
  showOn: "all" | string[];
  active: boolean;
};

export function Announcements() {
  const { confirmThen } = useDialogs();
  const rows = useQuery(api.marketing.listAnnouncements);
  const remove = useMutation(api.marketing.deleteAnnouncement);
  const setActive = useMutation(api.marketing.setAnnouncementActive);
  const [editing, setEditing] = useState<Announcement | "new" | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl text-espresso">Announcement Bar</h1>
        <button
          type="button"
          className={btn.primary}
          onClick={() => setEditing("new")}
        >
          + New bar
        </button>
      </div>
      <p className="mt-2 text-sm text-espresso/60">
        Only one bar can be active at a time. Activating one turns the others
        off.
      </p>

      <div className="mt-6 space-y-3">
        {rows === undefined && <p className="text-espresso/60">Loading…</p>}
        {rows?.length === 0 && (
          <p className="text-espresso/55">No announcement bars yet.</p>
        )}
        {rows?.map((a) => (
          <div
            key={a._id}
            className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-sand bg-cream p-4"
          >
            {/* A mini preview of how the live announcement bar looks. */}
            <div
              className="flex h-10 min-w-[12rem] flex-1 items-center justify-center gap-2 overflow-hidden rounded-lg px-3 text-sm font-semibold"
              style={{ background: a.bgColor, color: a.textColor }}
              title="Live preview of the announcement bar"
            >
              <span className="truncate">{a.text}</span>
              {a.buttonLabel && a.buttonLink && (
                <span className="shrink-0 rounded-full border border-current px-2 py-0.5 text-xs font-semibold">
                  {a.buttonLabel}
                </span>
              )}
            </div>
            <div className="min-w-[10rem]">
              <p className="font-semibold text-espresso">{a.internalTitle}</p>
              <p className="text-xs text-espresso/55">
                {a.showOn === "all"
                  ? "All pages"
                  : `${a.showOn.length} page(s)`}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-espresso">
              <input
                type="checkbox"
                checked={a.active}
                onChange={(e) =>
                  void setActive({ id: a._id, active: e.target.checked })
                }
                className="h-5 w-5 accent-brick"
              />
              {a.active ? "On" : "Off"}
            </label>
            <button
              type="button"
              className={btn.small}
              onClick={() => setEditing(a as Announcement)}
            >
              Edit
            </button>
            <button
              type="button"
              className={btn.danger}
              onClick={() =>
                confirmThen(`Delete "${a.internalTitle}"?`, () =>
                  void remove({ id: a._id }),
                )
              }
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {editing && (
        <AnnouncementForm
          existing={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function AnnouncementForm({
  existing,
  onClose,
}: {
  existing: Announcement | null;
  onClose: () => void;
}) {
  const create = useMutation(api.marketing.createAnnouncement);
  const update = useMutation(api.marketing.updateAnnouncement);

  const [internalTitle, setInternalTitle] = useState(
    existing?.internalTitle ?? "",
  );
  const [text, setText] = useState(existing?.text ?? "");
  const [buttonLabel, setButtonLabel] = useState(existing?.buttonLabel ?? "");
  const [buttonLink, setButtonLink] = useState(existing?.buttonLink ?? "");
  const [bgColor, setBgColor] = useState(existing?.bgColor ?? "#7a2f24");
  const [textColor, setTextColor] = useState(existing?.textColor ?? "#fdf7ef");
  const [allPages, setAllPages] = useState(
    existing ? existing.showOn === "all" : true,
  );
  const [pages, setPages] = useState<string[]>(
    existing && existing.showOn !== "all" ? existing.showOn : [],
  );
  const [saving, setSaving] = useState(false);

  function togglePage(key: string) {
    setPages((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  }

  async function save() {
    if (!internalTitle.trim() || !text.trim()) return;
    setSaving(true);
    const payload = {
      internalTitle: internalTitle.trim(),
      text: text.trim(),
      buttonLabel: buttonLabel.trim() || undefined,
      buttonLink: buttonLink.trim() || undefined,
      bgColor,
      textColor,
      showOn: (allPages ? "all" : pages) as "all" | string[],
    };
    try {
      if (existing) await update({ id: existing._id, ...payload });
      else await create(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={existing ? "Edit announcement" : "New announcement"}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div>
          <label className={label}>Internal title (admin only)</label>
          <input
            className={field}
            value={internalTitle}
            onChange={(e) => setInternalTitle(e.target.value)}
            placeholder="Summer hours"
          />
        </div>
        <div>
          <label className={label}>Announcement text</label>
          <input
            className={field}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Open late all summer — come hang!"
          />
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
              placeholder="/events"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField
            label="Background color"
            value={bgColor}
            onChange={setBgColor}
          />
          <ColorField
            label="Text color"
            value={textColor}
            onChange={setTextColor}
          />
        </div>

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

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={btn.secondary} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={btn.primary}
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ColorField({
  label: lbl,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className={label}>{lbl}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded border-2 border-sand"
        />
        <input
          className={field}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
