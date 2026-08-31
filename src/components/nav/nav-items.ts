import {
  Home,
  MessageCircle,
  BookOpen,
  Target,
  TrendingUp,
  HelpCircle,
  ScrollText,
  Brain,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/talk", label: "Talk", icon: MessageCircle },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/reflect", label: "Reflect", icon: TrendingUp },
  { href: "/confused", label: "I'm Confused", icon: HelpCircle },
  { href: "/story", label: "My Story", icon: ScrollText },
  { href: "/memory", label: "Memory", icon: Brain },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Primary items shown in the mobile bottom nav (kept short so it fits).
export const MOBILE_NAV_ITEMS: NavItem[] = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
  NAV_ITEMS[3],
  NAV_ITEMS[4],
];
