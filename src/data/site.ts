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
  mapsEmbed:
    "https://www.google.com/maps?q=5840+Forbes+Ave,+Pittsburgh,+PA+15217&output=embed",
  mapsLink: "https://www.google.com/maps/search/?api=1&query=5840+Forbes+Ave+Pittsburgh+PA+15217",
} as const;

export interface NavLink {
  label: string;
  to: string;
}
export interface NavItem {
  label: string;
  to?: string;
  children?: NavLink[];
}

export const NAV: NavItem[] = [
  {
    label: "Menu",
    children: [
      { label: "Coffee", to: "/menu/coffee" },
      { label: "Drip", to: "/menu/drip" },
      { label: "Food", to: "/menu/food" },
    ],
  },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
  {
    label: "More",
    children: [
      { label: "Retail", to: "/retail" },
      { label: "Events", to: "/events" },
      { label: "Gift Cards", to: "/gift-cards" },
    ],
  },
];

export interface Drink {
  name: string;
  blurb: string;
  notes: string;
  badge: string;
  hue: string; // base color for the card art
}

export const FEATURED: Drink[] = [
  {
    name: "Smokey Robinson",
    blurb: "Our house signature: smooth, sweet, a little smoky.",
    notes: "Local honey · smoked sea salt · cinnamon · peppercorn",
    badge: "Signature",
    hue: "var(--color-gold)",
  },
  {
    name: "Yuzu Espresso Tonic",
    blurb: "Bright, citrusy and effervescent over ice.",
    notes: "Double espresso · yuzu · tonic · orange peel",
    badge: "Iced",
    hue: "var(--color-amber)",
  },
  {
    name: "Pre Amp's Dulce de Leche",
    blurb: "Our take on the caramel macchiato, turned up a notch.",
    notes: "Espresso · caramelized milk · vanilla",
    badge: "House",
    hue: "var(--color-orange)",
  },
  {
    name: "Kyoto Cold Brew",
    blurb: "Slow-dripped overnight for a clean, syrupy cup.",
    notes: "Passenger beans · 12-hour drip · neat or milked",
    badge: "Slow",
    hue: "var(--color-terracotta)",
  },
  {
    name: "Passenger Pourover",
    blurb: "Single-origin, hand-poured on the EK43. Ask the bar.",
    notes: "Rotating origin · filter · served black",
    badge: "Drip",
    hue: "var(--color-brick)",
  },
];

export interface Testimonial {
  quote: string;
  name: string;
  source: string;
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
    quote:
      "Passenger beans pulled perfectly. I came for coffee and stayed for the playlist.",
    name: "Marcus T.",
    source: "Yelp",
  },
];

export interface Restaurant {
  name: string;
  /** Square photo (e.g. the restaurant's Facebook profile image). */
  image?: string;
  href?: string;
}

/**
 * The other concepts under Richard Dishon's restaurant group (RD Restaurants).
 * Each renders as a square tile. Drop in the real Facebook profile images and
 * page links as `image` / `href` to replace the on-brand placeholders.
 */
export const RD_RESTAURANTS: Restaurant[] = [
  { name: "Meat & Potatoes", image: "/meatpotatoes.jpg" },
  { name: "Butcher and the Rye", image: "/butcherandtherye.jpg" },
  { name: "täkō", image: "/tako.jpg" },
  { name: "Tako Torta", image: "/takotorta.jpg" },
  { name: "Poulet Bleu", image: "/pouletbleu.jpg" },
  { name: "Fish nor Fowl", image: "/fishnorfowl.jpg" },
  { name: "Coup De Ville", image: "/coupdeville.jpg" },
  { name: "Sally Ann's", image: "/sallyannys.jpg" },
  { name: "Golden Gai", image: "/goldengai.jpg" },
  { name: "Vieux Carré", image: "/vieuxcarre.jpg" },
  { name: "Hand Roll", image: "/handroll.jpg" },
  { name: "Sea Monkey", image: "/seamonkey.jpg" },
  { name: "Rib Room", image: "/ribroom.jpg" },
];

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: { label: string; value: string }[];
}

export const QUIZ: QuizQuestion[] = [
  {
    id: "mood",
    prompt: "What's the mood today?",
    options: [
      { label: "Cozy & slow", value: "cozy" },
      { label: "Bright & buzzing", value: "bright" },
      { label: "Bold & focused", value: "bold" },
    ],
  },
  {
    id: "temp",
    prompt: "Hot or iced?",
    options: [
      { label: "Hot, always", value: "hot" },
      { label: "Iced, please", value: "iced" },
      { label: "Surprise me", value: "any" },
    ],
  },
  {
    id: "sweet",
    prompt: "How sweet are we feeling?",
    options: [
      { label: "Keep it pure", value: "none" },
      { label: "A gentle touch", value: "some" },
      { label: "Treat-yourself sweet", value: "lots" },
    ],
  },
  {
    id: "milk",
    prompt: "Milk situation?",
    options: [
      { label: "Black & clean", value: "black" },
      { label: "Creamy & smooth", value: "milk" },
      { label: "Fizzy & bright", value: "fizz" },
    ],
  },
];

/** Maps a set of answers to one of the featured drinks. */
export function predictDrink(answers: Record<string, string>): Drink {
  const { temp, sweet, milk } = answers;
  if (milk === "fizz" || temp === "iced") {
    return FEATURED[1]; // Yuzu Espresso Tonic
  }
  if (milk === "black" && sweet === "none") {
    return temp === "iced" ? FEATURED[3] : FEATURED[4]; // Cold brew / Pourover
  }
  if (sweet === "lots") {
    return FEATURED[2]; // Dulce de Leche
  }
  return FEATURED[0]; // Smokey Robinson
}
