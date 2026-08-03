import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import { useQuery } from "convex/react"
import { createContext, useContext, type ReactNode } from "react"
import { RD_RESTAURANTS } from "@/data/site"

export type CmsKey = "home" | "about" | "cold-brew" | "global"

export type CmsImage = {
  storageId?: Id<"_storage">
  path?: string
  url?: string | null
  alt: string
}

export type CmsLink = { label: string; href: string }
export type CmsRestaurant = { name: string; image: CmsImage; href: string }

export type HomeContent = {
  hero: {
    background: CmsImage
    logo: CmsImage
    tagline: string
    orderButton: CmsLink
  }
  marquee: { items: string[] }
  intro: {
    kicker: string
    title: string
    body: string
    images: [CmsImage, CmsImage]
  }
  featured: { kicker: string; title: string; body: string; button: CmsLink }
  roomBanner: { image: CmsImage; kicker: string; title: string; body: string }
  quiz: { kicker: string; title: string; body: string }
  reviews: { kicker: string; title: string }
  location: { kicker: string; title: string; body: string }
  restaurantGroup: {
    kicker: string
    title: string
    button: CmsLink
    restaurants: CmsRestaurant[]
  }
}

export type AboutContent = {
  hero: { image: CmsImage; kicker: string; title: string; body: string }
  feature: {
    kicker: string
    title: string
    image: CmsImage
    images: CmsImage[]
    labels: string[]
  }
  owner: {
    image: CmsImage
    teamImage: CmsImage
    name: string
    role: string
    kicker: string
    title: string
    paragraphs: string[]
    decorImages: CmsImage[]
  }
  closing: {
    title: string
    body: string
    primary: CmsLink
    vinyl: CmsLink
    secondary: CmsLink
  }
}

export type ColdBrewContent = {
  hero: {
    image: CmsImage
    kicker: string
    title: string
    body: string
    primary: CmsLink
    secondary: CmsLink
  }
  method: {
    image: CmsImage
    kicker: string
    paragraphs: string[]
    button: CmsLink
  }
  launch: {
    kicker: string
    title: string
    body: string
    cards: Array<{ icon: string; badge: string; title: string; body: string }>
  }
  availability: {
    kicker: string
    title: string
    body: string
    orderButton: CmsLink
    directionsButton: CmsLink
  }
}

export type SocialPlatform = "instagram" | "facebook" | "tiktok" | "youtube" | "x"

export type GlobalContent = {
  businessName: string
  tagline: string
  footerBlurb: string
  address: string
  neighborhood: string
  phone: string
  email: string
  orderUrl: string
  mapsLink: string
  mapsEmbed: string
  hours: Array<{ day: string; time: string }>
  socials: Array<{ platform: SocialPlatform; label: string; url: string }>
}

const image = (path: string, alt = ""): CmsImage => ({ path, alt })

