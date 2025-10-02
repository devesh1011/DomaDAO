"use client"

import { NavBar } from "@/components/ui/tubelight-navbar"
import { Home, TrendingUp, Users, Settings, Wallet, Vote } from "lucide-react"

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
  {
    name: "Settings",
    url: "/dashboard", // Use dashboard with settings view
    icon: Settings,
  },
]

export function NavigationBar() {
  return <NavBar items={navItems} />
}