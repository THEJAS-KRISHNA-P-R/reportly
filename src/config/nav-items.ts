import {
  LayoutDashboard,
  Users,
  BarChart3 as BarChart,
  Settings,
  FileText,
} from "lucide-react"

export const GLOBAL_NAV_ITEMS = [
  {
    label: "Overview",
    href: "/overview",
    icon: LayoutDashboard,
  },
]

export const CLIENT_NAV_ITEMS = [
  {
    label: "Overview",
    href: "/client",
    icon: LayoutDashboard,
  },
  {
    label: "Reports",
    href: "/client/reports",
    icon: FileText,
  },
  {
    label: "Team",
    href: "/client/team",
    icon: Users,
  },
  {
    label: "Usage",
    href: "/client/usage",
    icon: BarChart,
  },
  {
    label: "Settings",
    href: "/client/settings",
    icon: Settings,
  },
]
