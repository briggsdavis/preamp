import { PageWrapper } from "@/components/site/page-wrapper"
import { CoffeeQuiz } from "@/components/site/sections/coffee-quiz"
import { FeaturedCarousel } from "@/components/site/sections/featured-carousel"
import { Hero } from "@/components/site/sections/hero"
import { Intro } from "@/components/site/sections/intro"
import { LocationCTA } from "@/components/site/sections/location-cta"
import { Marquee } from "@/components/site/sections/marquee"
import { ParallaxBanner } from "@/components/site/sections/parallax-banner"
import { RestaurantGroup } from "@/components/site/sections/restaurant-group"
import { Testimonials } from "@/components/site/sections/testimonials"
import { SquiggleLine } from "@/components/site/squiggle-line"
import { HomeContentProvider, imageUrl, useCmsContent } from "@/lib/site-content"

export function Home() {
  const content = useCmsContent("home")

  return (
    <HomeContentProvider value={content}>
      <PageWrapper>
        <Hero />
        <Marquee />
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 z-10">
            <SquiggleLine side="left" rows={4} marginY={28} marginX={28} leadInY={520} />
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
          cmsImage={content.roomBanner.image}
          cmsPaths={{
            image: "roomBanner.image",
            kicker: "roomBanner.kicker",
            heading: "roomBanner.title",
            sub: "roomBanner.body",
          }}
        />

        <CoffeeQuiz />
        <Testimonials />
        <LocationCTA />
        <RestaurantGroup />
      </PageWrapper>
    </HomeContentProvider>
  )
}
