import { useRef, useState, type FormEvent } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

import { field, label, btn, Modal, confirmThen } from "@/admin/ui";
import { useUpload } from "@/admin/useUpload";

/**
 * Menu manager for one menu kind ("coffee" | "food"). Handles the menu PDF,
 * sections (create / rename / reorder / delete), and items (create / edit /
 * move between sections / delete) against the Convex backend.
 */

type Menu = "coffee" | "food";

type SectionData = {
  _id: Id<"menuSections">;
  title: string;
  order: number;
  items: ItemData[];
};

type ItemImage = {
  url: string | null;
  storageId?: Id<"_storage">;
  path?: string;
};

type ItemData = {
  _id: Id<"menuItems">;
  sectionId: Id<"menuSections">;
  name: string;
  price: string;
  description: string;
  images: ItemImage[];
  likes: number;
};

export function MenuManager({ menu }: { menu: Menu }) {
  const data = useQuery(api.menu.getMenu, { menu });

  const createSection = useMutation(api.menu.createSection);
  const renameSection = useMutation(api.menu.renameSection);
  const deleteSection = useMutation(api.menu.deleteSection);
  const reorderSections = useMutation(api.menu.reorderSections);
  const deleteItem = useMutation(api.menu.deleteItem);
  const seed = useMutation(api.menu.seed);

  const [editing, setEditing] = useState<{
    item: ItemData | null;
    sectionId: Id<"menuSections">;
  } | null>(null);

  if (data === undefined) {
    return <Loading menu={menu} />;
  }

  const sections = data.sections as SectionData[];

  async function addSection() {
    const title = window.prompt("New section name?");
    if (title?.trim()) await createSection({ menu, title: title.trim() });
  }

  async function moveSection(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= sections.length) return;
    const ids = sections.map((s) => s._id);
    [ids[index], ids[next]] = [ids[next], ids[index]];
    await reorderSections({ sectionIds: ids });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl capitalize text-espresso">
          {menu} Menu
        </h1>
        <button type="button" className={btn.primary} onClick={addSection}>
          + Section
        </button>
      </div>

      <MenuPdf menu={menu} pdf={data.pdf} />

      <div className="mt-8 space-y-8">
        {sections.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-sand p-6">
            <p className="text-espresso/60">
              No sections yet. Add one to start building the {menu} menu, or
              seed the original coffee &amp; food menu in one click.
            </p>
            <button
              type="button"
              className={`${btn.secondary} mt-4`}
              onClick={() =>
                confirmThen(
                  "Seed the original coffee & food menu? This only runs if the menu is empty.",
                  () => void seed({}),
                )
              }
            >
              Seed original menu
            </button>
          </div>
        )}

        {sections.map((section, index) => (
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
                    const title = window.prompt("Rename section", section.title);
                    if (title?.trim())
                      await renameSection({
                        sectionId: section._id,
                        title: title.trim(),
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
                  className="flex gap-3 rounded-xl border border-sand bg-white p-3"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-cream-deep">
                    {item.images[0]?.url && (
                      <img
                        src={item.images[0].url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate font-semibold text-espresso">
                        {item.name}
                      </p>
                      <span className="shrink-0 text-sm text-brick">
                        {item.price}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs text-espresso/60">
                      {item.description}
                    </p>
                    <div className="mt-2 flex gap-2">
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
                          confirmThen(`Delete "${item.name}"?`, () =>
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
                + Add item
              </button>
            </div>
          </section>
        ))}
      </div>

      {editing && (
        <ItemEditor
          menu={menu}
          sections={sections}
          item={editing.item}
          sectionId={editing.sectionId}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function Loading({ menu }: { menu: Menu }) {
  return (
    <div>
      <h1 className="font-display text-4xl capitalize text-espresso">
        {menu} Menu
      </h1>
      <p className="mt-4 text-espresso/60">Loading…</p>
    </div>
  );
}

// --- Menu PDF ---------------------------------------------------------------

function MenuPdf({
  menu,
  pdf,
}: {
  menu: Menu;
  pdf: { url: string | null; name: string } | null;
}) {
  const upload = useUpload();
  const setMenuPdf = useMutation(api.menu.setMenuPdf);
  const removeMenuPdf = useMutation(api.menu.removeMenuPdf);
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const storageId = await upload(file);
      await setMenuPdf({ menu, pdfStorageId: storageId, pdfName: file.name });
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-sand bg-cream p-4">
      <span className="font-semibold text-espresso">Menu PDF:</span>
      {pdf ? (
        <a
          href={pdf.url ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="text-brick underline-offset-2 hover:underline"
        >
          {pdf.name}
        </a>
      ) : (
        <span className="text-espresso/55">None uploaded</span>
      )}
      <label className={`${btn.small} cursor-pointer`}>
        {busy ? "Uploading…" : pdf ? "Replace" : "Upload"}
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={onFile}
        />
      </label>
      {pdf && (
        <button
          type="button"
          className={btn.danger}
          onClick={() =>
            confirmThen("Remove the menu PDF?", () =>
              void removeMenuPdf({ menu }),
            )
          }
        >
          Remove
        </button>
      )}
    </div>
  );
}

// --- Item editor modal ------------------------------------------------------

function ItemEditor({
  menu,
  sections,
  item,
  sectionId,
  onClose,
}: {
  menu: Menu;
  sections: SectionData[];
  item: ItemData | null;
  sectionId: Id<"menuSections">;
  onClose: () => void;
}) {
  const upload = useUpload();
  const createItem = useMutation(api.menu.createItem);
  const updateItem = useMutation(api.menu.updateItem);
  const moveItem = useMutation(api.menu.moveItem);

  const [name, setName] = useState(item?.name ?? "");
  const [price, setPrice] = useState(item?.price ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [targetSection, setTargetSection] =
    useState<Id<"menuSections">>(sectionId);
  const [images, setImages] = useState<ItemImage[]>(item?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragIndex = useRef<number | null>(null);

  async function addImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: ItemImage[] = [];
      for (const f of files) {
        const storageId = await upload(f);
        uploaded.push({ storageId, url: URL.createObjectURL(f) });
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch {
      setError("Image upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function reorder(from: number, to: number) {
    setImages((prev) => {
      if (
        from === to ||
        from < 0 ||
        to < 0 ||
        from >= prev.length ||
        to >= prev.length
      )
        return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price.trim()) {
      setError("Name and price are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const imagePayload = images.map((img) => ({
        storageId: img.storageId,
        path: img.path,
      }));

      if (item === null) {
        await createItem({
          sectionId: targetSection,
          name: name.trim(),
          price: price.trim(),
          description: description.trim(),
          images: imagePayload,
        });
      } else {
        await updateItem({
          itemId: item._id,
          name: name.trim(),
          price: price.trim(),
          description: description.trim(),
          images: imagePayload,
        });
        if (targetSection !== item.sectionId) {
          await moveItem({ itemId: item._id, sectionId: targetSection });
        }
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <Modal
      title={item === null ? `New ${menu} item` : `Edit ${item.name}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={label}>Name</label>
          <input
            className={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Latte"
          />
        </div>
        <div>
          <label className={label}>Price</label>
          <input
            className={field}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="$4.75"
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
          <label className={label}>Section</label>
          <select
            className={field}
            value={targetSection}
            onChange={(e) =>
              setTargetSection(e.target.value as Id<"menuSections">)
            }
          >
            {sections.map((s) => (
              <option key={s._id} value={s._id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>
            Images — drag to reorder; the first is the primary one shown
          </label>
          <div className="flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => (dragIndex.current = i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex.current !== null)
                    reorder(dragIndex.current, i);
                  dragIndex.current = null;
                }}
                className="relative h-20 w-20 cursor-grab overflow-hidden rounded-lg border-2 border-sand bg-cream-deep active:cursor-grabbing"
              >
                {img.url && (
                  <img
                    src={img.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
                {i === 0 && (
                  <span className="absolute inset-x-0 bottom-0 bg-brick/90 py-0.5 text-center text-[0.6rem] font-semibold text-cream">
                    Primary
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  aria-label="Remove image"
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-espresso/80 text-xs text-cream"
                >
                  ✕
                </button>
              </div>
            ))}
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-sand text-center text-xs font-semibold text-espresso/60 transition-colors hover:border-gold hover:text-espresso">
              {uploading ? "Uploading…" : "+ Add"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={addImages}
              />
            </label>
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
