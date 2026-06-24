/** Menu manager — implemented in the next pass. */
export function MenuManager({ menu }: { menu: "coffee" | "food" }) {
  return (
    <div>
      <h1 className="font-display text-4xl capitalize text-espresso">
        {menu} Menu
      </h1>
      <p className="mt-4 text-espresso/60">Loading the menu manager…</p>
    </div>
  );
}
