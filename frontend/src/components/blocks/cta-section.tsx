import { ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-32">
      <div className="container mx-auto">
        <div className="flex justify-center">
          <div className="max-w-5xl">
            <div className="flex flex-col items-start justify-between gap-8 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 backdrop-blur-sm border border-purple-200/20 dark:border-purple-800/20 px-6 py-10 md:flex-row lg:px-20 lg:py-16">
              <div className="md:w-2/3">
                <h4 className="mb-4 text-3xl md:text-4xl font-geist font-bold text-gray-900 dark:text-white">
                  Start Investing <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">Today</span>
                </h4>
                <p className="text-lg font-geist text-gray-600 dark:text-gray-300 mb-8">
                  Join thousands of investors building wealth through fractional domain ownership.
                  Connect your wallet and start exploring premium domain pools.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-geist font-semibold px-8 py-3">
                    Connect Wallet
                  </Button>
                  <Button variant="outline" size="lg" className="border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-geist font-semibold px-8 py-3" asChild>
                    <a href="/docs" className="flex items-center gap-2">
                      Learn More
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
              <div className="md:w-1/3">
                <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-purple-100 dark:border-purple-800">
                  <h5 className="font-geist font-semibold text-gray-900 dark:text-white mb-4">Why Choose DomaDAO?</h5>
                  <ul className="space-y-3 text-sm font-geist text-gray-600 dark:text-gray-300">
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                      <span>Low entry barrier ($10+)</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0"></div>
                      <span>Decentralized governance</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                      <span>Revenue sharing</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0"></div>
                      <span>Multi-chain support</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}