export const DEFAULT_HOME_CONTENT: HomeContent = {
  hero: {
    background: image("/images/preampdecor.webp", "Pre Amp Coffee Studio interior"),
    logo: image("/images/heroprimary.png", "Pre Amp"),
    tagline: "Coffee studio & vinyl listening bar, Squirrel Hill, Pittsburgh",
    orderButton: { label: "Order Now", href: "" },
  },
  marquee: {
    items: [
      "Passenger Coffee",
      "Vinyl All Day",
      "Espresso · Pourover · Cold Brew",
      "Focaccia Sandwiches",
      "Squirrel Hill, PGH",
    ],
  },
  intro: {
    kicker: "Welcome in",
    title: "A little corner of Squirrel Hill that sounds as good as it tastes.",
    body: "Pre Amp is part coffee studio, part listening bar. We obsess over the cup, single-origin pourovers, signature espresso drinks, slow-dripped cold brew, and we pair every one with the warm crackle of vinyl. Come for the coffee, stay for the record that's spinning.",
    images: [
      image("/images/preampdecor4.webp", "Inside Pre Amp Coffee Studio"),
      image("/images/preampdecor5.webp", "Coffee and vinyl at Pre Amp"),
    ],
  },
  featured: {
    kicker: "Now Pouring",
    title: "Best Sellers",
    body: "See something you like?",
    button: { label: "Order on Toast →", href: "" },
  },
  roomBanner: {
    image: image("/images/preampdecor3.webp", "The listening room at Pre Amp"),
    kicker: "The Room",
    title: "Records Spinning",
    body: "A wall of album art, warm gold light, and a needle that never lifts. This is the listening bar.",
  },
  quiz: {
    kicker: "The Pre Amp Oracle",
    title: "Let the bar read your mood.",
    body: "Four quick taps and we'll spin up the drink with your name on it. (Then come let us actually make it.)",
  },
  reviews: { kicker: "On the record", title: "Reviews" },
  location: {
    kicker: "Come hang",
    title: "Find Us",
    body: "Tucked into {neighborhood}. Pull up, grab a stool, and tell us what's spinning.",
  },
  restaurantGroup: {
    kicker: "The Family",
    title: "Proud to be part of Richard Deshantz's Restaurant Group.",
    button: { label: "Visit the restaurant group →", href: "https://richarddeshantz.com/" },
    restaurants: RD_RESTAURANTS.map((restaurant) => ({
      name: restaurant.name,
      image: image(restaurant.image ?? "", `${restaurant.name} restaurant`),
      href: restaurant.href ?? "",
    })),
  },
}

export const DEFAULT_ABOUT_CONTENT: AboutContent = {
  hero: {
    image: image("/images/artworkheadon.webp", "Pre Amp wall art"),
    kicker: "Pre Amp Coffee Studio · Pittsburgh",
    title: "Our Story",
    body: "Coffee, craft, records, and a kitchen that never sits still - a listening bar in the heart of Squirrel Hill.",
  },
  feature: {
    kicker: "What We're About",
    title: "Four Things, No Filler",
    image: image("/images/vinyl.png", "Vinyl records at Pre Amp Coffee Studio"),
    images: [
      image("/images/menu-coffee.webp", "Coffee at Pre Amp Coffee Studio"),
      image("/images/menu-sandwich.webp", "Food at Pre Amp Coffee Studio"),
      image("/images/eventvinyls.webp", "Vinyl records at Pre Amp Coffee Studio"),
      image("/images/menu-coffeecheers.webp", "Crafted drinks at Pre Amp Coffee Studio"),
    ],
    labels: ["Coffee", "Food", "Vinyl", "Drinks"],
  },
  owner: {
    image: image("/images/danny.jpg", "Danny Ryan, owner of Pre Amp Coffee Studio"),
    teamImage: image("/images/preampteam.jpg", "The Pre Amp Coffee Studio team"),
    name: "Danny Ryan",
    role: "Restaurant Owner & Operator",
    kicker: "Meet the Owner",
    title: "A Decade in the Making",
    paragraphs: [
      "After dedicating a decade to working in restaurants, cafes, and a roastery in New York City, I finally decided to pack up my family and embark on a new chapter: opening my own cafe in Pittsburgh in 2020. However, the pandemic had other plans for us, and, in a twist of fate, things worked out better than I could have ever imagined or anticipated.",
      "While seeking work during the pandemic's uncertainty, I had the fortune of meeting Tolga and Rick. They brought me on as their coffee lead at Coop De Ville, and from there, the rest is history. Their unwavering trust led to a partnership focused on creating the ultimate coffee experience in Pittsburgh, a dream I couldn't have achieved on my own. With their incredible support and belief, I've been able to build and realize my vision: establishing what I believe will be the best coffee shop in Pittsburgh.",
      "My passion for coffee ignited in 2009, sparked by a $6 cup of coffee on a Clover machine from Cafe Grumpy in NYC. I was utterly captivated and surprised by the complexity, rich flavors, and compelling stories held within each bean.",
    ],
    decorImages: [
      image("/images/aboutdecor1.jpg", "Interior detail at Pre Amp Coffee Studio"),
      image("/images/aboutdecor2.jpg", "Pre Amp Coffee Studio decor detail"),
      image("/images/aboutdecor3.jpg", "Coffee studio seating and decor"),
      image("/images/aboutdecor4.jpg", "Analog decor at Pre Amp Coffee Studio"),
    ],
  },
  closing: {
    title: "Come Hang With Us",
    body: "5840 Forbes Ave, Squirrel Hill. Pull up a stool and tell us what's spinning.",
    primary: { label: "Get In Touch", href: "/contact" },
    vinyl: { label: "Request Vinyl", href: "/contact?topic=vinyl-request&form=open" },
    secondary: { label: "See the Menu", href: "/menu/coffee" },
  },
}

