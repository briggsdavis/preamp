import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

/**
 * Site Settings - global on/off switches for the public site. Currently a
 * single toggle for the Merch page: turning it off hides "Merch" from the nav
 * and redirects /retail to the home page. Backed by the `siteSettings`
 * singleton via convex/settings.ts.
 */
export function SiteSettings() {
  const settings = useQuery(api.settings.getSettings);
  const setMerchEnabled = useMutation(api.settings.setMerchEnabled);
  const [saving, setSaving] = useState(false);

  async function toggleMerch(next: boolean) {
    setSaving(true);
    try {
      await setMerchEnabled({ enabled: next });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-4xl text-espresso">Site Settings</h1>
        <p className="mt-1 text-sm text-espresso/60">
          Global switches for the public site. Changes go live immediately.
        </p>
      </div>

      {settings === undefined ? (
        <div className="h-28 max-w-2xl animate-pulse rounded-2xl border-2 border-sand bg-cream" />
      ) : (
        <div className="max-w-2xl space-y-4">
          <SettingRow
            title="Merch Page"
            description="When off, the Merch page is hidden from the navigation and its URL (/retail) redirects to the home page."
            enabled={settings.merchEnabled}
            saving={saving}
            onChange={toggleMerch}
          />
        </div>
      )}
    </div>
  );
}

function SettingRow({
  title,
  description,
  enabled,
  saving,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  saving: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6 rounded-2xl border-2 border-sand bg-cream p-5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-2xl text-espresso">{title}</h2>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
              enabled
                ? "bg-[#4a7c4e]/15 text-[#4a7c4e]"
                : "bg-espresso/10 text-espresso/55"
            }`}
          >
            {enabled ? "Live" : "Hidden"}
          </span>
        </div>
        <p className="mt-2 text-sm text-espresso/70">{description}</p>
      </div>
      <Toggle checked={enabled} disabled={saving} onChange={onChange} />
    </div>
  );
}

/** A pill switch. */
function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
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
  );
}
