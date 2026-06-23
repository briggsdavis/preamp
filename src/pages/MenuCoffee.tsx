import { MenuPage } from "@/components/menu/MenuPage";
import { COFFEE_SECTIONS } from "@/data/menu";

export function MenuCoffee() {
  return (
    <MenuPage kicker="From the bar" title="Coffee" sections={COFFEE_SECTIONS} />
  );
}
