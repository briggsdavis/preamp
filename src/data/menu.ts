/**
 * Menu data for the coffee and food pages. Likes and reviews ship with a few
 * seed values; they're managed in component state for now (swap to a backend
 * like Convex later by replacing the in-memory handlers).
 */

export interface Review {
  name: string;
  rating: number; // 1–5
  text: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: string;
  description: string;
  image: string;
  likes: number;
  reviews: Review[];
}

export const COFFEE_MENU: MenuItem[] = [
  {
    id: "smokey-robinson",
    name: "Smokey Robinson",
    price: "$5.75",
    description: "Our house signature: smooth, sweet, a little smoky.",
    image: "/menu-coffeeshot.jpg",
    likes: 128,
    reviews: [
      { name: "Jordan M.", rating: 5, text: "Unreal. The smoked salt is genius." },
      { name: "Priya S.", rating: 5, text: "I order this every single time." },
    ],
  },
  {
    id: "yuzu-espresso-tonic",
    name: "Yuzu Espresso Tonic",
    price: "$6.00",
    description: "Bright, citrusy and effervescent over ice.",
    image: "/menu-coffeepouring.jpg",
    likes: 94,
    reviews: [
      { name: "Devon R.", rating: 5, text: "Best espresso tonic in the city." },
    ],
  },
  {
    id: "dulce-de-leche",
    name: "Pre Amp's Dulce de Leche",
    price: "$5.50",
    description: "Our take on the caramel macchiato, turned up a notch.",
    image: "/menu-coffeemachine.jpg",
    likes: 76,
    reviews: [
      { name: "Casey L.", rating: 4, text: "Sweet and cozy. A treat." },
    ],
  },
  {
    id: "kyoto-cold-brew",
    name: "Kyoto Cold Brew",
    price: "$5.25",
    description: "Slow-dripped overnight for a clean, syrupy cup.",
    image: "/menu-coffee.jpg",
    likes: 61,
    reviews: [],
  },
  {
    id: "passenger-pourover",
    name: "Passenger Pourover",
    price: "$4.75",
    description: "Single-origin, hand-poured on the EK43. Ask the bar.",
    image: "/menu-coffeebeans.jpg",
    likes: 53,
    reviews: [
      { name: "Marcus T.", rating: 5, text: "Pulled perfectly. Clean and bright." },
    ],
  },
  {
    id: "cortado",
    name: "Cortado",
    price: "$4.25",
    description: "Equal parts espresso and steamed milk. Balanced and warm.",
    image: "/menu-coffeecheers.jpg",
    likes: 47,
    reviews: [],
  },
  {
    id: "house-drip",
    name: "House Drip",
    price: "$3.50",
    description: "Rotating roast, always fresh. The classic cup.",
    image: "/menu-coffeepacket.jpg",
    likes: 39,
    reviews: [],
  },
];

export const FOOD_MENU: MenuItem[] = [
  {
    id: "focaccia-sandwich",
    name: "Focaccia Sandwich",
    price: "$11.00",
    description: "House focaccia, seasonal fillings, dressed greens.",
    image: "/menu-sandwich.jpg",
    likes: 112,
    reviews: [
      { name: "Devon R.", rating: 5, text: "The focaccia sandwiches are no joke." },
      { name: "Sam K.", rating: 4, text: "Hearty and fresh. Great lunch." },
    ],
  },
  {
    id: "morning-bagel",
    name: "Morning Bagel",
    price: "$7.50",
    description: "Toasted bagel, whipped cream cheese, everything seasoning.",
    image: "/menu-coffeecheers.jpg",
    likes: 58,
    reviews: [],
  },
  {
    id: "avocado-toast",
    name: "Avocado Toast",
    price: "$9.50",
    description: "Smashed avocado on sourdough, chili crunch, lemon.",
    image: "/menu-coffeemachine.jpg",
    likes: 71,
    reviews: [
      { name: "Priya S.", rating: 4, text: "Simple done right." },
    ],
  },
  {
    id: "almond-croissant",
    name: "Almond Croissant",
    price: "$5.00",
    description: "Flaky, buttery, filled with almond cream and toasted flakes.",
    image: "/menu-coffeepacket.jpg",
    likes: 88,
    reviews: [
      { name: "Casey L.", rating: 5, text: "Pairs perfectly with a cortado." },
    ],
  },
  {
    id: "seasonal-quiche",
    name: "Seasonal Quiche",
    price: "$8.50",
    description: "Daily quiche with a side of dressed greens.",
    image: "/menu-coffeepouring.jpg",
    likes: 34,
    reviews: [],
  },
  {
    id: "granola-yogurt",
    name: "Granola & Yogurt",
    price: "$7.00",
    description: "House granola, thick yogurt, seasonal fruit and honey.",
    image: "/menu-coffee.jpg",
    likes: 42,
    reviews: [],
  },
];
