/**
 * One-time seed content for the menu, mirroring the original static data from
 * `src/data/menu.ts`. Consumed by the `menu.seed` mutation. Images reference
 * the public asset paths under `/images/`.
 */

export interface SeedReview {
  name: string;
  rating: number;
  text: string;
}

export interface SeedItem {
  name: string;
  price: string;
  description: string;
  image: string;
  likes: number;
  reviews: SeedReview[];
}

export interface SeedSection {
  title: string;
  items: SeedItem[];
}

const it = (
  name: string,
  price: string,
  description: string,
  image: string,
  likes = 0,
  reviews: SeedReview[] = [],
): SeedItem => ({ name, price, description, image, likes, reviews });

export const COFFEE_SEED: SeedSection[] = [
  {
    title: "Coffee",
    items: [
      it("Smokey Robinson", "$5.75", "Our house signature: smooth, sweet, a little smoky.", "/images/menu-coffeeshot.jpg", 128, [
        { name: "Jordan M.", rating: 5, text: "Unreal. The smoked salt is genius." },
        { name: "Priya S.", rating: 5, text: "I order this every single time." },
      ]),
      it("Dulce de Leche", "$5.50", "Our take on the caramel macchiato, turned up a notch.", "/images/menu-coffeemachine.jpg", 76, [
        { name: "Casey L.", rating: 4, text: "Sweet and cozy. A treat." },
      ]),
      it("Cortado", "$4.25", "Equal parts espresso and steamed milk. Balanced and warm.", "/images/menu-coffeecheers.jpg", 47, []),
      it("Cappuccino", "$4.50", "Espresso, steamed milk, and a deep cap of foam.", "/images/menu-coffee.jpg", 52, []),
      it("Latte", "$4.75", "Velvety steamed milk over a double shot.", "/images/menu-coffeepouring.jpg", 64, []),
      it("House Drip", "$3.50", "Rotating roast, always fresh. The classic cup.", "/images/menu-coffeepacket.jpg", 39, []),
    ],
  },
  {
    title: "Tea",
    items: [
      it("Matcha Latte", "$5.50", "Stone-ground ceremonial matcha, whisked and poured over milk.", "/images/menu-coffee.jpg", 58, [
        { name: "Sam K.", rating: 5, text: "Smooth, not bitter. Perfect." },
      ]),
      it("Masala Chai", "$5.00", "House-spiced black tea steamed with milk.", "/images/menu-coffeemachine.jpg", 41, []),
      it("Hojicha Latte", "$5.50", "Roasted green tea, toasty and mellow.", "/images/menu-coffeepouring.jpg", 33, []),
      it("Earl Grey", "$3.75", "Classic bergamot black tea, served hot.", "/images/menu-coffeepacket.jpg", 22, []),
    ],
  },
  {
    title: "Sips",
    items: [
      it("Hot Chocolate", "$4.50", "Rich drinking chocolate, steamed to order.", "/images/menu-coffeecheers.jpg", 49, []),
      it("Golden Milk", "$5.00", "Turmeric, ginger, and warm spices over steamed milk.", "/images/menu-coffeemachine.jpg", 27, []),
      it("Vanilla Steamer", "$4.00", "Steamed milk and vanilla. No caffeine, all comfort.", "/images/menu-coffee.jpg", 31, []),
    ],
  },
  {
    title: "Specials",
    items: [
      it("Seasonal Special", "$6.00", "Ask the bar for our rotating drink of the moment.", "/images/menu-coffeeshot.jpg", 84, [
        { name: "Devon R.", rating: 5, text: "Whatever they make, get it." },
      ]),
      it("Barista's Choice", "$6.50", "Hand it to the bar and let them surprise you.", "/images/menu-coffeepouring.jpg", 57, []),
    ],
  },
  {
    title: "Pourover Bar",
    items: [
      it("Passenger Pourover", "$4.75", "Single-origin, hand-poured on the EK43.", "/images/menu-coffeebeans.jpg", 53, [
        { name: "Marcus T.", rating: 5, text: "Pulled perfectly. Clean and bright." },
      ]),
      it("Rotating Single Origin", "$6.00", "This week's featured origin, brewed to spec.", "/images/menu-coffeebeans.jpg", 38, []),
      it("Kyoto Cold Brew", "$5.25", "Slow-dripped overnight for a clean, syrupy cup.", "/images/menu-coffee.jpg", 61, []),
    ],
  },
  {
    title: "Fizz",
    items: [
      it("Yuzu Espresso Tonic", "$6.00", "Bright, citrusy and effervescent over ice.", "/images/menu-coffeepouring.jpg", 94, [
        { name: "Devon R.", rating: 5, text: "Best espresso tonic in the city." },
      ]),
      it("Espresso Tonic", "$5.50", "Double shot, tonic, and a twist over ice.", "/images/menu-coffeeshot.jpg", 46, []),
      it("Italian Soda", "$4.50", "Sparkling water, house syrups, splash of cream.", "/images/menu-coffeecheers.jpg", 29, []),
    ],
  },
];

export const FOOD_SEED: SeedSection[] = [
  {
    title: "Featured Items",
    items: [
      it("Focaccia Sandwich", "$11.00", "House focaccia, seasonal fillings, dressed greens.", "/images/menu-sandwich.jpg", 112, [
        { name: "Devon R.", rating: 5, text: "The focaccia sandwiches are no joke." },
        { name: "Sam K.", rating: 4, text: "Hearty and fresh. Great lunch." },
      ]),
      it("Avocado Toast", "$9.50", "Smashed avocado on sourdough, chili crunch, lemon.", "/images/menu-coffeemachine.jpg", 71, [
        { name: "Priya S.", rating: 4, text: "Simple done right." },
      ]),
    ],
  },
  {
    title: "Sides",
    items: [
      it("House Fries", "$4.50", "Crispy fries with house seasoning and aioli.", "/images/menu-sandwich.jpg", 44, []),
      it("Side Salad", "$5.00", "Dressed greens, shaved veg, lemon vinaigrette.", "/images/menu-coffeecheers.jpg", 18, []),
      it("Kettle Chips", "$3.00", "Crunchy, salty, the perfect sidekick.", "/images/menu-coffeepacket.jpg", 12, []),
    ],
  },
  {
    title: "Hot Dogs",
    items: [
      it("Classic Dog", "$7.00", "All-beef dog, toasted bun, your choice of fixings.", "/images/menu-sandwich.jpg", 36, []),
      it("Chili Cheese Dog", "$9.00", "Loaded with house chili and melted cheese.", "/images/menu-sandwich.jpg", 51, [
        { name: "Sam K.", rating: 5, text: "Messy in the best way." },
      ]),
      it("Veggie Dog", "$7.50", "Plant-based dog, all the same fixings.", "/images/menu-sandwich.jpg", 23, []),
    ],
  },
  {
    title: "Burgers",
    items: [
      it("Pre Amp Cheeseburger", "$12.00", "Smashed patty, American, pickles, special sauce.", "/images/menu-sandwich.jpg", 98, [
        { name: "Jordan M.", rating: 5, text: "Criminally good smash burger." },
      ]),
      it("Double Stack", "$15.00", "Two patties, double cheese, all the way.", "/images/menu-sandwich.jpg", 67, []),
      it("Veggie Burger", "$11.50", "House veggie patty, lettuce, tomato, aioli.", "/images/menu-sandwich.jpg", 34, []),
    ],
  },
];
