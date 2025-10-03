"use client";

import { NavBar } from "@/components/ui/tubelight-navbar";
import { Home, TrendingUp, Users, Wallet, Vote } from "lucide-react";

const navItems = [
  {
    name: "Home",
    url: "/",
    icon: Home,
  },
  {
    name: "Features",
    url: "#features",
    icon: TrendingUp,
  },
  {
    name: "How It Works",
    url: "#how-it-works",
    icon: Users,
  },
  {
    name: "Get Started",
    url: "#get-started",
    icon: Vote,
  },
];

export function NavigationBar() {
  return <NavBar items={navItems} />;
}
