import { api } from "@convex/_generated/api"
import { useMutation, useQuery } from "convex/react"
import { useState } from "react"

/**
 * Site Settings - global on/off switches for the public site. Each row toggles
 * one page: turning it off hides that page from the nav and redirects its URL
 * to the home page. (Gift Card is an external link, so its toggle only controls
 * nav visibility.) Backed by the `siteSettings` singleton via convex/settings.ts.
 */

/** The toggleable pages, in the order shown in the panel. */
const PAGES = [
  {
    page: "coffee",
    field: "coffeeEnabled",
    title: "Coffee Menu",
    description:
      "When off, the Coffee menu is hidden from the nav and /menu/coffee redirects to the home page.",
  },
  {
    page: "food",
    field: "foodEnabled",
    title: "Food Menu",
    description:
      "When off, the Food menu is hidden from the nav and /menu/food redirects to the home page.",
  },
  {
    page: "events",
    field: "eventsEnabled",
    title: "Events Page",
    description:
      "When off, the Events page is hidden from the nav and /events redirects to the home page.",
  },
  {
    page: "merch",
    field: "merchEnabled",
    title: "Merch Page",
    description:
      "When off, the Merch page is hidden from the nav and /retail redirects to the home page.",
  },
  {
    page: "coldBrew",
    field: "coldBrewEnabled",
    title: "Cold Brew Page",
    description:
      "When off, the Cold Brew page is hidden from the nav and /cold-brew redirects to the home page.",
  },
  {
    page: "about",
    field: "aboutEnabled",
    title: "About Page",
    description:
      "When off, the About page is hidden from the nav and /about redirects to the home page.",
  },
  {
    page: "hiring",
    field: "hiringEnabled",
    title: "Hiring Page",
    description:
      "When off, the Hiring page is hidden from the nav and /hiring redirects to the home page.",
  },
  {
    page: "giftCard",
    field: "giftCardEnabled",
    title: "Gift Card Link",
    description:
      "When off, the Gift Card link is removed from the nav. (It points to an external Toast page, so there is no site URL to redirect.)",
  },
] as const

export function SiteSettings() {
  const settings = useQuery(api.settings.getSettings)
  const setPageEnabled = useMutation(api.settings.setPageEnabled)
  // Track which page is mid-save so only that row's toggle is disabled.
  const [savingPage, setSavingPage] = useState<string | null>(null)

  async function togglePage(page: string, next: boolean) {
    setSavingPage(page)
    try {
      await setPageEnabled({ page: page as (typeof PAGES)[number]["page"], enabled: next })
    } finally {
      setSavingPage(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-4xl text-espresso">Site Settings</h1>
        <p className="mt-1 text-sm text-espresso/60">
          Show or hide pages on the public site. Changes go live immediately.
        </p>
      </div>

      {settings === undefined ? (
        <div className="h-28 max-w-2xl animate-pulse rounded-2xl border-2 border-sand bg-cream" />
      ) : (
        <div className="max-w-2xl space-y-4">
          {PAGES.map((p) => (
            <SettingRow
              key={p.page}
              title={p.title}
              description={p.description}
              enabled={settings[p.field]}
              saving={savingPage === p.page}
              onChange={(next) => togglePage(p.page, next)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SettingRow({
  title,
  description,
  enabled,
  saving,
  onChange,
}: {
  title: string
  description: string
  enabled: boolean
  saving: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-6 rounded-2xl border-2 border-sand bg-cream p-5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-2xl text-espresso">{title}</h2>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase ${
              enabled ? "bg-[#4a7c4e]/15 text-[#4a7c4e]" : "bg-espresso/10 text-espresso/55"
            }`}
          >
            {enabled ? "Live" : "Hidden"}
          </span>
        </div>
        <p className="mt-2 text-sm text-espresso/70">{description}</p>
      </div>
      <Toggle checked={enabled} disabled={saving} onChange={onChange} />
    </div>
  )
}

/** A pill switch. */
function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean
  disabled?: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
        checked ? "bg-[#4a7c4e]" : "bg-espresso/25"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-cream shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  )
}
