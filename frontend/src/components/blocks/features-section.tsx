import { BentoCard, BentoGrid } from "@/components/ui/bento-grid"
import { Activity, DollarSign, Shield, Users, TrendingUp, Zap } from "lucide-react"

const features = [
  {
    Icon: DollarSign,
    name: "Fractional Ownership",
    description: "Invest in premium domains with smaller amounts through shared ownership pools.",
    href: "#",
    cta: "Learn more",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl" />
    ),
    className: "col-span-1",
  },
  {
    Icon: TrendingUp,
    name: "Revenue Sharing",
    description: "Earn passive income from domain monetization and appreciation.",
    href: "#",
    cta: "View returns",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-xl" />
    ),
    className: "col-span-1",
  },
  {
    Icon: Shield,
    name: "Secure & Transparent",
    description: "Blockchain-powered ownership with full transparency and security.",
    href: "#",
    cta: "See security",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl" />
    ),
    className: "col-span-1",
  },
  {
    Icon: Users,
    name: "Community Driven",
    description: "Join a community of domain investors and entrepreneurs.",
    href: "#",
    cta: "Join community",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl" />
    ),
    className: "col-span-2",
  },
  {
    Icon: Activity,
    name: "Real-time Analytics",
    description: "Track your investments and domain performance in real-time.",
    href: "#",
    cta: "View dashboard",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl" />
    ),
    className: "col-span-1",
  },
  {
    Icon: Zap,
    name: "Instant Liquidity",
    description: "Buy and sell domain shares with instant liquidity.",
    href: "#",
    cta: "Trade now",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl" />
    ),
    className: "col-span-1",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-geist font-bold text-gray-900 dark:text-white mb-4">
            Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">DomaDAO</span>?
          </h2>
          <p className="text-lg font-geist text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Experience the future of domain investing with our innovative fractional ownership platform
          </p>
        </div>

        <BentoGrid className="max-w-7xl mx-auto">
          {features.map((feature, idx) => (
            <BentoCard key={idx} {...feature} />
          ))}
        </BentoGrid>
      </div>
    </section>
  )
}