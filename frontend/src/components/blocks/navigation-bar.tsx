"use client"

import { NavBar } from "@/components/ui/tubelight-navbar"
import { Home, TrendingUp, Users, Settings, Wallet } from "lucide-react"

const navItems = [
  {
    name: "Home",
    url: "/",
    icon: Home,
  },
  {
    name: "Explore",
    url: "/explore",
    icon: TrendingUp,
  },
  {
    name: "Pools",
    url: "/pools",
    icon: Users,
  },
  {
    name: "Portfolio",
    url: "/portfolio",
    icon: Wallet,
  },
  {
    name: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function NavigationBar() {
  return <NavBar items={navItems} />
}