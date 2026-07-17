// Navigation configuration for the top panel.
// One unified menu for the whole site: signed-out visitors clicking a
// portal link are redirected to sign-in by the route guard.
import type { IconName } from "@/lib/icons";

export interface NavMenuEntry {
  label: string;
  /** Route (or route + hash) to navigate to. */
  to: string;
  icon?: IconName;
  /** Draw a thin divider below this entry. */
  dividerBelow?: boolean;
}

export type NavItem =
  | { kind: "link"; label: string; to: string; end?: boolean }
  | { kind: "menu"; id: string; label: string; items: NavMenuEntry[] };

/** Single main menu shared across the entire site. */
export const NAV_ITEMS: NavItem[] = [
  {
    kind: "menu",
    id: "services",
    label: "Services",
    items: [
      {
        label: "Monitoring & reporting",
        to: "/#overview-heading",
        icon: "satellite",
      },
      {
        label: "How it works",
        to: "/#process-heading",
        icon: "graph",
        dividerBelow: true,
      },
      { label: "Request access", to: "/sign-up", icon: "user-group" },
    ],
  },
  { kind: "link", label: "Dashboard", to: "/portal", end: true },
  { kind: "link", label: "Projects", to: "/portal/projects" },
];
