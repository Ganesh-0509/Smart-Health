import {
  LayoutDashboard,
  Boxes,
  LineChart,
  GitCompareArrows,
  Bell,
  FileBarChart,
  BedDouble,
  Users,
  Stethoscope,
  FlaskConical,
  Map,
  Upload,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { DictKey } from "@/lib/i18n";
import type { Role } from "@/lib/types";
import { canAccess } from "@/lib/roles";

export interface NavItem {
  href: string;
  labelKey: DictKey;
  icon: LucideIcon;
}
export interface NavGroup {
  titleKey: DictKey;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    titleKey: "nav_group_planning",
    items: [
      { href: "/dashboard", labelKey: "nav_dashboard", icon: LayoutDashboard },
      { href: "/inventory", labelKey: "nav_inventory", icon: Boxes },
      { href: "/ingest", labelKey: "nav_ingest", icon: Upload },
      { href: "/forecast", labelKey: "nav_forecast", icon: LineChart },
      { href: "/recommendations", labelKey: "nav_recommendations", icon: GitCompareArrows },
      { href: "/alerts", labelKey: "nav_alerts", icon: Bell },
      { href: "/reports", labelKey: "nav_reports", icon: FileBarChart },
    ],
  },
  {
    titleKey: "nav_group_operations",
    items: [
      { href: "/beds", labelKey: "nav_beds", icon: BedDouble },
      { href: "/footfall", labelKey: "nav_footfall", icon: Users },
      { href: "/doctors", labelKey: "nav_doctors", icon: Stethoscope },
      { href: "/tests", labelKey: "nav_tests", icon: FlaskConical },
    ],
  },
  {
    titleKey: "nav_group_intelligence",
    items: [
      { href: "/district", labelKey: "nav_district", icon: Map },
      { href: "/assistant", labelKey: "nav_assistant", icon: Sparkles },
    ],
  },
];

// The nav groups visible to a given role: each group keeps only the items the
// role can access, and groups that end up empty are dropped entirely.
export function navGroupsForRole(role: Role): NavGroup[] {
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccess(role, item.href)),
    }))
    .filter((group) => group.items.length > 0);
}
