import { useState } from "react";

import {
  EditorShell,
  ImageField,
  LinkFields,
  LoadingEditor,
  SectionTabs,
  SectionWorkspace,
  TextArea,
  TextField,
  useCmsEditor,
} from "@/admin/CmsEditorKit";
import { imageUrl, type CmsImage } from "@/lib/siteContent";

function PreviewButton({ children, secondary }: { children: string; secondary?: boolean }) {
  return (
    <span
      className={`inline-block rounded-full px-5 py-2.5 text-sm font-semibold ${
        secondary
          ? "border-2 border-cream/70 text-cream"
          : "bg-gold text-espresso"
      }`}
    >
      {children || "Button"}
    </span>
  );
}

function SplitParagraphs({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  return (
    <div className="space-y-4">
      {value.map((paragraph, index) => (
        <TextArea
          key={index}
          labelText={`Paragraph ${index + 1}`}
          value={paragraph}
          rows={5}
          onChange={(next) => {
            const paragraphs = [...value];
            paragraphs[index] = next;
            onChange(paragraphs);
          }}
        />
      ))}
    </div>
  );
}

const homeTabs = [
  { id: "hero", label: "Hero" },
  { id: "welcome", label: "Welcome" },
  { id: "featured", label: "Best Sellers" },
  { id: "room", label: "The Room" },
  { id: "community", label: "Quiz & Reviews" },
  { id: "visit", label: "Visit & Family" },
];

export function HomeEditor() {
  const editor = useCmsEditor("home");
  const [section, setSection] = useState("hero");
  if (!editor.ready) return <LoadingEditor />;
  const { content, setContent } = editor;

  return (
    <EditorShell
      eyebrow="Page editor"
      title="Home"
      description="Edit the words, links, and photography around the menu, reviews, and other live content already managed elsewhere."
      dirty={editor.dirty}
      saving={editor.saving}
      savedAt={editor.savedAt}
      error={editor.error}
      onSave={() => void editor.save()}
      onDiscard={editor.discard}
    >
      <SectionTabs items={homeTabs} active={section} onChange={setSection} />

      {section === "hero" && (
        <SectionWorkspace
          preview={
            <div className="relative grid min-h-[500px] place-items-center overflow-hidden px-8 py-20 text-center">
              <img src={imageUrl(content.hero.background)} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-br from-espresso/80 via-maroon/55 to-espresso/85" />
              <div className="relative max-w-xl">
                <img src={imageUrl(content.hero.logo)} alt={content.hero.logo.alt} className="mx-auto w-full max-w-md" />
                <p className="mt-5 font-groovy text-lg uppercase tracking-[0.18em] text-cream/90">{content.hero.tagline}</p>
                <div className="mt-7 flex justify-center gap-3">
                  <span className="inline-block rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-cream">{content.hero.orderButton.label}</span>
                </div>
              </div>
            </div>
          }
        >
          <ImageField labelText="Background image" value={content.hero.background} ratio="16:9" dimensions="1920 × 1080 px" onChange={(background) => setContent((prev) => ({ ...prev, hero: { ...prev.hero, background } }))} />
          <ImageField labelText="Hero logo artwork" value={content.hero.logo} ratio="16:10" dimensions="1400 × 875 px" onChange={(logo) => setContent((prev) => ({ ...prev, hero: { ...prev.hero, logo } }))} />
          <TextArea labelText="Tagline" rows={2} value={content.hero.tagline} onChange={(tagline) => setContent((prev) => ({ ...prev, hero: { ...prev.hero, tagline } }))} />
          <LinkFields title="Order button" value={content.hero.orderButton} onChange={(orderButton) => setContent((prev) => ({ ...prev, hero: { ...prev.hero, orderButton } }))} />
        </SectionWorkspace>
      )}

      {section === "welcome" && (
        <SectionWorkspace
          preview={
            <div className="bg-cream px-8 py-16 text-center">
              <p className="font-groovy text-sm uppercase tracking-[0.35em] text-terracotta">{content.intro.kicker}</p>
              <h2 className="mx-auto mt-4 max-w-2xl font-groovy text-4xl leading-tight text-espresso">{content.intro.title}</h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-espresso/75">{content.intro.body}</p>
              <div className="mx-auto mt-9 grid max-w-2xl grid-cols-2 gap-4">
                {content.intro.images.map((item, index) => <img key={index} src={imageUrl(item)} alt={item.alt} className="aspect-[4/3] w-full rounded-2xl object-cover" />)}
              </div>
              <div className="mx-auto mt-8 flex max-w-3xl gap-5 overflow-hidden border-y-2 border-gold bg-terracotta px-5 py-3 text-left">
                {content.marquee.items.slice(0, 3).map((item) => <span key={item} className="shrink-0 font-groovy text-sm uppercase text-cream">{item} ★</span>)}
              </div>
            </div>
          }
        >
          <TextField labelText="Kicker" value={content.intro.kicker} onChange={(kicker) => setContent((prev) => ({ ...prev, intro: { ...prev.intro, kicker } }))} />
          <TextArea labelText="Heading" rows={3} value={content.intro.title} onChange={(title) => setContent((prev) => ({ ...prev, intro: { ...prev.intro, title } }))} />
          <TextArea labelText="Body" rows={6} value={content.intro.body} onChange={(body) => setContent((prev) => ({ ...prev, intro: { ...prev.intro, body } }))} />
          {content.intro.images.map((item, index) => <ImageField key={index} labelText={`Gallery image ${index + 1}`} value={item} ratio="4:3" dimensions="1200 × 900 px" onChange={(next) => setContent((prev) => { const images = [...prev.intro.images] as typeof prev.intro.images; images[index] = next; return { ...prev, intro: { ...prev.intro, images } }; })} />)}
          <TextArea labelText="Marquee items" hint="One phrase per line. Stars are added automatically." rows={6} value={content.marquee.items.join("\n")} onChange={(value) => setContent((prev) => ({ ...prev, marquee: { items: value.split("\n").filter(Boolean) } }))} />
        </SectionWorkspace>
      )}

      {section === "featured" && (
        <SectionWorkspace
          preview={<HeadingPreview kicker={content.featured.kicker} title={content.featured.title} body={content.featured.body} button={content.featured.button.label} />}
        >
          <TextField labelText="Kicker" value={content.featured.kicker} onChange={(kicker) => setContent((prev) => ({ ...prev, featured: { ...prev.featured, kicker } }))} />
          <TextField labelText="Heading" value={content.featured.title} onChange={(title) => setContent((prev) => ({ ...prev, featured: { ...prev.featured, title } }))} />
          <TextArea labelText="Supporting text" value={content.featured.body} onChange={(body) => setContent((prev) => ({ ...prev, featured: { ...prev.featured, body } }))} />
          <LinkFields title="Section button" value={content.featured.button} onChange={(button) => setContent((prev) => ({ ...prev, featured: { ...prev.featured, button } }))} />
          <p className="rounded-lg bg-gold/15 p-4 text-sm leading-relaxed text-espresso/70">Featured drinks continue to come from Menu → Coffee. This editor only controls the presentation around them.</p>
        </SectionWorkspace>
      )}

      {section === "room" && (
        <BannerWorkspace value={content.roomBanner} onChange={(roomBanner) => setContent((prev) => ({ ...prev, roomBanner }))} />
      )}

      {section === "community" && (
        <SectionWorkspace
          preview={
            <div>
              <div className="bg-espresso px-8 py-16 text-cream"><p className="font-groovy text-sm uppercase tracking-[0.3em] text-amber">{content.quiz.kicker}</p><h2 className="mt-3 font-groovy text-4xl">{content.quiz.title}</h2><p className="mt-4 max-w-lg text-cream/70">{content.quiz.body}</p><div className="mt-8 h-28 rounded-2xl border border-cream/15 bg-cream/5" /></div>
              <div className="bg-cream px-8 py-14 text-center"><p className="font-groovy text-sm uppercase tracking-[0.3em] text-terracotta">{content.reviews.kicker}</p><h2 className="mt-3 font-groovy text-4xl text-espresso">{content.reviews.title}</h2><p className="mt-7 font-groovy text-2xl text-espresso/70">“Featured customer reviews appear here.”</p></div>
            </div>
          }
        >
          <p className="font-display text-xl text-espresso">Coffee quiz</p>
          <TextField labelText="Kicker" value={content.quiz.kicker} onChange={(kicker) => setContent((prev) => ({ ...prev, quiz: { ...prev.quiz, kicker } }))} />
          <TextField labelText="Heading" value={content.quiz.title} onChange={(title) => setContent((prev) => ({ ...prev, quiz: { ...prev.quiz, title } }))} />
          <TextArea labelText="Supporting text" value={content.quiz.body} onChange={(body) => setContent((prev) => ({ ...prev, quiz: { ...prev.quiz, body } }))} />
          <hr className="border-sand" />
          <p className="font-display text-xl text-espresso">Reviews</p>
          <TextField labelText="Kicker" value={content.reviews.kicker} onChange={(kicker) => setContent((prev) => ({ ...prev, reviews: { ...prev.reviews, kicker } }))} />
          <TextField labelText="Heading" value={content.reviews.title} onChange={(title) => setContent((prev) => ({ ...prev, reviews: { ...prev.reviews, title } }))} />
        </SectionWorkspace>
      )}

      {section === "visit" && (
        <SectionWorkspace
          preview={<div><div className="bg-terracotta px-8 py-14 text-cream"><p className="font-groovy text-sm uppercase tracking-[0.3em] text-cream/80">{content.location.kicker}</p><h2 className="mt-3 font-display text-5xl">{content.location.title}</h2><p className="mt-4 max-w-lg text-cream/90">{content.location.body}</p></div><div className="bg-cream-deep px-8 py-14 text-center"><p className="font-groovy text-sm uppercase tracking-[0.3em] text-terracotta">{content.restaurantGroup.kicker}</p><h2 className="mx-auto mt-3 max-w-xl font-groovy text-3xl text-espresso">{content.restaurantGroup.title}</h2><div className="mx-auto mt-8 grid max-w-lg grid-cols-5 gap-2">{Array.from({ length: 10 }).map((_, index) => <div key={index} className="aspect-square rounded-lg bg-terracotta/25" />)}</div></div></div>}
        >
          <p className="font-display text-xl text-espresso">Location</p>
          <TextField labelText="Kicker" value={content.location.kicker} onChange={(kicker) => setContent((prev) => ({ ...prev, location: { ...prev.location, kicker } }))} />
          <TextField labelText="Heading" value={content.location.title} onChange={(title) => setContent((prev) => ({ ...prev, location: { ...prev.location, title } }))} />
          <TextArea labelText="Supporting text" hint="Use {neighborhood} to insert the globally managed neighborhood." value={content.location.body} onChange={(body) => setContent((prev) => ({ ...prev, location: { ...prev.location, body } }))} />
          <hr className="border-sand" />
          <p className="font-display text-xl text-espresso">Restaurant group</p>
          <TextField labelText="Kicker" value={content.restaurantGroup.kicker} onChange={(kicker) => setContent((prev) => ({ ...prev, restaurantGroup: { ...prev.restaurantGroup, kicker } }))} />
          <TextArea labelText="Heading" value={content.restaurantGroup.title} onChange={(title) => setContent((prev) => ({ ...prev, restaurantGroup: { ...prev.restaurantGroup, title } }))} />
          <LinkFields title="Group button" value={content.restaurantGroup.button} onChange={(button) => setContent((prev) => ({ ...prev, restaurantGroup: { ...prev.restaurantGroup, button } }))} />
        </SectionWorkspace>
      )}
    </EditorShell>
  );
}

type BannerContent = { image: CmsImage; kicker: string; title: string; body: string };

function BannerWorkspace({ value, onChange }: { value: BannerContent; onChange: (value: BannerContent) => void }) {
  return (
    <SectionWorkspace
      preview={<div className="relative grid min-h-[470px] place-items-center overflow-hidden px-8 text-center"><img src={imageUrl(value.image)} alt={value.image.alt} className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-espresso/55" /><div className="relative max-w-xl"><p className="font-groovy text-sm uppercase tracking-[0.35em] text-amber">{value.kicker}</p><h2 className="mt-4 font-display text-6xl text-cream">{value.title}</h2><p className="mt-4 text-lg text-cream/85">{value.body}</p></div></div>}
    >
      <ImageField labelText="Banner image" value={value.image} ratio="16:9" dimensions="1920 × 1080 px" onChange={(image) => onChange({ ...value, image })} />
      <TextField labelText="Kicker" value={value.kicker} onChange={(kicker) => onChange({ ...value, kicker })} />
      <TextField labelText="Heading" value={value.title} onChange={(title) => onChange({ ...value, title })} />
      <TextArea labelText="Supporting text" value={value.body} onChange={(body) => onChange({ ...value, body })} />
    </SectionWorkspace>
  );
}

function HeadingPreview({ kicker, title, body, button }: { kicker: string; title: string; body: string; button: string }) {
  return <div className="bg-cream-deep px-8 py-20 text-center"><p className="font-groovy text-sm uppercase tracking-[0.35em] text-terracotta">{kicker}</p><h2 className="mt-3 font-groovy text-5xl text-espresso">{title}</h2><p className="mx-auto mt-4 max-w-xl text-espresso/70">{body}</p><div className="mx-auto mt-10 flex max-w-2xl gap-4 overflow-hidden">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-44 w-48 shrink-0 rounded-2xl bg-gold/20" />)}</div><span className="mt-9 inline-block rounded-full bg-terracotta px-6 py-3 font-semibold text-cream">{button}</span></div>;
}

const aboutTabs = [
  { id: "hero", label: "Hero" },
  { id: "feature", label: "Feature Image" },
  { id: "owner", label: "Owner Story" },
  { id: "closing", label: "Closing" },
];

export function AboutEditor() {
  const editor = useCmsEditor("about");
  const [section, setSection] = useState("hero");
  if (!editor.ready) return <LoadingEditor />;
  const { content, setContent } = editor;

  return (
    <EditorShell eyebrow="Page editor" title="About" description="The preview follows the live About page section by section, including its fixed photo shapes." dirty={editor.dirty} saving={editor.saving} savedAt={editor.savedAt} error={editor.error} onSave={() => void editor.save()} onDiscard={editor.discard}>
      <SectionTabs items={aboutTabs} active={section} onChange={setSection} />
      {section === "hero" && <SectionWorkspace preview={<HeroPreview image={content.hero.image} kicker={content.hero.kicker} title={content.hero.title} body={content.hero.body} />}><ImageField labelText="Hero image" value={content.hero.image} ratio="16:9" dimensions="1920 × 1080 px" onChange={(image) => setContent((prev) => ({ ...prev, hero: { ...prev.hero, image } }))} /><TextField labelText="Kicker" value={content.hero.kicker} onChange={(kicker) => setContent((prev) => ({ ...prev, hero: { ...prev.hero, kicker } }))} /><TextField labelText="Heading" value={content.hero.title} onChange={(title) => setContent((prev) => ({ ...prev, hero: { ...prev.hero, title } }))} /><TextArea labelText="Supporting text" value={content.hero.body} onChange={(body) => setContent((prev) => ({ ...prev, hero: { ...prev.hero, body } }))} /></SectionWorkspace>}
      {section === "feature" && (
        <SectionWorkspace preview={<div className="bg-cream-deep px-8 py-14 text-center"><p className="font-groovy text-sm uppercase tracking-[0.3em] text-terracotta">{content.feature.kicker}</p><h2 className="mt-3 font-display text-5xl text-espresso">{content.feature.title}</h2><img src={imageUrl(content.feature.image)} alt={content.feature.image.alt} className="mx-auto mt-10 aspect-video w-full max-w-3xl rounded-3xl object-cover shadow-2xl" /></div>}>
          <TextField labelText="Kicker" value={content.feature.kicker} onChange={(kicker) => setContent((prev) => ({ ...prev, feature: { ...prev.feature, kicker } }))} />
          <TextField labelText="Heading" value={content.feature.title} onChange={(title) => setContent((prev) => ({ ...prev, feature: { ...prev.feature, title } }))} />
          <ImageField labelText="Feature image" value={content.feature.image} ratio="16:9" dimensions="1920 × 1080 px" onChange={(image) => setContent((prev) => ({ ...prev, feature: { ...prev.feature, image } }))} />
        </SectionWorkspace>
      )}
      {section === "owner" && (
        <SectionWorkspace preview={<div className="bg-cream px-8 py-16"><div className="grid items-center gap-10 md:grid-cols-2"><div className="text-center"><img src={imageUrl(content.owner.image)} alt={content.owner.image.alt} className="mx-auto aspect-square w-72 rounded-full border-4 border-gold/60 object-cover" /><h3 className="mt-5 font-display text-3xl text-espresso">{content.owner.name}</h3><p className="mt-1 font-groovy text-xs uppercase text-terracotta">{content.owner.role}</p></div><div><p className="font-groovy text-sm uppercase text-terracotta">{content.owner.kicker}</p><h2 className="mt-3 font-display text-4xl text-espresso">{content.owner.title}</h2>{content.owner.paragraphs.map((paragraph, index) => <p key={index} className="mt-4 text-sm leading-relaxed text-espresso/75">{paragraph}</p>)}</div></div><div className="mt-10 grid grid-cols-4 gap-3">{content.owner.decorImages.map((item, index) => <img key={index} src={imageUrl(item)} alt={item.alt} className="aspect-square w-full rounded-2xl object-cover" />)}</div></div>}>
          <ImageField labelText="Owner portrait" value={content.owner.image} ratio="1:1" dimensions="1200 × 1200 px" onChange={(image) => setContent((prev) => ({ ...prev, owner: { ...prev.owner, image } }))} />
          <TextField labelText="Name" value={content.owner.name} onChange={(name) => setContent((prev) => ({ ...prev, owner: { ...prev.owner, name } }))} />
          <TextField labelText="Role" value={content.owner.role} onChange={(role) => setContent((prev) => ({ ...prev, owner: { ...prev.owner, role } }))} />
          <TextField labelText="Kicker" value={content.owner.kicker} onChange={(kicker) => setContent((prev) => ({ ...prev, owner: { ...prev.owner, kicker } }))} />
          <TextField labelText="Heading" value={content.owner.title} onChange={(title) => setContent((prev) => ({ ...prev, owner: { ...prev.owner, title } }))} />
          <SplitParagraphs value={content.owner.paragraphs} onChange={(paragraphs) => setContent((prev) => ({ ...prev, owner: { ...prev.owner, paragraphs } }))} />
          {content.owner.decorImages.map((item, index) => <ImageField key={index} labelText={`Decor image ${index + 1}`} value={item} ratio="1:1" dimensions="1200 × 1200 px" onChange={(image) => setContent((prev) => ({ ...prev, owner: { ...prev.owner, decorImages: prev.owner.decorImages.map((existing, itemIndex) => itemIndex === index ? image : existing) } }))} />)}
        </SectionWorkspace>
      )}
      {section === "closing" && (
        <SectionWorkspace preview={<div className="bg-terracotta px-8 py-20 text-center text-cream"><h2 className="font-display text-6xl">{content.closing.title}</h2><p className="mx-auto mt-4 max-w-xl text-lg text-cream/90">{content.closing.body}</p><div className="mt-7 flex flex-wrap justify-center gap-3"><span className="rounded-full bg-cream px-5 py-2.5 font-semibold text-terracotta">{content.closing.primary.label}</span><span className="rounded-full bg-gold px-5 py-2.5 font-semibold text-espresso">{content.closing.vinyl.label}</span><PreviewButton secondary>{content.closing.secondary.label}</PreviewButton></div></div>}>
          <TextField labelText="Heading" value={content.closing.title} onChange={(title) => setContent((prev) => ({ ...prev, closing: { ...prev.closing, title } }))} />
          <TextArea labelText="Body" value={content.closing.body} onChange={(body) => setContent((prev) => ({ ...prev, closing: { ...prev.closing, body } }))} />
          <LinkFields title="Primary button" value={content.closing.primary} onChange={(primary) => setContent((prev) => ({ ...prev, closing: { ...prev.closing, primary } }))} />
          <LinkFields title="Vinyl request button" value={content.closing.vinyl} onChange={(vinyl) => setContent((prev) => ({ ...prev, closing: { ...prev.closing, vinyl } }))} />
          <LinkFields title="Secondary button" value={content.closing.secondary} onChange={(secondary) => setContent((prev) => ({ ...prev, closing: { ...prev.closing, secondary } }))} />
        </SectionWorkspace>
      )}
    </EditorShell>
  );
}

function HeroPreview({ image, kicker, title, body }: { image: CmsImage; kicker: string; title: string; body: string }) {
  return <div className="relative grid min-h-[500px] place-items-center overflow-hidden px-8 text-center"><img src={imageUrl(image)} alt={image.alt} className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-b from-espresso/75 via-maroon/55 to-espresso/85" /><div className="relative max-w-xl text-cream"><p className="font-groovy text-sm uppercase tracking-[0.35em] text-cream/80">{kicker}</p><h2 className="mt-4 font-display text-7xl">{title}</h2><p className="mt-5 text-lg text-cream/90">{body}</p></div></div>;
}

const coldTabs = [
  { id: "hero", label: "Hero" },
  { id: "method", label: "The Method" },
  { id: "launch", label: "Launch Cards" },
  { id: "availability", label: "Availability" },
];

export function ColdBrewEditor() {
  const editor = useCmsEditor("cold-brew");
  const [section, setSection] = useState("hero");
  const [cardIndex, setCardIndex] = useState(0);
  if (!editor.ready) return <LoadingEditor />;
  const { content, setContent } = editor;
  const card = content.launch.cards[cardIndex] ?? content.launch.cards[0];
  return <EditorShell eyebrow="Page editor" title="Cold Brew" description="Manage the pre-launch story and calls-to-action while keeping the designed page structure intact." dirty={editor.dirty} saving={editor.saving} savedAt={editor.savedAt} error={editor.error} onSave={() => void editor.save()} onDiscard={editor.discard}>
    <SectionTabs items={coldTabs} active={section} onChange={setSection} />
    {section === "hero" && <SectionWorkspace preview={<div><HeroPreview image={content.hero.image} kicker={content.hero.kicker} title={content.hero.title} body={content.hero.body} /></div>}><ImageField labelText="Hero image" value={content.hero.image} ratio="16:9" dimensions="1920 × 1080 px" onChange={(image) => setContent((prev) => ({ ...prev, hero: { ...prev.hero, image } }))} /><TextField labelText="Kicker" value={content.hero.kicker} onChange={(kicker) => setContent((prev) => ({ ...prev, hero: { ...prev.hero, kicker } }))} /><TextField labelText="Heading" value={content.hero.title} onChange={(title) => setContent((prev) => ({ ...prev, hero: { ...prev.hero, title } }))} /><TextArea labelText="Supporting text" value={content.hero.body} onChange={(body) => setContent((prev) => ({ ...prev, hero: { ...prev.hero, body } }))} /><LinkFields title="Primary button" value={content.hero.primary} onChange={(primary) => setContent((prev) => ({ ...prev, hero: { ...prev.hero, primary } }))} /><LinkFields title="Secondary button" value={content.hero.secondary} onChange={(secondary) => setContent((prev) => ({ ...prev, hero: { ...prev.hero, secondary } }))} /></SectionWorkspace>}
    {section === "method" && <SectionWorkspace preview={<div className="grid items-center gap-8 bg-cream-deep px-8 py-16 md:grid-cols-2"><img src={imageUrl(content.method.image)} alt={content.method.image.alt} className="aspect-[4/5] w-full rounded-3xl object-cover" /><div><p className="font-groovy text-sm uppercase text-terracotta">{content.method.kicker}</p>{content.method.paragraphs.map((paragraph, index) => <p key={index} className="mt-4 text-espresso/75">{paragraph}</p>)}<span className="mt-6 inline-block rounded-full bg-terracotta px-5 py-2.5 font-semibold text-cream">{content.method.button.label}</span></div></div>}><ImageField labelText="Method image" value={content.method.image} ratio="4:5" dimensions="1200 × 1500 px" onChange={(image) => setContent((prev) => ({ ...prev, method: { ...prev.method, image } }))} /><TextField labelText="Kicker" value={content.method.kicker} onChange={(kicker) => setContent((prev) => ({ ...prev, method: { ...prev.method, kicker } }))} /><SplitParagraphs value={content.method.paragraphs} onChange={(paragraphs) => setContent((prev) => ({ ...prev, method: { ...prev.method, paragraphs } }))} /><LinkFields title="Order button" value={content.method.button} onChange={(button) => setContent((prev) => ({ ...prev, method: { ...prev.method, button } }))} /></SectionWorkspace>}
    {section === "launch" && card && <SectionWorkspace preview={<div className="bg-espresso px-8 py-16 text-center text-cream"><p className="font-groovy text-sm uppercase text-gold">{content.launch.kicker}</p><h2 className="mt-3 font-display text-5xl">{content.launch.title}</h2><p className="mx-auto mt-4 max-w-xl text-cream/75">{content.launch.body}</p><div className="mt-10 grid gap-4 md:grid-cols-3">{content.launch.cards.map((item) => <div key={item.title} className="relative rounded-3xl border border-cream/10 bg-cream/5 p-5"><span className="absolute right-3 top-3 text-[10px] uppercase text-gold">{item.badge}</span><span className="text-4xl">{item.icon}</span><h3 className="mt-4 font-display text-2xl">{item.title}</h3><p className="mt-3 text-sm text-cream/70">{item.body}</p></div>)}</div></div>}><TextField labelText="Kicker" value={content.launch.kicker} onChange={(kicker) => setContent((prev) => ({ ...prev, launch: { ...prev.launch, kicker } }))} /><TextField labelText="Heading" value={content.launch.title} onChange={(title) => setContent((prev) => ({ ...prev, launch: { ...prev.launch, title } }))} /><TextArea labelText="Supporting text" value={content.launch.body} onChange={(body) => setContent((prev) => ({ ...prev, launch: { ...prev.launch, body } }))} /><div className="flex gap-2">{content.launch.cards.map((_, index) => <button type="button" key={index} onClick={() => setCardIndex(index)} className={`h-9 flex-1 rounded-full text-sm font-bold ${cardIndex === index ? "bg-espresso text-cream" : "bg-espresso/10 text-espresso"}`}>Card {index + 1}</button>)}</div><TextField labelText="Icon" value={card.icon} onChange={(icon) => setContent((prev) => ({ ...prev, launch: { ...prev.launch, cards: prev.launch.cards.map((item, index) => index === cardIndex ? { ...item, icon } : item) } }))} /><TextField labelText="Badge" value={card.badge} onChange={(badge) => setContent((prev) => ({ ...prev, launch: { ...prev.launch, cards: prev.launch.cards.map((item, index) => index === cardIndex ? { ...item, badge } : item) } }))} /><TextField labelText="Heading" value={card.title} onChange={(title) => setContent((prev) => ({ ...prev, launch: { ...prev.launch, cards: prev.launch.cards.map((item, index) => index === cardIndex ? { ...item, title } : item) } }))} /><TextArea labelText="Body" value={card.body} onChange={(body) => setContent((prev) => ({ ...prev, launch: { ...prev.launch, cards: prev.launch.cards.map((item, index) => index === cardIndex ? { ...item, body } : item) } }))} /></SectionWorkspace>}
    {section === "availability" && <SectionWorkspace preview={<HeadingPreview kicker={content.availability.kicker} title={content.availability.title} body={content.availability.body} button={content.availability.orderButton.label} />}><TextField labelText="Kicker" value={content.availability.kicker} onChange={(kicker) => setContent((prev) => ({ ...prev, availability: { ...prev.availability, kicker } }))} /><TextField labelText="Heading" value={content.availability.title} onChange={(title) => setContent((prev) => ({ ...prev, availability: { ...prev.availability, title } }))} /><TextArea labelText="Body" hint="Use {address} to insert the globally managed address." rows={6} value={content.availability.body} onChange={(body) => setContent((prev) => ({ ...prev, availability: { ...prev.availability, body } }))} /><LinkFields title="Order button" value={content.availability.orderButton} onChange={(orderButton) => setContent((prev) => ({ ...prev, availability: { ...prev.availability, orderButton } }))} /><LinkFields title="Directions button" value={content.availability.directionsButton} onChange={(directionsButton) => setContent((prev) => ({ ...prev, availability: { ...prev.availability, directionsButton } }))} /></SectionWorkspace>}
  </EditorShell>;
}
