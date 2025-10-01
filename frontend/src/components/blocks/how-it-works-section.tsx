import { cn } from "@/lib/utils";
import {
  IconSearch,
  IconCoin,
  IconChartBar,
} from "@tabler/icons-react";

export function HowItWorksSection() {
  const features = [
    {
      title: "Discover",
      description: "Browse premium domain pools and find investment opportunities that match your interests.",
      icon: <IconSearch className="w-8 h-8" />,
    },
    {
      title: "Invest",
      description: "Buy fractional shares in domain pools with as little as $10, diversifying your portfolio.",
      icon: <IconCoin className="w-8 h-8" />,
    },
    {
      title: "Earn",
      description: "Get revenue from domain monetization, sales, and appreciation through passive income.",
      icon: <IconChartBar className="w-8 h-8" />,
    },
  ];

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute top-0 z-[0] h-full w-full bg-purple-950/10 dark:bg-purple-950/10 bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-geist font-bold text-gray-900 dark:text-white mb-4">
            How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">Works</span>
          </h2>
          <p className="text-lg font-geist text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Three simple steps to start investing in premium domains
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 relative z-10 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Feature key={feature.title} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col py-10 relative group/feature dark:border-neutral-800",
        index < 2 && "md:border-r dark:border-neutral-800",
        "border-b md:border-b-0 dark:border-neutral-800"
      )}
    >
      <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-purple-500/5 dark:from-purple-500/10 to-transparent pointer-events-none" />
      <div className="mb-4 relative z-10 px-10 text-purple-600 dark:text-purple-400">
        {icon}
      </div>
      <div className="text-xl font-geist font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-purple-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
          {title}
        </span>
      </div>
      <p className="text-sm font-geist text-neutral-600 dark:text-neutral-300 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};