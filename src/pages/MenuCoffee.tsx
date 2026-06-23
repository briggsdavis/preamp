import { MenuPage } from "@/components/menu/MenuPage";
import { COFFEE_MENU } from "@/data/menu";

export function MenuCoffee() {
  return <MenuPage kicker="From the bar" title="Coffee" items={COFFEE_MENU} />;
}
