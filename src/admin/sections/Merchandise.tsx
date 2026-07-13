import { useState, type FormEvent } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

import { field, label, btn, Modal } from "@/admin/ui";
import { useDialogs } from "@/admin/dialogs";
import { useUpload } from "@/admin/useUpload";

type MerchImage = {
  url: string | null;
  storageId?: Id<"_storage">;
  path?: string;
};

type MerchItem = {
  _id: Id<"merchItems">;
  sectionId: Id<"merchSections">;
  title: string;
  slug: string;
  price: string;
  description: string;
  purchaseUrl: string;
  image: string | null;
  imageRef?: {
    storageId?: Id<"_storage">;
    path?: string;
  };
  archived: boolean;
  order: number;
};

type MerchSection = {
  _id: Id<"merchSections">;
  title: string;
  order: number;
  items: MerchItem[];
};

export function Merchandise() {
  const { confirmThen, prompt } = useDialogs();
  const sections = useQuery(api.merch.adminList) as MerchSection[] | undefined;
  const createSection = useMutation(api.merch.createSection);
  const renameSection = useMutation(api.merch.renameSection);
  const deleteSection = useMutation(api.merch.deleteSection);
  const reorderSections = useMutation(api.merch.reorderSections);
  const deleteItem = useMutation(api.merch.deleteItem);
  const setArchived = useMutation(api.merch.setArchived);
  const [editing, setEditing] = useState<{
    item: MerchItem | null;
    sectionId: Id<"merchSections">;
  } | null>(null);

  async function addSection() {
    const title = await prompt({
      title: "New merch section",
      placeholder: "T-Shirts",
    });
    if (title) await createSection({ title });
  }

  async function moveSection(index: number, dir: -1 | 1) {
    if (!sections) return;
    const next = index + dir;
    if (next < 0 || next >= sections.length) return;
    const ids = sections.map((section) => section._id);
    [ids[index], ids[next]] = [ids[next], ids[index]];
    await reorderSections({ sectionIds: ids });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl text-espresso">Merchandise</h1>
        <button type="button" className={btn.primary} onClick={addSection}>
          + Section
        </button>
      </div>

      {sections === undefined && (
        <p className="mt-6 text-espresso/60">Loading…</p>
      )}

      {sections?.length === 0 && (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-sand p-6">
          <p className="text-espresso/60">
            No merch sections yet. Add a section like T-Shirts or Hats to start.
          </p>
        </div>
      )}

      <div className="mt-8 space-y-8">
        {sections?.map((section, index) => (
          <section
            key={section._id}
            className="rounded-2xl border-2 border-sand bg-cream p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-espresso">
                {section.title}
                <span className="ml-2 text-sm font-normal text-espresso/50">
                  {section.items.length} item
                  {section.items.length === 1 ? "" : "s"}
                </span>
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={btn.small}
                  disabled={index === 0}
                  onClick={() => void moveSection(index, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={btn.small}
                  disabled={index === sections.length - 1}
                  onClick={() => void moveSection(index, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={btn.small}
                  onClick={async () => {
                    const title = await prompt({
                      title: "Rename merch section",
                      defaultValue: section.title,
                    });
                    if (title)
                      await renameSection({
                        sectionId: section._id,
                        title,
                      });
                  }}
                >
                  Rename
                </button>
                <button
                  type="button"
                  className={btn.danger}
                  onClick={() =>
                    confirmThen(
                      `Delete the "${section.title}" section? It must be empty.`,
                      () => void deleteSection({ sectionId: section._id }),
                    )
                  }
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item) => (
                <div
                  key={item._id}
                  className={`flex gap-3 rounded-xl border border-sand bg-white p-3 ${
                    item.archived ? "opacity-60" : ""
                  }`}
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-cream-deep">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate font-semibold text-espresso">
                        {item.title}
                      </p>
                      <span className="shrink-0 text-sm text-brick">
                        {item.price}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs text-espresso/60">
                      {item.description}
                    </p>
                    {item.archived && (
                      <span className="mt-1 inline-block rounded-full bg-espresso/10 px-2 py-0.5 text-xs font-semibold text-espresso/60">
                        Archived
                      </span>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="text-xs font-semibold text-brick hover:underline"
                        onClick={() =>
                          setEditing({ item, sectionId: section._id })
                        }
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-xs font-semibold text-espresso/50 hover:underline"
                        onClick={() =>
                          void setArchived({
                            itemId: item._id,
                            archived: !item.archived,
                          })
                        }
                      >
                        {item.archived ? "Unarchive" : "Archive"}
                      </button>
                      <button
                        type="button"
                        className="text-xs font-semibold text-espresso/50 hover:underline"
                        onClick={() =>
                          confirmThen(`Delete "${item.title}"?`, () =>
                            void deleteItem({ itemId: item._id }),
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setEditing({ item: null, sectionId: section._id })}
                className="flex min-h-[5.5rem] items-center justify-center rounded-xl border-2 border-dashed border-sand text-sm font-semibold text-espresso/60 transition-colors hover:border-gold hover:text-espresso"
              >
                + Add merch
              </button>
            </div>
          </section>
        ))}
      </div>

      {editing && sections && (
        <MerchEditor
          sections={sections}
          item={editing.item}
          sectionId={editing.sectionId}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function MerchEditor({
  sections,
  item,
  sectionId,
  onClose,
}: {
  sections: MerchSection[];
  item: MerchItem | null;
  sectionId: Id<"merchSections">;
  onClose: () => void;
}) {
  const upload = useUpload();
  const createItem = useMutation(api.merch.createItem);
  const updateItem = useMutation(api.merch.updateItem);
  const moveItem = useMutation(api.merch.moveItem);

  const [title, setTitle] = useState(item?.title ?? "");
  const [price, setPrice] = useState(item?.price ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [purchaseUrl, setPurchaseUrl] = useState(item?.purchaseUrl ?? "");
  const [targetSection, setTargetSection] =
    useState<Id<"merchSections">>(sectionId);
  const [image, setImage] = useState<MerchImage | null>(
    item?.image
      ? {
          url: item.image,
          storageId: item.imageRef?.storageId,
          path: item.imageRef?.path,
        }
      : null,
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const storageId = await upload(file);
      setImage({ storageId, url: URL.createObjectURL(file) });
    } catch {
      setError("Image upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !price.trim() || !purchaseUrl.trim()) {
      setError("Title, price, and purchase link are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      title: title.trim(),
      price: price.trim(),
      description: description.trim(),
      purchaseUrl: purchaseUrl.trim(),
      image:
        image?.storageId || image?.path
          ? { storageId: image.storageId, path: image.path }
          : undefined,
    };
    try {
      if (item) {
        await updateItem({ itemId: item._id, ...payload });
        if (targetSection !== item.sectionId) {
          await moveItem({ itemId: item._id, sectionId: targetSection });
        }
      } else {
        await createItem({ sectionId: targetSection, ...payload });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save merch.");
      setSaving(false);
    }
  }

  return (
    <Modal title={item ? `Edit ${item.title}` : "New merch item"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={label}>Title</label>
          <input
            className={field}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Classic Logo Tee"
          />
        </div>
        <div>
          <label className={label}>Price</label>
          <input
            className={field}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="$28"
          />
        </div>
        <div>
          <label className={label}>Description</label>
          <textarea
            className={`${field} resize-none`}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className={label}>Purchase link</label>
          <input
            className={field}
            value={purchaseUrl}
            onChange={(e) => setPurchaseUrl(e.target.value)}
            placeholder="https://..."
            inputMode="url"
          />
        </div>
        <div>
          <label className={label}>Section</label>
          <select
            className={field}
            value={targetSection}
            onChange={(e) =>
              setTargetSection(e.target.value as Id<"merchSections">)
            }
          >
            {sections.map((section) => (
              <option key={section._id} value={section._id}>
                {section.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Image</label>
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-24 w-24 overflow-hidden rounded-lg border-2 border-sand bg-cream-deep">
              {image?.url && (
                <img
                  src={image.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <label className={`${btn.small} cursor-pointer`}>
              {uploading ? "Uploading…" : image ? "Replace image" : "+ Image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onImage}
              />
            </label>
            {image && (
              <button
                type="button"
                className={btn.danger}
                onClick={() => setImage(null)}
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-brick">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={btn.secondary} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className={btn.primary}
            disabled={saving || uploading}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
