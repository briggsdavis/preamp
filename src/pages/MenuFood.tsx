import { MenuPage } from "@/components/menu/MenuPage";
import { FOOD_MENU } from "@/data/menu";

export function MenuFood() {
  return <MenuPage kicker="From the kitchen" title="Food" items={FOOD_MENU} />;
}
