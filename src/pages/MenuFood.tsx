import { MenuPage } from "@/components/menu/MenuPage";
import { FOOD_SECTIONS } from "@/data/menu";

export function MenuFood() {
  return (
    <MenuPage kicker="From the kitchen" title="Food" sections={FOOD_SECTIONS} />
  );
}
