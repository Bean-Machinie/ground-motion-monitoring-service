// Navigation configuration for the top panel.
// Items are either plain links or dropdown menus (NAV_ITEMS pattern).

export type NavIconName =
  | "monitor"
  | "steps"
  | "user"
  | "sign-out"
  | "projects";

export type NavAction = "sign-out";

export interface NavMenuEntry {
  label: string;
  /** Route (or route + hash) to navigate to. */
  to?: string;
  /** App-level action handled by the layout (e.g. sign out). */
  action?: NavAction;
  icon?: NavIconName;
  /** Draw a thin divider below this entry. */
  dividerBelow?: boolean;
}

export type NavItem =
  | { kind: "link"; label: string; to: string; end?: boolean }
  | { kind: "menu"; id: string; label: string; items: NavMenuEntry[] };

/** Main menu for public pages. */
export const PUBLIC_NAV_ITEMS: NavItem[] = [
  { kind: "link", label: "Home", to: "/", end: true },
  {
    kind: "menu",
    id: "services",
    label: "Services",
    items: [
      {
        label: "Monitoring & reporting",
        to: "/#overview-heading",
        icon: "monitor",
      },
      {
        label: "How it works",
        to: "/#process-heading",
        icon: "steps",
        dividerBelow: true,
      },
      { label: "Request access", to: "/sign-up", icon: "user" },
    ],
  },
];

/** Main menu for the authenticated portal. */
export const PORTAL_NAV_ITEMS: NavItem[] = [
  { kind: "link", label: "Dashboard", to: "/portal", end: true },
  { kind: "link", label: "Projects", to: "/portal/projects" },
  {
    kind: "menu",
    id: "account",
    label: "Account",
    items: [
      {
        label: "Account settings",
        to: "/portal/account",
        icon: "user",
        dividerBelow: true,
      },
      { label: "Sign out", action: "sign-out", icon: "sign-out" },
    ],
  },
];