export const DEFAULT_COLD_BREW_CONTENT: ColdBrewContent = {
  hero: {
    image: image("/images/menu-coffeemachine.webp", "Kyoto cold brew tower"),
    kicker: "Slow-dripped · Pre-Launch",
    title: "Kyoto Cold Brew",
    body: "Twelve hours, one drop at a time. Clean, syrupy, impossibly smooth - and about to get a whole lot bigger.",
    primary: { label: "Order In-Store →", href: "" },
    secondary: { label: "What's Coming", href: "#whats-coming" },
  },
  method: {
    image: image("/images/menu-coffeebeans.webp", "Fresh coffee beans for cold brew"),
    kicker: "The Method",
    paragraphs: [
      "Kyoto-style cold brew is the slow road: ice-cold water falling one drop at a time through a tall tower of fresh Passenger grounds. No heat, no rush - just twelve patient hours.",
      "The result is a cup that's clean, low-acid, and almost syrupy, with the sweetness turned all the way up. Drink it neat over a big cube, or let a splash of milk carry it home.",
    ],
    button: { label: "Order Now →", href: "" },
  },
  launch: {
    kicker: "The Big Launch",
    title: "More Ways to Get Your Fix",
    body: "We're scaling the drip. These are on the way - check back soon, or ask the bar to put you on the list.",
    cards: [
      {
        icon: "building-2",
        badge: "Coming soon",
        title: "Office Catering",
        body: "Kegs and carafes of cold brew delivered to your team. Keep the whole office wired and happy through the afternoon slump.",
      },
      {
        icon: "bike",
        badge: "Coming soon",
        title: "Home Delivery",
        body: "Fresh cold brew brought right to your door on a schedule that fits your week. Never run dry on a Monday again.",
      },
      {
        icon: "milk",
        badge: "Coming soon",
        title: "Bottles & Growlers",
        body: "Take the studio home. Grab-and-go bottles and refillable growlers to stock your own fridge with the good stuff.",
      },
    ],
  },
  availability: {
    kicker: "Where to Get It",
    title: "Available Now at the Bar",
    body: "Right now, the Kyoto Cold Brew pours fresh at the studio - {address}. Pull up a stool, order at the counter, or grab one on your way through. Catering, delivery, and bottles land here the moment they're ready.",
    orderButton: { label: "Order Online →", href: "" },
    directionsButton: { label: "Get Directions", href: "" },
  },
}

export const DEFAULT_GLOBAL_CONTENT: GlobalContent = {
  businessName: "Pre Amp",
  tagline: "Coffee Studio",
  footerBlurb: "A coffee-and-vinyl listening bar. Brews & beats, all day.",
  address: "5840 Forbes Ave, Pittsburgh, PA 15217",
  neighborhood: "Squirrel Hill · Shadyside",
  phone: "(412) 555-0142",
  email: "",
  orderUrl: "https://order.toasttab.com/online/pre-amp-new-5840-forbes-avenue",
  mapsEmbed: "https://www.google.com/maps?q=5840+Forbes+Ave,+Pittsburgh,+PA+15217&output=embed",
  mapsLink: "https://www.google.com/maps/search/?api=1&query=5840+Forbes+Ave+Pittsburgh+PA+15217",
  hours: [
    { day: "Mon – Fri", time: "7:00 AM – 6:00 PM" },
    { day: "Saturday", time: "8:00 AM – 7:00 PM" },
    { day: "Sunday", time: "8:00 AM – 5:00 PM" },
  ],
  socials: [
    {
      platform: "instagram",
      label: "@preamp.coffeestudio",
      url: "https://www.instagram.com/preamp.coffeestudio/",
    },
    { platform: "tiktok", label: "TikTok", url: "https://www.tiktok.com/@rd_restaurants" },
  ],
}

