import { MenuPage } from "@/components/menu/MenuPage";
import { MERCH_SECTIONS } from "@/data/menu";

export function Merch() {
  return (
    <MenuPage kicker="Take some home" title="Merch" sections={MERCH_SECTIONS} />
  );
}
