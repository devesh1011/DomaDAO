import { HeroSection } from "@/components/blocks/hero-section-dark"
import { FeaturesSection } from "@/components/blocks/features-section"
import { HowItWorksSection } from "@/components/blocks/how-it-works-section"
import { CTASection } from "@/components/blocks/cta-section"
import { StackedCircularFooter } from "@/components/ui/stacked-circular-footer"

export default function Home() {
  return (
    <>
      <main>
        <HeroSection
          title="Welcome to DomaDAO"
          subtitle={{
            regular: "Fractional domain investment ",
            gradient: "pools"
          }}
          description="Invest in premium domain names through fractional ownership. Pool your resources with other investors to acquire high-value domains and share in the revenue they generate."
          ctaText="Explore Domains"
          ctaHref="#explore"
          bottomImage={{
            light: "/hero-dashboard.png",
            dark: "/hero-dashboard.png"
          }}
          gridOptions={{
            angle: 65,
            cellSize: 60,
            opacity: 0.5,
            lightLineColor: "gray",
            darkLineColor: "gray"
          }}
        />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
      </main>
      <StackedCircularFooter />
    </>
  )
}
