import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

import { field, label, btn, Modal } from "@/admin/ui";
import { useDialogs } from "@/admin/dialogs";
import { useUpload } from "@/admin/useUpload";

/**
 * Events manager: create / edit / delete events (title, date & time, short
 * description, up to 3 carousel images) and seed the original three.
 */

const MAX_IMAGES = 3;

type EventImage = {
  storageId?: Id<"_storage">;
  path?: string;
  url: string | null;
};

type EventData = {
  _id: Id<"events">;
  title: string;
  description: string;
  startsAt: number;
  images: EventImage[];
};

const pad = (n: number) => String(n).padStart(2, "0");

/** epoch ms -> value for a <input type="datetime-local"> (local time). */
function toLocalInput(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function fmt(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function Events() {
  const { confirmThen } = useDialogs();
  const rows = useQuery(api.events.adminList) as EventData[] | undefined;
  const remove = useMutation(api.events.remove);
  const seed = useMutation(api.events.seed);
  const [editing, setEditing] = useState<EventData | "new" | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl text-espresso">Events</h1>
        <button
          type="button"
          className={btn.primary}
          onClick={() => setEditing("new")}
        >
          + New event
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {rows === undefined && <p className="text-espresso/60">Loading…</p>}
        {rows?.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-sand p-6">
            <p className="text-espresso/60">
              No events yet. Add one, or seed the original three.
            </p>
            <button
              type="button"
              className={`${btn.secondary} mt-4`}
              onClick={() =>
                confirmThen(
                  "Seed the original three events? Only runs if there are none.",
                  () => void seed({}),
                )
              }
            >
              Seed original events
            </button>
          </div>
        )}
        {rows?.map((ev) => (
          <div
            key={ev._id}
            className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-sand bg-cream p-4"
          >
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-cream-deep">
              {ev.images[0]?.url && (
                <img
                  src={ev.images[0].url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="min-w-[12rem] flex-1">
              <p className="font-semibold text-espresso">{ev.title}</p>
              <p className="text-sm text-espresso/55">{fmt(ev.startsAt)}</p>
            </div>
            <button
              type="button"
              className={btn.small}
              onClick={() => setEditing(ev)}
            >
              Edit
            </button>
            <button
              type="button"
              className={btn.danger}
              onClick={() =>
                confirmThen(`Delete "${ev.title}"?`, () =>
                  void remove({ id: ev._id }),
                )
              }
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {editing && (
        <EventForm
          existing={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function EventForm({
  existing,
  onClose,
}: {
  existing: EventData | null;
  onClose: () => void;
}) {
  const upload = useUpload();
  const create = useMutation(api.events.create);
  const update = useMutation(api.events.update);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [when, setWhen] = useState(
    existing ? toLocalInput(existing.startsAt) : "",
  );
  const [images, setImages] = useState<EventImage[]>(existing?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    setError(null);
    try {
      const next: EventImage[] = [];
      for (const file of files) {
        if (images.length + next.length >= MAX_IMAGES) break;
        const storageId = await upload(file);
        next.push({ storageId, url: URL.createObjectURL(file) });
      }
      setImages((prev) => [...prev, ...next].slice(0, MAX_IMAGES));
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function save() {
    if (!title.trim() || !when) {
      setError("Title and date/time are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      title: title.trim(),
      description: description.trim(),
      startsAt: new Date(when).getTime(),
      images: images.map((img) => ({
        storageId: img.storageId,
        path: img.path,
      })),
    };
    try {
      if (existing) await update({ id: existing._id, ...payload });
      else await create(payload);
      onClose();
    } catch {
      setError("Couldn't save the event.");
      setSaving(false);
    }
  }

  return (
    <Modal title={existing ? "Edit event" : "New event"} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className={label}>Title</label>
          <input
            className={field}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className={label}>Date &amp; time</label>
          <input
            type="datetime-local"
            className={field}
            value={when}
            onChange={(e) => setWhen(e.target.value)}
          />
        </div>
        <div>
          <label className={label}>Short description</label>
          <textarea
            className={`${field} resize-none`}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className={label}>Images — up to {MAX_IMAGES}</label>
          <div className="flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div
                key={i}
                className="relative h-20 w-20 overflow-hidden rounded-lg border-2 border-sand bg-cream-deep"
              >
                {img.url && (
                  <img
                    src={img.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-espresso/80 text-xs text-cream"
                >
                  ✕
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <label
                className={`${btn.small} flex h-20 w-20 cursor-pointer items-center justify-center text-center`}
              >
                {uploading ? "…" : "+ Image"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={addImages}
                />
              </label>
            )}
          </div>
        </div>

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
