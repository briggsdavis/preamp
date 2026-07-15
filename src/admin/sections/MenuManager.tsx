import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

import { field, label, btn, Modal } from "@/admin/ui";
import { useDialogs } from "@/admin/dialogs";
import { useUpload } from "@/admin/useUpload";
import { DietaryTagPicker } from "@/admin/DietaryTagPicker";

// Recharts is heavy - load the analytics panel (and recharts) only when opened.
const MenuAnalyticsPanel = lazy(() =>
  import("@/admin/analyticsPanels").then((m) => ({
    default: m.MenuAnalyticsPanel,
  })),
);

/**
 * Menu manager for one menu kind ("coffee" | "food"). Handles the menu PDF,
 * sections (create / rename / reorder / delete), and items (create / edit /
 * move between sections / delete) against the Convex backend.
 */

type Menu = string;

type MenuPageMeta = {
  slug: string;
  title: string;
  eyebrow: string;
};

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
  dietaryTags: string[];
  orderUrl: string | null;
  images: ItemImage[];
  featured: boolean;
  likes: number;
};

/** Best-effort check that a URL points at Toast's ordering domain. */
function isToastUrl(url: string): boolean {
  try {
    const host = new URL(url.trim()).hostname.toLowerCase();
    return host === "toasttab.com" || host.endsWith(".toasttab.com");
  } catch {
    return false;
  }
}

