/**
 * Menu / catalog data for the coffee, food, and merch pages. Items are grouped
 * into sections. Likes and reviews ship with seed values; they're managed in
 * component state for now (swap to a backend like Convex later).
 */

export interface Review {
  name: string;
  rating: number; // 1–5
  text: string;
}

export interface MenuItem {
  id: string;
  name: string;
  slug?: string; // URL slug for the item's own page
  price: string;
  description: string;
  dietaryTags?: string[]; // dietary tag keys (see convex/dietaryTags)
  orderUrl?: string | null; // per-item Toast ordering link (optional)
  image: string; // primary image (first of `images`)
  images?: string[]; // all images, primary first
  likes: number;
  reviews: Review[];
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

/** Tiny helper to keep the seed data terse. */
function item(
  id: string,
  name: string,
  price: string,
  description: string,
  image: string,
  likes = 0,
  reviews: Review[] = [],
): MenuItem {
  return { id, name, price, description, image, likes, reviews };
}

export const COFFEE_SECTIONS: MenuSection[] = [
  {
    title: "Coffee",
    items: [
      item(
        "smokey-robinson",
        "Smokey Robinson",
        "$5.75",
        "Our house signature: smooth, sweet, a little smoky.",
        "/images/menu-coffeeshot.webp",
        128,
        [
          { name: "Jordan M.", rating: 5, text: "Unreal. The smoked salt is genius." },
          { name: "Priya S.", rating: 5, text: "I order this every single time." },
        ],
      ),
      item("dulce-de-leche", "Dulce de Leche", "$5.50", "Our take on the caramel macchiato, turned up a notch.", "/images/menu-coffeemachine.webp", 76, [
        { name: "Casey L.", rating: 4, text: "Sweet and cozy. A treat." },
      ]),
      item("cortado", "Cortado", "$4.25", "Equal parts espresso and steamed milk. Balanced and warm.", "/images/menu-coffeecheers.webp", 47),
      item("cappuccino", "Cappuccino", "$4.50", "Espresso, steamed milk, and a deep cap of foam.", "/images/menu-coffee.webp", 52),
      item("latte", "Latte", "$4.75", "Velvety steamed milk over a double shot.", "/images/menu-coffeepouring.webp", 64),
      item("house-drip", "House Drip", "$3.50", "Rotating roast, always fresh. The classic cup.", "/images/menu-coffeepacket.webp", 39),
    ],
  },
  {
    title: "Tea",
    items: [
      item("matcha-latte", "Matcha Latte", "$5.50", "Stone-ground ceremonial matcha, whisked and poured over milk.", "/images/menu-coffee.webp", 58, [
        { name: "Sam K.", rating: 5, text: "Smooth, not bitter. Perfect." },
      ]),
      item("masala-chai", "Masala Chai", "$5.00", "House-spiced black tea steamed with milk.", "/images/menu-coffeemachine.webp", 41),
      item("hojicha-latte", "Hojicha Latte", "$5.50", "Roasted green tea, toasty and mellow.", "/images/menu-coffeepouring.webp", 33),
      item("earl-grey", "Earl Grey", "$3.75", "Classic bergamot black tea, served hot.", "/images/menu-coffeepacket.webp", 22),
    ],
  },
  {
    title: "Sips",
    items: [
      item("hot-chocolate", "Hot Chocolate", "$4.50", "Rich drinking chocolate, steamed to order.", "/images/menu-coffeecheers.webp", 49),
      item("golden-milk", "Golden Milk", "$5.00", "Turmeric, ginger, and warm spices over steamed milk.", "/images/menu-coffeemachine.webp", 27),
      item("vanilla-steamer", "Vanilla Steamer", "$4.00", "Steamed milk and vanilla. No caffeine, all comfort.", "/images/menu-coffee.webp", 31),
    ],
  },
  {
    title: "Specials",
    items: [
      item("seasonal-special", "Seasonal Special", "$6.00", "Ask the bar for our rotating drink of the moment.", "/images/menu-coffeeshot.webp", 84, [
        { name: "Devon R.", rating: 5, text: "Whatever they make, get it." },
      ]),
      item("baristas-choice", "Barista's Choice", "$6.50", "Hand it to the bar and let them surprise you.", "/images/menu-coffeepouring.webp", 57),
    ],
  },
  {
    title: "Pourover Bar",
    items: [
      item("passenger-pourover", "Passenger Pourover", "$4.75", "Single-origin, hand-poured on the EK43.", "/images/menu-coffeebeans.webp", 53, [
        { name: "Marcus T.", rating: 5, text: "Pulled perfectly. Clean and bright." },
      ]),
      item("rotating-origin", "Rotating Single Origin", "$6.00", "This week's featured origin, brewed to spec.", "/images/menu-coffeebeans.webp", 38),
      item("kyoto-cold-brew", "Kyoto Cold Brew", "$5.25", "Slow-dripped overnight for a clean, syrupy cup.", "/images/menu-coffee.webp", 61),
    ],
  },
  {
    title: "Fizz",
    items: [
      item("yuzu-espresso-tonic", "Yuzu Espresso Tonic", "$6.00", "Bright, citrusy and effervescent over ice.", "/images/menu-coffeepouring.webp", 94, [
        { name: "Devon R.", rating: 5, text: "Best espresso tonic in the city." },
      ]),
      item("espresso-tonic", "Espresso Tonic", "$5.50", "Double shot, tonic, and a twist over ice.", "/images/menu-coffeeshot.webp", 46),
      item("italian-soda", "Italian Soda", "$4.50", "Sparkling water, house syrups, splash of cream.", "/images/menu-coffeecheers.webp", 29),
    ],
  },
];

export const FOOD_SECTIONS: MenuSection[] = [
  {
    title: "Featured Items",
    items: [
      item("focaccia-sandwich", "Focaccia Sandwich", "$11.00", "House focaccia, seasonal fillings, dressed greens.", "/images/menu-sandwich.webp", 112, [
        { name: "Devon R.", rating: 5, text: "The focaccia sandwiches are no joke." },
        { name: "Sam K.", rating: 4, text: "Hearty and fresh. Great lunch." },
      ]),
      item("avocado-toast", "Avocado Toast", "$9.50", "Smashed avocado on sourdough, chili crunch, lemon.", "/images/menu-coffeemachine.webp", 71, [
        { name: "Priya S.", rating: 4, text: "Simple done right." },
      ]),
    ],
  },
  {
    title: "Sides",
    items: [
      item("house-fries", "House Fries", "$4.50", "Crispy fries with house seasoning and aioli.", "/images/menu-sandwich.webp", 44),
      item("side-salad", "Side Salad", "$5.00", "Dressed greens, shaved veg, lemon vinaigrette.", "/images/menu-coffeecheers.webp", 18),
      item("kettle-chips", "Kettle Chips", "$3.00", "Crunchy, salty, the perfect sidekick.", "/images/menu-coffeepacket.webp", 12),
    ],
  },
  {
    title: "Hot Dogs",
    items: [
      item("classic-dog", "Classic Dog", "$7.00", "All-beef dog, toasted bun, your choice of fixings.", "/images/menu-sandwich.webp", 36),
      item("chili-cheese-dog", "Chili Cheese Dog", "$9.00", "Loaded with house chili and melted cheese.", "/images/menu-sandwich.webp", 51, [
        { name: "Sam K.", rating: 5, text: "Messy in the best way." },
      ]),
      item("veggie-dog", "Veggie Dog", "$7.50", "Plant-based dog, all the same fixings.", "/images/menu-sandwich.webp", 23),
    ],
  },
  {
    title: "Burgers",
    items: [
      item("cheeseburger", "Pre Amp Cheeseburger", "$12.00", "Smashed patty, American, pickles, special sauce.", "/images/menu-sandwich.webp", 98, [
        { name: "Jordan M.", rating: 5, text: "Criminally good smash burger." },
      ]),
      item("double-stack", "Double Stack", "$15.00", "Two patties, double cheese, all the way.", "/images/menu-sandwich.webp", 67),
      item("veggie-burger", "Veggie Burger", "$11.50", "House veggie patty, lettuce, tomato, aioli.", "/images/menu-sandwich.webp", 34),
    ],
  },
];

export const MERCH_SECTIONS: MenuSection[] = [
  {
    title: "T-Shirts",
    items: [
      item("logo-tee", "Logo Tee", "$28.00", "Soft cotton tee with the Pre Amp wordmark.", "/images/preampdecor2.webp", 73, [
        { name: "Casey L.", rating: 5, text: "Softest tee I own." },
      ]),
      item("vinyl-tee", "Vinyl Tee", "$30.00", "Records-and-coffee graphic on a vintage wash.", "/images/preampdecor3.webp", 56),
      item("studio-tee", "Studio Tee", "$28.00", "Minimal studio crest, front and center.", "/images/preampdecor4.webp", 41),
    ],
  },
  {
    title: "Hats",
    items: [
      item("dad-hat", "Dad Hat", "$25.00", "Unstructured 6-panel with embroidered logo.", "/images/preampdecor5.webp", 62, [
        { name: "Marcus T.", rating: 5, text: "Goes with everything." },
      ]),
      item("beanie", "Beanie", "$22.00", "Cuffed knit beanie for cold-brew weather.", "/images/preampdecor6.webp", 38),
      item("trucker-hat", "Trucker Hat", "$24.00", "Mesh-back trucker with a woven patch.", "/images/preampdecor7.webp", 29),
    ],
  },
];
