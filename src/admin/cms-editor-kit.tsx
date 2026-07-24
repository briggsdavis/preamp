import { api } from "@convex/_generated/api"
import { useMutation, useQuery } from "convex/react"
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react"
import { field, label } from "@/admin/ui"
import { useUpload } from "@/admin/use-upload"
import {
  CONTENT_DEFAULTS,
  imageUrl,
  mergeContent,
  type CmsImage,
  type CmsKey,
} from "@/lib/site-content"

export function useCmsEditor<K extends CmsKey>(key: K) {
  const row = useQuery(api.cms.getForAdmin, { key })
  const saveContent = useMutation(api.cms.save)
  const [content, setContent] = useState(() => structuredClone(CONTENT_DEFAULTS[key]))
  const [baseline, setBaseline] = useState(() => JSON.stringify(CONTENT_DEFAULTS[key]))
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // React permits guarded render-time state adjustment for data-derived form
  // initialization. This avoids an extra effect render and only runs once.
  if (row !== undefined && !loaded) {
    const merged = mergeContent(key, row?.content)
    setContent(merged)
    setBaseline(JSON.stringify(merged))
    setLoaded(true)
  }

  const dirty = JSON.stringify(content) !== baseline

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  async function save() {
    if (!dirty || saving) return
    setSaving(true)
    setError(null)
    try {
      await saveContent({ key, content })
      setBaseline(JSON.stringify(content))
      setSavedAt(Date.now())
    } catch {
      setError("Could not save these changes. Please check your connection and try again.")
    } finally {
      setSaving(false)
    }
  }

  function discard() {
    setContent(JSON.parse(baseline) as typeof content)
  }

  return {
    content,
    setContent,
    ready: loaded,
    dirty,
    saving,
    savedAt,
    error,
    save,
    discard,
  }
}

export function EditorShell({
  eyebrow,
  title,
  description,
  dirty,
  saving,
  savedAt,
  error,
  onSave,
  onDiscard,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  dirty: boolean
  saving: boolean
  savedAt: number | null
  error?: string | null
  onSave: () => void
  onDiscard: () => void
  children: ReactNode
}) {
  return (
    <div className="mx-auto max-w-[1380px]">
      <div className="sticky top-0 z-40 -mx-3 mb-7 flex flex-wrap items-center justify-between gap-4 border-b-2 border-sand bg-cream-deep/95 px-3 pt-1 pb-5 backdrop-blur-md">
        <div>
          <p className="font-groovy text-xs tracking-[0.3em] text-terracotta uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-1 font-display text-4xl text-espresso">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-espresso/65">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="min-w-24 text-right text-xs font-semibold text-espresso/55">
            {saving ? "Saving..." : dirty ? "Unsaved changes" : savedAt ? "Saved" : "Up to date"}
          </div>
          {dirty && (
            <button
              type="button"
              onClick={onDiscard}
              className="rounded-full px-4 py-2 text-sm font-semibold text-espresso/65 transition-colors hover:bg-espresso/10"
            >
              Discard
            </button>
          )}
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={onSave}
            className={`min-w-36 rounded-full px-6 py-3 font-semibold shadow-sm transition-all ${
              dirty
                ? "bg-brick text-cream hover:-translate-y-0.5 hover:bg-maroon"
                : "cursor-not-allowed bg-espresso/15 text-espresso/40"
            }`}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
      {error && (
        <p className="mb-5 rounded-lg border-2 border-brick/30 bg-brick/10 px-4 py-3 text-sm font-semibold text-brick">
          {error}
        </p>
      )}
      {children}
    </div>
  )
}

export function SectionTabs({
  items,
  active,
  onChange,
}: {
  items: Array<{ id: string; label: string }>
  active: string
  onChange: (id: string) => void
}) {
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={`shrink-0 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors ${
            active === item.id
              ? "border-espresso bg-espresso text-cream"
              : "border-sand bg-cream text-espresso/70 hover:border-gold"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export function SectionWorkspace({
  preview,
  children,
}: {
  preview: ReactNode
  children: ReactNode
}) {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.65fr)]">
      <div className="overflow-hidden rounded-lg border-2 border-sand bg-cream shadow-sm">
        <div className="flex items-center justify-between border-b border-sand bg-white px-4 py-2.5">
          <p className="text-xs font-bold tracking-[0.16em] text-espresso/55 uppercase">
            Live preview
          </p>
          <p className="text-xs text-espresso/45">Updates as you type</p>
        </div>
        {preview}
      </div>
      <div className="rounded-lg border-2 border-sand bg-cream p-5 shadow-sm">
        <p className="mb-5 font-display text-2xl text-espresso">Content</p>
        <div className="space-y-5">{children}</div>
      </div>
    </div>
  )
}

export function TextField({
  labelText,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  labelText: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label>
      <span className={label}>{labelText}</span>
      <input
        type={type}
        className={field}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

export function TextArea({
  labelText,
  value,
  onChange,
  rows = 4,
  hint,
}: {
  labelText: string
  value: string
  onChange: (value: string) => void
  rows?: number
  hint?: string
}) {
  return (
    <label>
      <span className={label}>{labelText}</span>
      {hint && <span className="mb-1 block text-xs text-espresso/50">{hint}</span>}
      <textarea
        className={`${field} resize-y leading-relaxed`}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

export function LinkFields({
  title,
  value,
  onChange,
}: {
  title: string
  value: { label: string; href: string }
  onChange: (value: { label: string; href: string }) => void
}) {
  return (
    <fieldset className="rounded-lg border border-sand bg-white/60 p-4">
      <legend className="px-1 text-sm font-bold text-espresso/75">{title}</legend>
      <div className="space-y-3">
        <TextField
          labelText="Button text"
          value={value.label}
          onChange={(labelValue) => onChange({ ...value, label: labelValue })}
        />
        <TextField
          labelText="Link"
          value={value.href}
          placeholder="/contact or https://..."
          onChange={(href) => onChange({ ...value, href })}
        />
      </div>
    </fieldset>
  )
}

export function ImageField({
  labelText,
  value,
  onChange,
  ratio,
  dimensions,
}: {
  labelText: string
  value: CmsImage
  onChange: (value: CmsImage) => void
  ratio: string
  dimensions: string
}) {
  const upload = useUpload()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const storageId = await upload(file)
      onChange({
        storageId,
        url: URL.createObjectURL(file),
        alt: value.alt,
      })
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <span className={label}>{labelText}</span>
        <span className="text-right text-xs font-semibold text-terracotta">
          {ratio} · {dimensions}
        </span>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative block w-full overflow-hidden rounded-lg border-2 border-dashed border-gold bg-espresso/5 text-left"
        style={{ aspectRatio: ratio.replace(":", " / ") }}
      >
        {imageUrl(value) ? (
          <img src={imageUrl(value)} alt={value.alt} className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full place-items-center text-sm font-semibold text-espresso/50">
            Choose image
          </span>
        )}
        <span className="absolute inset-0 grid place-items-center bg-espresso/55 text-sm font-bold text-cream opacity-0 transition-opacity group-hover:opacity-100">
          {uploading ? "Uploading..." : "Replace image"}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={onFile}
      />
      <label className="mt-3 block">
        <span className={label}>Image description</span>
        <input
          className={field}
          value={value.alt}
          placeholder="Describe the image for accessibility"
          onChange={(event) => onChange({ ...value, alt: event.target.value })}
        />
      </label>
    </div>
  )
}

export function LoadingEditor() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <p className="font-display text-3xl text-espresso/50">Loading editor...</p>
    </div>
  )
}
