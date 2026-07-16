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
import { SquiggleLine } from "@/components/site/SquiggleLine";
import {
  HomeContentProvider,
  imageUrl,
  useCmsContent,
} from "@/lib/siteContent";

export function Home() {
  const content = useCmsContent("home");
  return (
    <HomeContentProvider value={content}>
    <PageWrapper>
      <Hero />
      <Marquee />
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-10">
          <SquiggleLine
            side="left"
            rows={4}
            marginY={28}
            marginX={28}
            leadInY={520}
          />
        </div>
        <Intro showLine={false} />
        <FeaturedCarousel showLine={false} />
      </div>

      <ParallaxBanner
        image={imageUrl(content.roomBanner.image)}
        imageAlt={content.roomBanner.image.alt}
        kicker={content.roomBanner.kicker}
        heading={content.roomBanner.title}
        sub={content.roomBanner.body}
      />

      <CoffeeQuiz />
      <Testimonials />
      <LocationCTA />
      <RestaurantGroup />
    </PageWrapper>
    </HomeContentProvider>
  );
}
