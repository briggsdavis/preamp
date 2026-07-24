import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import { useQuery, useMutation } from "convex/react"
import { GripVertical } from "lucide-react"
import { useRef, useState, type DragEvent, type FormEvent } from "react"
import { useDialogs } from "@/admin/dialogs"
import { field, label, btn, Modal } from "@/admin/ui"
import { useUpload } from "@/admin/use-upload"

type MerchImage = {
  url: string | null
  storageId?: Id<"_storage">
  path?: string
}

type MerchItem = {
  _id: Id<"merchItems">
  sectionId: Id<"merchSections">
  title: string
  slug: string
  price: string
  description: string
  purchaseUrl: string
  image: string | null
  images?: MerchImage[]
  imageRef?: {
    storageId?: Id<"_storage">
    path?: string
  }
  archived: boolean
  order: number
}

type MerchSection = {
  _id: Id<"merchSections">
  title: string
  order: number
  items: MerchItem[]
}

export function Merchandise() {
  const { confirm, prompt } = useDialogs()
  const sections = useQuery(api.merch.adminList) as MerchSection[] | undefined
  const createSection = useMutation(api.merch.createSection)
  const renameSection = useMutation(api.merch.renameSection)
  const deleteSection = useMutation(api.merch.deleteSection).withOptimisticUpdate((store, args) => {
    const current = store.getQuery(api.merch.adminList, {})
    if (!current) return
    store.setQuery(
      api.merch.adminList,
      {},
      current.filter((section) => section._id !== args.sectionId),
    )
  })
  const reorderSections = useMutation(api.merch.reorderSections)
  const reorderItems = useMutation(api.merch.reorderItems).withOptimisticUpdate((store, args) => {
    const current = store.getQuery(api.merch.adminList, {})
    if (!current) return
    const items = new Map(
      current.flatMap((section) => section.items.map((item) => [item._id, item] as const)),
    )
    store.setQuery(
      api.merch.adminList,
      {},
      current.map((section) => ({
        ...section,
        items: args.positions
          .filter((position) => position.sectionId === section._id)
          .sort((a, b) => a.order - b.order)
          .flatMap((position) => {
            const item = items.get(position.itemId)
            return item ? [{ ...item, sectionId: position.sectionId, order: position.order }] : []
          }),
      })),
    )
  })
  const deleteItem = useMutation(api.merch.deleteItem).withOptimisticUpdate((store, args) => {
    const current = store.getQuery(api.merch.adminList, {})
    if (!current) return
    store.setQuery(
      api.merch.adminList,
      {},
      current.map((section) => ({
        ...section,
        items: section.items.filter((item) => item._id !== args.itemId),
      })),
    )
  })
  const setArchived = useMutation(api.merch.setArchived)
  const [editing, setEditing] = useState<{
    item: MerchItem | null
    sectionId: Id<"merchSections">
  } | null>(null)
  const draggedItem = useRef<Id<"merchItems"> | null>(null)
  const [dropTarget, setDropTarget] = useState<{
    sectionId: Id<"merchSections">
    index: number
  } | null>(null)
  const [reorderError, setReorderError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function addSection() {
    const title = await prompt({
      title: "New merch section",
      placeholder: "T-Shirts",
    })
    if (title) await createSection({ title })
  }

  async function moveSection(index: number, dir: -1 | 1) {
    if (!sections) return
    const next = index + dir
    if (next < 0 || next >= sections.length) return
    const ids = sections.map((section) => section._id)
    ;[ids[index], ids[next]] = [ids[next], ids[index]]
    await reorderSections({ sectionIds: ids })
  }

  async function removeSection(section: MerchSection) {
    const itemCount = section.items.length
    const confirmed = await confirm({
      title: "Delete merch section",
      message:
        itemCount === 0
          ? `Permanently delete the "${section.title}" section?`
          : `Permanently delete the "${section.title}" section and all ${itemCount} product${
              itemCount === 1 ? "" : "s"
            } inside it?`,
      confirmLabel: "Delete",
    })
    if (!confirmed) return
    setDeleteError(null)
    try {
      await deleteSection({ sectionId: section._id })
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Couldn't delete this merch section.")
    }
  }

  async function removeItem(item: MerchItem) {
    const confirmed = await confirm({
      title: "Delete merch item",
      message: `Permanently delete "${item.title}"?`,
      confirmLabel: "Delete",
    })
    if (!confirmed) return
    setDeleteError(null)
    try {
      await deleteItem({ itemId: item._id })
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Couldn't delete this merch item.")
    }
  }

  function startItemDrag(event: DragEvent, itemId: Id<"merchItems">) {
    draggedItem.current = itemId
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", itemId)
  }

  async function dropItem(targetSectionId: Id<"merchSections">, targetIndex: number) {
    if (!sections) return
    const itemId = draggedItem.current
    if (!itemId) return

    const next = sections.map((section) => ({
      ...section,
      items: [...section.items],
    }))
    let moved: MerchItem | undefined
    let sourceSectionId: Id<"merchSections"> | undefined
    let sourceIndex = -1
    for (const section of next) {
      const index = section.items.findIndex((item) => item._id === itemId)
      if (index === -1) continue
      sourceSectionId = section._id
      sourceIndex = index
      ;[moved] = section.items.splice(index, 1)
      break
    }
    const target = next.find((section) => section._id === targetSectionId)
    if (!moved || !target) return
    if (sourceSectionId === targetSectionId && sourceIndex < targetIndex) {
      targetIndex -= 1
    }
    const insertionIndex = Math.max(0, Math.min(targetIndex, target.items.length))
    target.items.splice(insertionIndex, 0, {
      ...moved,
      sectionId: targetSectionId,
    })

    setReorderError(null)
    try {
      await reorderItems({
        positions: next.flatMap((section) =>
          section.items.map((item, order) => ({
            itemId: item._id,
            sectionId: section._id,
            order,
          })),
        ),
      })
    } catch (error) {
      setReorderError(error instanceof Error ? error.message : "Couldn't save the new merch order.")
    } finally {
      draggedItem.current = null
      setDropTarget(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl text-espresso">Merchandise</h1>
        <button type="button" className={btn.primary} onClick={addSection}>
          + Section
        </button>
      </div>

      {sections === undefined && <p className="mt-6 text-espresso/60">Loading…</p>}

      {sections?.length === 0 && (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-sand p-6">
          <p className="text-espresso/60">
            No merch sections yet. Add a section like T-Shirts or Hats to start.
          </p>
        </div>
      )}

      {reorderError && (
        <p className="mt-5 rounded-lg border border-brick/30 bg-brick/10 px-4 py-3 text-sm font-semibold text-brick">
          {reorderError}
        </p>
      )}
      {deleteError && (
        <p className="mt-5 rounded-lg border border-brick/30 bg-brick/10 px-4 py-3 text-sm font-semibold text-brick">
          {deleteError}
        </p>
      )}

      <div className="mt-8 space-y-8">
        {sections?.map((section, index) => (
          <section key={section._id} className="rounded-2xl border-2 border-sand bg-cream p-5">
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
                    })
                    if (title)
                      await renameSection({
                        sectionId: section._id,
                        title,
                      })
                  }}
                >
                  Rename
                </button>
                <button
                  type="button"
                  className={btn.danger}
                  onClick={() => void removeSection(section)}
                >
                  Delete
                </button>
              </div>
            </div>

            <div
              className={`mt-4 grid min-h-24 gap-3 rounded-lg sm:grid-cols-2 lg:grid-cols-3 ${
                dropTarget?.sectionId === section._id && dropTarget.index === section.items.length
                  ? "bg-gold/10 outline outline-2 outline-gold outline-dashed"
                  : ""
              }`}
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = "move"
                setDropTarget({
                  sectionId: section._id,
                  index: section.items.length,
                })
              }}
              onDrop={(event) => {
                event.preventDefault()
                void dropItem(section._id, section.items.length)
              }}
            >
              {section.items.map((item, itemIndex) => (
                <div
                  key={item._id}
                  draggable
                  onDragStart={(event) => startItemDrag(event, item._id)}
                  onDragEnd={() => {
                    draggedItem.current = null
                    setDropTarget(null)
                  }}
                  onDragOver={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    event.dataTransfer.dropEffect = "move"
                    setDropTarget({ sectionId: section._id, index: itemIndex })
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    void dropItem(section._id, itemIndex)
                  }}
                  className={`flex cursor-grab gap-2 rounded-xl border bg-white p-3 transition-[border-color,box-shadow,opacity] active:cursor-grabbing ${
                    item.archived ? "opacity-60" : ""
                  } ${
                    dropTarget?.sectionId === section._id && dropTarget.index === itemIndex
                      ? "border-gold shadow-[0_0_0_2px_var(--color-gold)]"
                      : "border-sand"
                  }`}
                >
                  <span
                    className="mt-5 grid h-7 w-5 shrink-0 place-items-center text-espresso/35"
                    title={`Drag ${item.title} to reorder`}
                    aria-label={`Drag ${item.title} to reorder`}
                  >
                    <GripVertical className="h-5 w-5" />
                  </span>
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
                      <p className="truncate font-semibold text-espresso">{item.title}</p>
                      <span className="shrink-0 text-sm text-brick">{item.price}</span>
                    </div>
                    <p className="line-clamp-2 text-xs text-espresso/60">{item.description}</p>
                    {item.archived && (
                      <span className="mt-1 inline-block rounded-full bg-espresso/10 px-2 py-0.5 text-xs font-semibold text-espresso/60">
                        Archived
                      </span>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="text-xs font-semibold text-brick hover:underline"
                        onClick={() => setEditing({ item, sectionId: section._id })}
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
                        onClick={() => void removeItem(item)}
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
  )
}

function MerchEditor({
  sections,
  item,
  sectionId,
  onClose,
}: {
  sections: MerchSection[]
  item: MerchItem | null
  sectionId: Id<"merchSections">
  onClose: () => void
}) {
  const upload = useUpload()
  const createItem = useMutation(api.merch.createItem)
  const updateItem = useMutation(api.merch.updateItem)
  const moveItem = useMutation(api.merch.moveItem)

  const [title, setTitle] = useState(item?.title ?? "")
  const [price, setPrice] = useState(item?.price ?? "")
  const [description, setDescription] = useState(item?.description ?? "")
  const [purchaseUrl, setPurchaseUrl] = useState(item?.purchaseUrl ?? "")
  const [targetSection, setTargetSection] = useState<Id<"merchSections">>(sectionId)
  const [images, setImages] = useState<MerchImage[]>(
    item?.images && item.images.length > 0
      ? item.images
      : item?.image
        ? [
            {
              url: item.image,
              storageId: item.imageRef?.storageId,
              path: item.imageRef?.path,
            },
          ]
        : [],
  )
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dragIndex = useRef<number | null>(null)

  async function addImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ""
    if (!files.length) return
    setUploading(true)
    setError(null)
    try {
      const uploaded: MerchImage[] = []
      for (const file of files) {
        const storageId = await upload(file)
        uploaded.push({ storageId, url: URL.createObjectURL(file) })
      }
      setImages((prev) => [...prev, ...uploaded])
    } catch {
      setError("Image upload failed. Try again.")
    } finally {
      setUploading(false)
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  function reorder(from: number, to: number) {
    setImages((prev) => {
      if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !price.trim() || !purchaseUrl.trim()) {
      setError("Title, price, and purchase link are required.")
      return
    }
    setSaving(true)
    setError(null)
    const payload = {
      title: title.trim(),
      price: price.trim(),
      description: description.trim(),
      purchaseUrl: purchaseUrl.trim(),
      images: images.map((image) => ({
        storageId: image.storageId,
        path: image.path,
      })),
    }
    try {
      if (item) {
        await updateItem({ itemId: item._id, ...payload })
        if (targetSection !== item.sectionId) {
          await moveItem({ itemId: item._id, sectionId: targetSection })
        }
      } else {
        await createItem({ sectionId: targetSection, ...payload })
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save merch.")
      setSaving(false)
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
            onChange={(e) => setTargetSection(e.target.value as Id<"merchSections">)}
          >
            {sections.map((section) => (
              <option key={section._id} value={section._id}>
                {section.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>
            Images - drag to reorder; the first is the primary one shown
          </label>
          <div className="flex flex-wrap gap-2">
            {images.map((image, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => (dragIndex.current = index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex.current !== null) reorder(dragIndex.current, index)
                  dragIndex.current = null
                }}
                className="relative h-24 w-24 cursor-grab overflow-hidden rounded-lg border-2 border-sand bg-cream-deep active:cursor-grabbing"
              >
                {image.url && <img src={image.url} alt="" className="h-full w-full object-cover" />}
                {index === 0 && (
                  <span className="absolute inset-x-0 bottom-0 bg-brick/90 py-0.5 text-center text-[0.6rem] font-semibold text-cream">
                    Primary
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  aria-label="Remove image"
                  className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-espresso/80 text-xs text-cream"
                >
                  ✕
                </button>
              </div>
            ))}
            <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-sand text-center text-xs font-semibold text-espresso/60 transition-colors hover:border-gold hover:text-espresso">
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
        <div>
          <label className={label}>Preview</label>
          <div className="h-24 w-24 overflow-hidden rounded-lg border-2 border-sand bg-cream-deep">
            {images[0]?.url && (
              <img src={images[0].url} alt="" className="h-full w-full object-cover" />
            )}
          </div>
        </div>

        {error && <p className="text-sm text-brick">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={btn.secondary} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={btn.primary} disabled={saving || uploading}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
