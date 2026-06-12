import { PageWrapper } from "@/components/site/PageWrapper";
import { Hero } from "@/components/site/sections/Hero";
import { Marquee } from "@/components/site/sections/Marquee";
import { Intro } from "@/components/site/sections/Intro";
import { FeaturedCarousel } from "@/components/site/sections/FeaturedCarousel";
import { ParallaxBanner } from "@/components/site/sections/ParallaxBanner";
import { CoffeeQuiz } from "@/components/site/sections/CoffeeQuiz";
import { Testimonials } from "@/components/site/sections/Testimonials";
import { LocationCTA } from "@/components/site/sections/LocationCTA";

export function Home() {
  return (
    <PageWrapper>
      <Hero />
      <Marquee />
      <Intro />

      <ParallaxBanner
        image="https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1920&q=80"
        kicker="The Cup"
        heading="Dialed Daily"
        sub="Passenger beans, pulled and poured with care — from espresso to slow Kyoto cold brew."
      />

      <FeaturedCarousel />

      <ParallaxBanner
        image="https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?auto=format&fit=crop&w=1920&q=80"
        kicker="The Room"
        heading="Records Spinning"
        sub="A wall of album art, warm gold light, and a needle that never lifts. This is the listening bar."
      />

      <CoffeeQuiz />
      <Testimonials />
      <LocationCTA />
    </PageWrapper>
  );
}
