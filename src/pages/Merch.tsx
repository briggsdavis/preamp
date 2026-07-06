import { MenuPage } from "@/components/menu/MenuPage";
import { MERCH_SECTIONS } from "@/data/menu";

/** Prominent in-store perk shown at the top of the merch page. */
function MerchPerkBanner() {
  return (
    <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border-2 border-brick/30 bg-gradient-to-r from-gold/25 via-amber/20 to-terracotta/20 px-6 py-6 text-center shadow-lg shadow-maroon/10 md:px-10 md:py-7">
      <p className="font-groovy text-sm uppercase tracking-[0.3em] text-brick">
        Wear It, Save It
      </p>
      <p className="mt-2 font-display text-2xl leading-snug text-espresso md:text-3xl">
        Order in-store while wearing any Pre Amp merch and get{" "}
        <span className="text-brick">10% off</span> your order!
      </p>
    </div>
  );
}

export function Merch() {
  return (
    <MenuPage
      kicker="Take some home"
      title="Merch"
      sections={MERCH_SECTIONS}
      banner={<MerchPerkBanner />}
    />
  );
}