export function MenuManager({ menu }: { menu: Menu }) {
  const { confirmThen, prompt } = useDialogs();
  const data = useQuery(api.menu.getMenu, { menu });

  const updateMenuPage = useMutation(api.menu.updateMenuPage);
  const createSection = useMutation(api.menu.createSection);
  const renameSection = useMutation(api.menu.renameSection);
  const deleteSection = useMutation(api.menu.deleteSection);
  const reorderSections = useMutation(api.menu.reorderSections);
  const deleteItem = useMutation(api.menu.deleteItem);
  const setItemFeatured = useMutation(api.menu.setItemFeatured);
  const seed = useMutation(api.menu.seed);
  const seedMerch = useMutation(api.menu.seedMerch);
  const seedTags = useMutation(api.dietaryTags.seedBuiltins);

  // Make sure the curated dietary tags exist so the item editor's picker is
  // populated. Idempotent; runs once when the manager mounts.
  useEffect(() => {
    void seedTags({});
  }, [seedTags]);

  const [editing, setEditing] = useState<{
    item: ItemData | null;
    sectionId: Id<"menuSections">;
  } | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  if (data === undefined) {
    return <Loading menu={menu} />;
  }

  const sections = data.sections as SectionData[];
  const page = data.page as MenuPageMeta | null;
  const isMerch = menu === "merch";
  const analyticsMenu = menu === "coffee" || menu === "food" ? menu : null;

  async function addSection() {
    const title = await prompt({
      title: "New section",
      placeholder: "Section name",
    });
    if (title) await createSection({ menu, title });
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
        <div>
          <h1 className="font-display text-4xl text-espresso">
            {page?.title ?? (isMerch ? "Merch" : `${menu} Menu`)}
          </h1>
          {page && (
            <p className="mt-1 font-groovy text-xs uppercase tracking-[0.25em] text-terracotta">
              {page.eyebrow}
            </p>
          )}
        </div>
        <button type="button" className={btn.primary} onClick={addSection}>
          + Section
        </button>
      </div>

      {page && (
        <MenuPageFields
          page={page}
          onSave={(fields) => updateMenuPage({ slug: menu, ...fields })}
        />
      )}

      {!isMerch && <MenuPdf menu={menu} pdf={data.pdf} />}

      {analyticsMenu && <div className="mt-5 rounded-2xl border-2 border-sand bg-cream">
        <button
          type="button"
          onClick={() => setShowAnalytics((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3 text-left"
        >
          <span className="font-groovy text-sm uppercase tracking-[0.2em] text-terracotta">
            Menu Analytics
          </span>
          <span className="text-xs font-semibold text-espresso/60">
            {showAnalytics ? "Hide ▲" : "Show ▼"}
          </span>
        </button>
        {showAnalytics && (
          <Suspense
            fallback={
              <p className="border-t-2 border-sand p-5 text-sm text-espresso/50">
                Loading analytics…
              </p>
            }
          >
            <MenuAnalyticsPanel menu={analyticsMenu} />
          </Suspense>
        )}
      </div>}

      <div className="mt-8 space-y-8">
        {sections.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-sand p-6">
            <p className="text-espresso/60">
              No sections yet. Add one to start building this {isMerch ? "merch catalog" : "menu"}, or
              seed the original content in one click.
            </p>
            <button
              type="button"
              className={`${btn.secondary} mt-4`}
              onClick={() =>
                confirmThen(
                  isMerch
                    ? "Seed the original merch catalog? This only runs if merch is empty."
                    : "Seed the original coffee & food menu? This only runs if the menu is empty.",
                  () => void (isMerch ? seedMerch({}) : seed({})),
                )
              }
            >
              Seed original {isMerch ? "merch" : "menu"}
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
                    const title = await prompt({
                      title: "Rename section",
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
                        className={`text-xs font-semibold hover:underline ${
                          item.featured ? "text-brick" : "text-espresso/50"
                        }`}
                        onClick={() =>
                          void setItemFeatured({
                            itemId: item._id,
                            featured: !item.featured,
                          })
                        }
                        title="Show in Best Sellers on the home page"
                      >
                        {item.featured ? "★ Featured" : "☆ Feature"}
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
          linkLabel={isMerch ? "Product link" : "Toast order link"}
          linkHelp={
            isMerch
              ? "The public Shop button opens this link in a new tab. Full external URLs and plain domains both work."
              : "The item's public Order button opens this link. Leave blank to disable that button for this item."
          }
          warnToast={!isMerch}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function MenuPageFields({
  page,
  onSave,
}: {
  page: MenuPageMeta;
  onSave: (fields: { title: string; eyebrow: string }) => Promise<unknown>;
}) {
  const [title, setTitle] = useState(page.title);
  const [eyebrow, setEyebrow] = useState(page.eyebrow);
  const [saving, setSaving] = useState(false);
  const dirty = title !== page.title || eyebrow !== page.eyebrow;

  async function save() {
    if (!dirty || !title.trim()) return;
    setSaving(true);
    try {
      await onSave({ title: title.trim(), eyebrow: eyebrow.trim() });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-5 grid gap-3 rounded-2xl border-2 border-sand bg-cream p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
      <div>
        <label className={label}>Page title</label>
        <input
          className={field}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <label className={label}>Eyebrow text</label>
        <input
          className={field}
          value={eyebrow}
          onChange={(e) => setEyebrow(e.target.value)}
        />
      </div>
      <button
        type="button"
        className={btn.primary}
        disabled={!dirty || saving || !title.trim()}
        onClick={() => void save()}
      >
        {saving ? "Saving…" : "Save"}
      </button>
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
  const { confirmThen } = useDialogs();
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
  linkLabel,
  linkHelp,
  warnToast,
  onClose,
}: {
  menu: Menu;
  sections: SectionData[];
  item: ItemData | null;
  sectionId: Id<"menuSections">;
  linkLabel: string;
  linkHelp: string;
  warnToast: boolean;
  onClose: () => void;
}) {
  const upload = useUpload();
  const createItem = useMutation(api.menu.createItem);
  const updateItem = useMutation(api.menu.updateItem);
  const moveItem = useMutation(api.menu.moveItem);

  const [name, setName] = useState(item?.name ?? "");
  const [price, setPrice] = useState(item?.price ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [orderUrl, setOrderUrl] = useState(item?.orderUrl ?? "");
  const [dietaryTags, setDietaryTags] = useState<string[]>(
    item?.dietaryTags ?? [],
  );
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

      const trimmedOrderUrl = orderUrl.trim() || undefined;

      if (item === null) {
        await createItem({
          sectionId: targetSection,
          name: name.trim(),
          price: price.trim(),
          description: description.trim(),
          orderUrl: trimmedOrderUrl,
          dietaryTags,
          images: imagePayload,
        });
      } else {
        await updateItem({
          itemId: item._id,
          name: name.trim(),
          price: price.trim(),
          description: description.trim(),
          orderUrl: trimmedOrderUrl,
          dietaryTags,
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
          <label className={label}>{linkLabel}</label>
          <input
            className={field}
            value={orderUrl}
            onChange={(e) => setOrderUrl(e.target.value)}
            placeholder={warnToast ? "https://order.toasttab.com/online/…" : "https://example.com/product"}
            inputMode="url"
          />
          {warnToast && orderUrl.trim() && !isToastUrl(orderUrl) ? (
            <p className="mt-1 text-xs font-semibold text-brick">
              ⚠ This doesn't look like a Toast link (toasttab.com). Double-check
              it before saving - the item's Order button points here.
            </p>
          ) : (
            <p className="mt-1 text-xs text-espresso/50">
              {linkHelp}
            </p>
          )}
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
        <DietaryTagPicker value={dietaryTags} onChange={setDietaryTags} />
        <div>
          <label className={label}>
            Images - drag to reorder; the first is the primary one shown
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
