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

/** Single main menu shared across the entire site.
    All entries navigate to real pages, except Contact, which scrolls to
    the contact block (id="contact") in the shared footer. */
export const NAV_ITEMS: NavItem[] = [
  {
    kind: "menu",
    id: "services",
    label: "Services",
    items: [
      {
        label: "View Services",
        to: "/services",
        icon: "box",
        dividerBelow: true,
      },
      { label: "Screening", to: "/services/screening", icon: "graph" },
      { label: "Monitoring", to: "/services/monitoring", icon: "desktop" },
      {
        label: "Research & Collaboration",
        to: "/services/research-collaboration",
        icon: "user-group",
      },
    ],
  },
  {
    kind: "menu",
    id: "explore",
    label: "Explore",
    items: [
      { label: "InSAR Technology", to: "/technology", icon: "satellite" },
      { label: "Industries", to: "/industries", icon: "globe" },
      { label: "Case Studies", to: "/case-studies", icon: "push-pin" },
    ],
  },
  { kind: "link", label: "About", to: "/about" },
  { kind: "link", label: "Contact", to: "/#contact" },
];
