import {
  Apple,
  Bike,
  BriefcaseBusiness,
  Building2,
  CircleOff,
  Coffee,
  Flame,
  Leaf,
  Milk,
  MilkOff,
  Moon,
  NutOff,
  PackageOpen,
  Salad,
  Sprout,
  Store,
  Tag,
  Truck,
  WheatOff,
  type LucideIcon,
} from "lucide-react"

const ICONS: Record<string, LucideIcon> = {
  apple: Apple,
  bike: Bike,
  "briefcase-business": BriefcaseBusiness,
  "building-2": Building2,
  "circle-off": CircleOff,
  coffee: Coffee,
  flame: Flame,
  leaf: Leaf,
  milk: Milk,
  "milk-off": MilkOff,
  moon: Moon,
  "nut-off": NutOff,
  "package-open": PackageOpen,
  salad: Salad,
  sprout: Sprout,
  store: Store,
  tag: Tag,
  truck: Truck,
  "wheat-off": WheatOff,
}

export type IconOption = { value: string; label: string }

export const COLD_BREW_ICON_OPTIONS: IconOption[] = [
  { value: "building-2", label: "Office" },
  { value: "bike", label: "Bike" },
  { value: "package-open", label: "Package" },
  { value: "truck", label: "Delivery" },
  { value: "milk", label: "Bottle" },
  { value: "store", label: "Retail" },
  { value: "briefcase-business", label: "Catering" },
  { value: "coffee", label: "Coffee" },
]

export const DIETARY_ICON_OPTIONS: IconOption[] = [
  { value: "sprout", label: "Sprout" },
  { value: "leaf", label: "Leaf" },
  { value: "salad", label: "Salad" },
  { value: "wheat-off", label: "No gluten" },
  { value: "milk-off", label: "No dairy" },
  { value: "nut-off", label: "No nuts" },
  { value: "moon", label: "Decaf" },
  { value: "coffee", label: "Caffeine" },
  { value: "flame", label: "Spicy" },
  { value: "apple", label: "Produce" },
  { value: "circle-off", label: "Free from" },
  { value: "tag", label: "General" },
]

const BUILTIN_DIETARY_ICONS: Record<string, string> = {
  vegan: "sprout",
  vegetarian: "leaf",
  "gluten-free": "wheat-off",
  "dairy-free": "milk-off",
  "nut-free": "nut-off",
  decaf: "moon",
  "contains-caffeine": "coffee",
  spicy: "flame",
}

export function dietaryIconName(key: string, storedIcon: string) {
  return BUILTIN_DIETARY_ICONS[key] ?? (ICONS[storedIcon] ? storedIcon : "tag")
}

export function ContentIcon({
  name,
  className,
  strokeWidth = 2,
}: {
  name: string
  className?: string
  strokeWidth?: number
}) {
  const Icon = ICONS[name] ?? Tag
  return <Icon aria-hidden className={className} strokeWidth={strokeWidth} />
}
