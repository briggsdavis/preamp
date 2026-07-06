import { PageWrapper } from "@/components/site/PageWrapper";
import { Hero } from "@/components/site/sections/Hero";
import { Marquee } from "@/components/site/sections/Marquee";
import { Intro } from "@/components/site/sections/Intro";
import { FeaturedCarousel } from "@/components/site/sections/FeaturedCarousel";
import { ParallaxBanner } from "@/components/site/sections/ParallaxBanner";
import { CoffeeQuiz } from "@/components/site/sections/CoffeeQuiz";
import { Testimonials } from "@/components/site/sections/Testimonials";
import { LocationCTA } from "@/components/site/sections/LocationCTA";
import { RestaurantGroup } from "@/components/site/sections/RestaurantGroup";

export function Home() {
  return (
    <PageWrapper>
      <Hero />
      <Marquee />
      <Intro />

      <ParallaxBanner
        image="/images/preampdecor2.webp"
        kicker="The Cup"
        heading="Dialed Daily"
        sub="Passenger beans, pulled and poured with care, from espresso to slow Kyoto cold brew."
      />

      <FeaturedCarousel />

      <ParallaxBanner
        image="/images/preampdecor3.webp"
        kicker="The Room"
        heading="Records Spinning"
        sub="A wall of album art, warm gold light, and a needle that never lifts. This is the listening bar."
      />

      <CoffeeQuiz />
      <Testimonials />
      <LocationCTA />
      <RestaurantGroup />
    </PageWrapper>
  );
}