export const CONTENT_DEFAULTS = {
  home: DEFAULT_HOME_CONTENT,
  about: DEFAULT_ABOUT_CONTENT,
  "cold-brew": DEFAULT_COLD_BREW_CONTENT,
  global: DEFAULT_GLOBAL_CONTENT,
} as const

type ContentFor<K extends CmsKey> = (typeof CONTENT_DEFAULTS)[K]

/** Merge saved top-level sections over defaults for forward-compatible fields. */
export function mergeContent<K extends CmsKey>(key: K, saved: unknown): ContentFor<K> {
  const defaults = CONTENT_DEFAULTS[key]
  if (!saved || typeof saved !== "object") return structuredClone(defaults)
  const output = structuredClone(defaults) as Record<string, unknown>
  for (const [section, value] of Object.entries(saved)) {
    const base = output[section]
    output[section] =
      base &&
      value &&
      typeof base === "object" &&
      typeof value === "object" &&
      !Array.isArray(base) &&
      !Array.isArray(value)
        ? { ...base, ...value }
        : value
  }

  if (key === "cold-brew") {
    const coldBrew = output as unknown as ColdBrewContent
    const legacyIcons: Record<string, string> = {
      "🏢": "building-2",
      "🚲": "bike",
      "🍾": "milk",
    }
    coldBrew.launch.cards = coldBrew.launch.cards.map((card) => ({
      ...card,
      icon: legacyIcons[card.icon] ?? card.icon,
    }))
  }

  return output as ContentFor<K>
}

export function imageUrl(value: CmsImage): string {
  return value.url || value.path || ""
}

export function fillTemplate(value: string, global: GlobalContent): string {
  return value
    .replaceAll("{address}", global.address)
    .replaceAll("{neighborhood}", global.neighborhood)
}

export function useCmsContent<K extends CmsKey>(key: K): ContentFor<K> {
  const row = useQuery(api.cms.get, { key })
  const preview = useContext(CmsPreviewContext)
  if (preview?.key === key) return preview.content as ContentFor<K>
  return mergeContent(key, row?.content)
}

const GlobalContentContext = createContext<GlobalContent>(DEFAULT_GLOBAL_CONTENT)
const HomeContentContext = createContext<HomeContent>(DEFAULT_HOME_CONTENT)
const CmsPreviewContext = createContext<{
  key: CmsKey
  content: unknown
} | null>(null)

export function CmsContentPreviewProvider<K extends CmsKey>({
  cmsKey,
  content,
  children,
}: {
  cmsKey: K
  content: ContentFor<K>
  children: ReactNode
}) {
  return (
    <CmsPreviewContext.Provider value={{ key: cmsKey, content }}>
      {children}
    </CmsPreviewContext.Provider>
  )
}

export function GlobalContentProvider({ children }: { children: ReactNode }) {
  const content = useCmsContent("global")
  return <GlobalContentContext.Provider value={content}>{children}</GlobalContentContext.Provider>
}

export function useGlobalContent() {
  return useContext(GlobalContentContext)
}

export function HomeContentProvider({
  value,
  children,
}: {
  value: HomeContent
  children: ReactNode
}) {
  return <HomeContentContext.Provider value={value}>{children}</HomeContentContext.Provider>
}

export function useHomeContent() {
  return useContext(HomeContentContext)
}
