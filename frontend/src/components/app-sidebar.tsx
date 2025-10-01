"use client"

import * as React from "react"
import {
  Home,
  Search,
  Globe,
  PieChart,
  Vote,
  Settings,
  Wallet
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "dev.eth",
    email: "0x742d...a9f2",
    avatar: "/avatars/user.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      key: "dashboard",
      icon: Home,
      isActive: true,
    },
    {
      title: "Explore Pools",
      key: "pools",
      icon: Search,
    },
    {
      title: "Domain Search",
      key: "domains",
      icon: Globe,
    },
    {
      title: "My Portfolio",
      key: "portfolio",
      icon: PieChart,
    },
    {
      title: "Governance",
      key: "governance",
      icon: Vote,
    },
    {
      title: "Settings",
      key: "settings",
      icon: Settings,
    },
  ],
}

export function AppSidebar({ onNavigate, ...props }: React.ComponentProps<typeof Sidebar> & { onNavigate?: (view: string) => void }) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <Globe className="!size-5 text-purple-600" />
                <span className="text-base font-semibold">DomaDAO</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {data.navMain.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                isActive={item.isActive}
                onClick={() => onNavigate?.(item.key)}
                className="cursor-pointer"
              >
                <item.icon className="size-4" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[slot=sidebar-menu-button]:!p-2"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-purple-100 text-purple-600">
                  {data.user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{data.user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {data.user.email}
                </span>
              </div>
              <Wallet className="ml-auto size-4" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
