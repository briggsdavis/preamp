import { ChevronLeft, ChevronRight, Image as ImageIcon, Link2, Plus, Trash2 } from "lucide-react"
import { motion } from "motion/react"
import {
  EditableImage,
  EditableLink,
  EditableText,
  useInlineEditor,
} from "@/components/cms/inline-editing"
import { SquiggleLine } from "@/components/site/squiggle-line"
import { imageUrl, useHomeContent, type CmsRestaurant } from "@/lib/site-content"

const HUES = [
  "var(--color-gold)",
  "var(--color-amber)",
  "var(--color-orange)",
  "var(--color-terracotta)",
  "var(--color-brick)",
  "var(--color-maroon)",
]

function initials(name: string) {
  return name
    .replace(/[^a-zA-Z ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

function RestaurantArtwork({ restaurant, index }: { restaurant: CmsRestaurant; index: number }) {
  const src = imageUrl(restaurant.image)
  return (
    <EditableImage
      path={`restaurantGroup.restaurants.${index}.image`}
      value={restaurant.image}
      ratio="1:1"
      className="absolute inset-0 h-full w-full"
    >
      {src ? (
        <img
          src={src}
          alt={restaurant.image.alt || restaurant.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div
          className="grid h-full w-full place-items-center"
          style={{
            background: `radial-gradient(circle at 30% 25%, ${HUES[index % HUES.length]} 0%, var(--color-espresso) 95%)`,
          }}
        >
          <ImageIcon className="h-8 w-8 text-cream/75" />
        </div>
      )}
    </EditableImage>
  )
}

function EditorControls({
  restaurant,
  index,
  total,
  onMove,
  onRemove,
}: {
  restaurant: CmsRestaurant
  index: number
  total: number
  onMove: (index: number, direction: -1 | 1) => void
  onRemove: (index: number) => void
}) {
  return (
    <div className="absolute inset-x-2 top-2 z-50 flex items-center justify-between gap-1 opacity-0 transition-none group-focus-within:opacity-100 group-hover:opacity-100">
      <EditableLink
        path={`restaurantGroup.restaurants.${index}`}
        value={{ label: restaurant.name, href: restaurant.href }}
        labelKey="name"
        labelTitle="Restaurant name"
      >
        <button
          type="button"
          title="Edit restaurant name and link"
          aria-label="Edit restaurant name and link"
          className="grid h-8 w-8 place-items-center rounded-md bg-cream text-espresso shadow-md"
        >
          <Link2 className="h-4 w-4" />
        </button>
      </EditableLink>
      <div className="flex gap-1">
        <button
          type="button"
          title="Move left"
          aria-label="Move restaurant left"
          disabled={index === 0}
          onClick={() => onMove(index, -1)}
          className="grid h-8 w-8 place-items-center rounded-md bg-cream text-espresso shadow-md disabled:opacity-35"
          data-cms-control
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Move right"
          aria-label="Move restaurant right"
          disabled={index === total - 1}
          onClick={() => onMove(index, 1)}
          className="grid h-8 w-8 place-items-center rounded-md bg-cream text-espresso shadow-md disabled:opacity-35"
          data-cms-control
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Remove restaurant"
          aria-label="Remove restaurant"
          onClick={() => onRemove(index)}
          className="grid h-8 w-8 place-items-center rounded-md bg-brick text-cream shadow-md"
          data-cms-control
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function RestaurantTile({
  restaurant,
  index,
  total,
  onMove,
  onRemove,
}: {
  restaurant: CmsRestaurant
  index: number
  total: number
  onMove: (index: number, direction: -1 | 1) => void
  onRemove: (index: number) => void
}) {
  const editor = useInlineEditor()

  const inner = (
    <div className="relative aspect-square overflow-hidden rounded-xl border border-espresso/10 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-maroon/20">
      {editor ? (
        <RestaurantArtwork restaurant={restaurant} index={index} />
      ) : imageUrl(restaurant.image) ? (
        <img
          src={imageUrl(restaurant.image)}
          alt={restaurant.image.alt || restaurant.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div
          className="grid h-full w-full place-items-center"
          style={{
            background: `radial-gradient(circle at 30% 25%, ${HUES[index % HUES.length]} 0%, var(--color-espresso) 95%)`,
          }}
        >
          <span className="font-display text-2xl text-cream/90 md:text-3xl">
            {initials(restaurant.name)}
          </span>
        </div>
      )}

      {editor && (
        <EditorControls
          restaurant={restaurant}
          index={index}
          total={total}
          onMove={onMove}
          onRemove={onRemove}
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 bg-gradient-to-t from-espresso/85 to-transparent p-2 pt-6">
        <p className="pointer-events-auto truncate text-center text-[11px] font-semibold tracking-wide text-cream/95">
          {editor ? (
            <EditableText
              path={`restaurantGroup.restaurants.${index}.name`}
              value={restaurant.name}
            />
          ) : (
            restaurant.name
          )}
        </p>
      </div>
    </div>
  )

  if (editor) return <div className="group">{inner}</div>

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -18% 0px" }}
      transition={{ duration: 0.75, delay: (index % 7) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      {restaurant.href ? (
        <a href={restaurant.href} target="_blank" rel="noreferrer" className="block">
          {inner}
        </a>
      ) : (
        inner
      )}
    </motion.div>
  )
}

export function RestaurantGroup() {
  const content = useHomeContent().restaurantGroup
  const editor = useInlineEditor()
  const title = content.title.replace(/\brestaurant group\b/g, "Restaurant Group")

  function replaceRestaurants(restaurants: CmsRestaurant[]) {
    editor?.replaceValue("restaurantGroup.restaurants", restaurants)
  }

  function moveRestaurant(index: number, direction: -1 | 1) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= content.restaurants.length) return
    const restaurants = [...content.restaurants]
    ;[restaurants[index], restaurants[nextIndex]] = [restaurants[nextIndex], restaurants[index]]
    replaceRestaurants(restaurants)
  }

  function removeRestaurant(index: number) {
    replaceRestaurants(content.restaurants.filter((_, itemIndex) => itemIndex !== index))
  }

  function addRestaurant() {
    replaceRestaurants([
      ...content.restaurants,
      {
        name: "",
        image: { alt: "" },
        href: "",
      },
    ])
  }

  return (
    <section className="relative overflow-hidden bg-cream-deep py-20">
      <SquiggleLine />

      <div className="relative mx-auto max-w-7xl px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -18% 0px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <p className="font-groovy text-sm tracking-[0.35em] text-terracotta uppercase">
            <EditableText path="restaurantGroup.kicker" value={content.kicker} />
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl font-groovy text-3xl leading-tight text-espresso md:text-4xl">
            <EditableText path="restaurantGroup.title" value={title} />
          </h2>
        </motion.div>

        <div className="mt-12 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 md:gap-4 lg:grid-cols-7">
          {content.restaurants.map((restaurant, index) => (
            <RestaurantTile
              key={index}
              restaurant={restaurant}
              index={index}
              total={content.restaurants.length}
              onMove={moveRestaurant}
              onRemove={removeRestaurant}
            />
          ))}
        </div>

        {editor && (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              title="Add restaurant"
              aria-label="Add restaurant"
              onClick={addRestaurant}
              className="grid h-11 w-11 place-items-center rounded-full border-2 border-espresso bg-cream text-espresso shadow-sm hover:bg-gold"
              data-cms-control
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -18% 0px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 text-center"
        >
          <EditableLink path="restaurantGroup.button" value={content.button}>
            <a
              href={content.button.href}
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-full bg-terracotta px-7 py-3 font-semibold text-cream shadow-lg shadow-maroon/20 transition-all hover:-translate-y-1 hover:bg-brick"
            >
              {content.button.label}
            </a>
          </EditableLink>
        </motion.div>
      </div>
    </section>
  )
}
