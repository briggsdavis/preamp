import { useState } from "react";

import {
  EditorShell,
  LoadingEditor,
  TextArea,
  TextField,
  useCmsEditor,
} from "@/admin/CmsEditorKit";
import { SocialIcon } from "@/components/site/SocialIcons";
import type { SocialPlatform } from "@/lib/siteContent";

const platforms: Array<{ id: SocialPlatform; label: string }> = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "x", label: "X" },
];

function SectionTitle({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-5">
      <h2 className="font-display text-2xl text-espresso">{title}</h2>
      <p className="mt-1 text-sm text-espresso/60">{body}</p>
    </div>
  );
}

function MoveButtons({
  index,
  length,
  onMove,
}: {
  index: number;
  length: number;
  onMove: (direction: -1 | 1) => void;
}) {
  return (
    <div className="flex gap-1">
      <button type="button" aria-label="Move up" title="Move up" disabled={index === 0} onClick={() => onMove(-1)} className="grid h-8 w-8 place-items-center rounded-full bg-espresso/10 text-espresso disabled:opacity-30">↑</button>
      <button type="button" aria-label="Move down" title="Move down" disabled={index === length - 1} onClick={() => onMove(1)} className="grid h-8 w-8 place-items-center rounded-full bg-espresso/10 text-espresso disabled:opacity-30">↓</button>
    </div>
  );
}

