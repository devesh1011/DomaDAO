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
    name: "Dashboard",
    url: "/dashboard",
    icon: TrendingUp,
  },
  {
    name: "Pools",
    url: "/pools",
    icon: Users,
  },
  {
    name: "Governance",
    url: "/governance",
    icon: Vote,
  },
];

export function NavigationBar() {
  return <NavBar items={navItems} />;
}
