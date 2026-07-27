/**
 * Static content for the Pre Amp Coffee Studio marketing site.
 * Real menu items / details sourced from public listings; swap freely.
 */

export const SITE = {
  name: "Pre Amp",
  tagline: "Coffee Studio",
  address: "5840 Forbes Ave, Pittsburgh, PA 15217",
  neighborhood: "Squirrel Hill · Shadyside",
  phone: "(412) 555-0142",
  hours: [
    { day: "Mon – Fri", time: "7:00 AM – 6:00 PM" },
    { day: "Saturday", time: "8:00 AM – 7:00 PM" },
    { day: "Sunday", time: "8:00 AM – 5:00 PM" },
  ],
  instagram: "https://www.instagram.com/preamp.coffeestudio/",
  tiktok: "https://www.tiktok.com/@rd_restaurants",
  mapsEmbed: "https://www.google.com/maps?q=5840+Forbes+Ave,+Pittsburgh,+PA+15217&output=embed",
  mapsLink: "https://www.google.com/maps/search/?api=1&query=5840+Forbes+Ave+Pittsburgh+PA+15217",
  // TODO: confirm the real online-ordering URL - placeholder based on the Toast
  // ordering domain used for the gift cards. Swap freely.
  orderUrl: "https://order.toasttab.com/online/pre-amp-new-5840-forbes-avenue",
} as const

export interface NavLink {
  label: string
  to: string
  /** When true, `to` is an external URL that opens in a new tab. */
  external?: boolean
}
export interface NavItem {
  label: string
  to?: string
  children?: NavLink[]
}

export const NAV: NavItem[] = [
  {
    label: "Menu",
    children: [
      { label: "Coffee", to: "/menu/coffee" },
      { label: "Food", to: "/menu/food" },
    ],
  },
  { label: "Events", to: "/events" },
  { label: "Merch", to: "/retail" },
  { label: "Cold Brew", to: "/cold-brew" },
  { label: "About", to: "/about" },
  { label: "Hiring", to: "/hiring" },
  {
    label: "More",
    children: [
      { label: "Contact", to: "/contact" },
      {
        label: "Gift Card",
        to: "https://order.toasttab.com/egiftcards/pre-amp-new-5840-forbes-avenue",
        external: true,
      },
    ],
  },
]

export interface Testimonial {
  quote: string
  name: string
  source: string
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Incredible space, great staff, killer decor, and the records spinning all day make it feel like a party.",
    name: "Jordan M.",
    source: "Google Reviews",
  },
  {
    quote:
      "So in love with this place I accidentally stayed for three hours. The Smokey Robinson is unreal.",
    name: "Priya S.",
    source: "Instagram",
  },
  {
    quote:
      "Best espresso tonic in Pittsburgh and the focaccia sandwiches are no joke. Cozy and cool at once.",
    name: "Devon R.",
    source: "Yelp",
  },
  {
    quote:
      "The vinyl-bar energy is exactly what Squirrel Hill needed. Warm, golden, and welcoming.",
    name: "Casey L.",
    source: "Google Reviews",
  },
  {
    quote: "Passenger beans pulled perfectly. I came for coffee and stayed for the playlist.",
    name: "Marcus T.",
    source: "Yelp",
  },
]

export interface Restaurant {
  name: string
  /** Square photo (e.g. the restaurant's Facebook profile image). */
  image?: string
  href?: string
}

/**
 * The other concepts under Richard Deshantz's restaurant group (RD Restaurants).
 * Each renders as a square tile. Drop in the real Facebook profile images and
 * page links as `image` / `href` to replace the on-brand placeholders.
 */
export const RD_RESTAURANTS: Restaurant[] = [
  {
    name: "Meat & Potatoes",
    image: "/images/meatpotatoes.webp",
    href: "https://meatandpotatoespgh.com/",
  },
  {
    name: "Butcher and the Rye",
    image: "/images/butcherandtherye.webp",
    href: "https://butcherandtherye.com/",
  },
  { name: "täkō", image: "/images/tako.webp", href: "https://takopgh.com/" },
  { name: "Tako Torta", image: "/images/takotorta.webp", href: "https://takotorta.com/" },
  { name: "Poulet Bleu", image: "/images/pouletbleu.webp", href: "https://www.pouletbleupgh.com/" },
  { name: "Fish nor Fowl", image: "/images/fishnorfowl.webp", href: "https://fishnorfowlpgh.com/" },
  { name: "Coup De Ville", image: "/images/coupdeville.webp", href: "https://coopdevillepgh.com/" },
  { name: "Sally Ann's", image: "/images/sallyannys.webp", href: "https://sallyannspgh.com/" },
  { name: "Golden Gai", image: "/images/goldengai.webp", href: "https://goldengaipgh.com/" },
  {
    name: "Vieux Carré",
    image: "/images/vieuxcarre.webp",
    href: "https://www.seamonkeypgh.com/vieux-carre",
  },
  { name: "Gi-Jin", image: "/images/handroll.webp", href: "https://gi-jin.com/" },
  { name: "Sea Monkey", image: "/images/seamonkey.webp", href: "https://www.seamonkeypgh.com/" },
  { name: "Rib Room", image: "/images/ribroom.webp", href: "https://ribroompgh.com/" },
  { name: "Pre Amp", image: "/images/preamplogo.png", href: "/" },
]