function PlatformPicker({
  value,
  onChange,
}: {
  value: SocialPlatform;
  onChange: (value: SocialPlatform) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = platforms.find((platform) => platform.id === value) ?? platforms[0];
  return (
    <div className="relative">
      <p className="mb-1 text-sm font-semibold text-espresso/80">Network</p>
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between rounded-xl border-2 border-sand bg-white px-3 py-2 text-left text-espresso outline-none focus:border-gold">
        <span className="flex items-center gap-2"><SocialIcon platform={selected.id} className="h-5 w-5" />{selected.label}</span>
        <span className="text-xs text-espresso/45">▼</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden rounded-xl border-2 border-sand bg-white shadow-xl">
          {platforms.map((platform) => (
            <button key={platform.id} type="button" onClick={() => { onChange(platform.id); setOpen(false); }} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-espresso hover:bg-cream-deep">
              <SocialIcon platform={platform.id} className="h-5 w-5" />{platform.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function GlobalEditor() {
  const editor = useCmsEditor("global");
  if (!editor.ready) return <LoadingEditor />;
  const { content, setContent } = editor;

  function moveHour(index: number, direction: -1 | 1) {
    setContent((prev) => {
      const hours = [...prev.hours];
      const target = index + direction;
      [hours[index], hours[target]] = [hours[target], hours[index]];
      return { ...prev, hours };
    });
  }

  function moveSocial(index: number, direction: -1 | 1) {
    setContent((prev) => {
      const socials = [...prev.socials];
      const target = index + direction;
      [socials[index], socials[target]] = [socials[target], socials[index]];
      return { ...prev, socials };
    });
  }

  return (
    <EditorShell
      eyebrow="Site-wide content"
      title="Global / Footer / Contact"
      description="These details are shared anywhere the address, hours, ordering link, map, or social accounts appear."
      dirty={editor.dirty}
      saving={editor.saving}
      savedAt={editor.savedAt}
      error={editor.error}
      onSave={() => void editor.save()}
      onDiscard={editor.discard}
    >
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <section className="rounded-lg border-2 border-sand bg-cream p-6 shadow-sm">
          <SectionTitle title="Business details" body="Used on the Contact page, footer, and location sections." />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField labelText="Business name" value={content.businessName} onChange={(businessName) => setContent((prev) => ({ ...prev, businessName }))} />
            <TextField labelText="Tagline" value={content.tagline} onChange={(tagline) => setContent((prev) => ({ ...prev, tagline }))} />
            <div className="sm:col-span-2"><TextField labelText="Street address" value={content.address} onChange={(address) => setContent((prev) => ({ ...prev, address }))} /></div>
            <TextField labelText="Neighborhood" value={content.neighborhood} onChange={(neighborhood) => setContent((prev) => ({ ...prev, neighborhood }))} />
            <TextField labelText="Phone" type="tel" value={content.phone} onChange={(phone) => setContent((prev) => ({ ...prev, phone }))} />
            <div className="sm:col-span-2"><TextField labelText="Contact email" type="email" value={content.email} onChange={(email) => setContent((prev) => ({ ...prev, email }))} /></div>
          </div>
        </section>

        <section className="rounded-lg border-2 border-sand bg-cream p-6 shadow-sm">
          <SectionTitle title="Footer" body="Short brand copy shown beside the footer logo." />
          <TextArea labelText="Footer description" rows={4} value={content.footerBlurb} onChange={(footerBlurb) => setContent((prev) => ({ ...prev, footerBlurb }))} />
        </section>

        <section className="rounded-lg border-2 border-sand bg-cream p-6 shadow-sm xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SectionTitle title="Opening hours" body="Add as many day groups as needed and arrange them in display order." />
            <button type="button" onClick={() => setContent((prev) => ({ ...prev, hours: [...prev.hours, { day: "", time: "" }] }))} className="rounded-full bg-espresso px-5 py-2 text-sm font-semibold text-cream hover:bg-maroon">+ Add hours</button>
          </div>
          <div className="space-y-3">
            {content.hours.map((hour, index) => (
              <div key={index} className="grid items-end gap-3 rounded-lg border border-sand bg-white/60 p-4 sm:grid-cols-[1fr_1fr_auto_auto]">
                <TextField labelText="Day or range" value={hour.day} placeholder="Mon – Fri" onChange={(day) => setContent((prev) => ({ ...prev, hours: prev.hours.map((item, itemIndex) => itemIndex === index ? { ...item, day } : item) }))} />
                <TextField labelText="Hours" value={hour.time} placeholder="7:00 AM – 6:00 PM" onChange={(time) => setContent((prev) => ({ ...prev, hours: prev.hours.map((item, itemIndex) => itemIndex === index ? { ...item, time } : item) }))} />
                <MoveButtons index={index} length={content.hours.length} onMove={(direction) => moveHour(index, direction)} />
                <button type="button" aria-label="Remove hours" title="Remove" onClick={() => setContent((prev) => ({ ...prev, hours: prev.hours.filter((_, itemIndex) => itemIndex !== index) }))} className="grid h-8 w-8 place-items-center rounded-full text-lg text-brick hover:bg-brick/10">×</button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border-2 border-sand bg-cream p-6 shadow-sm xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SectionTitle title="Social accounts" body="Choose a network to apply its official logo, then add the public label and profile link." />
            <button type="button" onClick={() => setContent((prev) => ({ ...prev, socials: [...prev.socials, { platform: "instagram", label: "", url: "" }] }))} className="rounded-full bg-espresso px-5 py-2 text-sm font-semibold text-cream hover:bg-maroon">+ Add account</button>
          </div>
          <div className="space-y-3">
            {content.socials.map((social, index) => (
              <div key={index} className="grid items-end gap-3 rounded-lg border border-sand bg-white/60 p-4 md:grid-cols-[180px_1fr_1.4fr_auto_auto]">
                <PlatformPicker value={social.platform} onChange={(platform) => setContent((prev) => ({ ...prev, socials: prev.socials.map((item, itemIndex) => itemIndex === index ? { ...item, platform } : item) }))} />
                <TextField labelText="Display label" value={social.label} placeholder="@preamp" onChange={(label) => setContent((prev) => ({ ...prev, socials: prev.socials.map((item, itemIndex) => itemIndex === index ? { ...item, label } : item) }))} />
                <TextField labelText="Profile link" value={social.url} placeholder="https://..." onChange={(url) => setContent((prev) => ({ ...prev, socials: prev.socials.map((item, itemIndex) => itemIndex === index ? { ...item, url } : item) }))} />
                <MoveButtons index={index} length={content.socials.length} onMove={(direction) => moveSocial(index, direction)} />
                <button type="button" aria-label="Remove account" title="Remove" onClick={() => setContent((prev) => ({ ...prev, socials: prev.socials.filter((_, itemIndex) => itemIndex !== index) }))} className="grid h-8 w-8 place-items-center rounded-full text-lg text-brick hover:bg-brick/10">×</button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border-2 border-sand bg-cream p-6 shadow-sm xl:col-span-2">
          <SectionTitle title="Ordering and maps" body="Shared destinations used by buttons and the embedded map throughout the site." />
          <div className="grid gap-4 xl:grid-cols-2">
            <TextField labelText="Online ordering link" value={content.orderUrl} onChange={(orderUrl) => setContent((prev) => ({ ...prev, orderUrl }))} />
            <TextField labelText="Directions link" value={content.mapsLink} onChange={(mapsLink) => setContent((prev) => ({ ...prev, mapsLink }))} />
            <div className="xl:col-span-2"><TextField labelText="Google Maps embed link" value={content.mapsEmbed} onChange={(mapsEmbed) => setContent((prev) => ({ ...prev, mapsEmbed }))} /></div>
          </div>
        </section>
      </div>
    </EditorShell>
  );
}
