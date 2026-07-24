import { api } from "@convex/_generated/api"
import { useQuery, useMutation } from "convex/react"
import { Check, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { field, label, btn } from "@/admin/ui"
import { ContentIcon, DIETARY_ICON_OPTIONS, dietaryIconName } from "@/components/site/content-icon"

/**
 * Dietary tag picker for the menu item editor. Shows the curated + custom tag
 * catalog as toggle chips, and lets an admin add a new custom tag (name, icon,
 * icon, color) inline. Selection is a list of tag `key`s stored on the item.
 * Tags are optional - an item can have none.
 */

/** Mirror of the server slug rule so we can select a freshly-created tag. */
function slugifyKey(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "tag"
  )
}

function errData(e: unknown): string {
  return e && typeof e === "object" && "data" in e
    ? String((e as { data?: unknown }).data)
    : "Something went wrong."
}

export function DietaryTagPicker({
  value,
  onChange,
}: {
  value: string[]
  onChange: (keys: string[]) => void
}) {
  const tags = useQuery(api.dietaryTags.list)
  const create = useMutation(api.dietaryTags.create)
  const remove = useMutation(api.dietaryTags.remove)

  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState("")
  const [icon, setIcon] = useState("tag")
  const [color, setColor] = useState("#6b4a2f")
  const [error, setError] = useState<string | null>(null)

  function toggle(key: string) {
    onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key])
  }

  async function addTag() {
    const clean = newLabel.trim()
    if (!clean) return
    setError(null)
    try {
      await create({ label: clean, icon: icon.trim() || "tag", color })
      const key = slugifyKey(clean)
      if (!value.includes(key)) onChange([...value, key])
      setNewLabel("")
      setIcon("tag")
      setColor("#6b4a2f")
      setAdding(false)
    } catch (e) {
      setError(errData(e))
    }
  }

  return (
    <div>
      <label className={label}>Dietary tags (optional)</label>
      <div className="flex flex-wrap gap-2">
        {tags === undefined && <span className="text-sm text-espresso/50">Loading tags…</span>}
        {tags?.map((t) => {
          const selected = value.includes(t.key)
          return (
            <span key={t._id} className="group relative inline-flex">
              <button
                type="button"
                onClick={() => toggle(t.key)}
                aria-pressed={selected}
                className="inline-flex items-center gap-1 rounded-full border-2 px-3 py-1 text-sm font-semibold transition-all"
                style={
                  selected
                    ? { color: t.color, borderColor: t.color, background: `${t.color}18` }
                    : { color: "#7a6a5a", borderColor: "#e3d3b8", background: "transparent" }
                }
              >
                <ContentIcon name={dietaryIconName(t.key, t.icon)} className="h-4 w-4" />
                {t.label}
                {selected && <Check className="ml-0.5 h-3.5 w-3.5" />}
              </button>
              {!t.builtin && (
                <button
                  type="button"
                  title="Delete this custom tag"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete the "${t.label}" tag? It will be removed from all items.`,
                      )
                    )
                      void remove({ id: t._id })
                  }}
                  className="absolute -top-1.5 -right-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-espresso text-[0.6rem] text-cream group-hover:flex"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              )}
            </span>
          )
        })}
      </div>

      {adding ? (
        <div className="mt-3 rounded-xl border-2 border-sand bg-white p-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[10rem] flex-1">
              <label className={label}>Tag name</label>
              <input
                className={field}
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Oat Milk"
                autoFocus
              />
            </div>
            <div className="basis-full">
              <label className={label}>Icon</label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_ICON_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    title={option.label}
                    aria-label={option.label}
                    onClick={() => setIcon(option.value)}
                    className={`grid h-10 w-10 place-items-center rounded-md border-2 ${
                      icon === option.value
                        ? "border-gold bg-gold/10 text-brick"
                        : "border-sand bg-cream text-espresso/65"
                    }`}
                  >
                    <ContentIcon name={option.value} className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={label}>Color</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-12 cursor-pointer rounded border-2 border-sand"
              />
            </div>
            <button type="button" className={btn.primary} onClick={() => void addTag()}>
              Add
            </button>
            <button
              type="button"
              className={btn.secondary}
              onClick={() => {
                setAdding(false)
                setError(null)
              }}
            >
              Cancel
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-brick">{error}</p>}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 text-sm font-semibold text-brick hover:underline"
        >
          <Plus className="mr-1 inline h-4 w-4" />
          New custom tag
        </button>
      )}
    </div>
  )
}
