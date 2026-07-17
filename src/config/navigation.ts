// Navigation link definitions for public and portal layouts.

export interface NavLinkItem {
  label: string;
  to: string;
  /** Match the route exactly when highlighting the active link. */
  end?: boolean;
}

export const publicNavLinks: NavLinkItem[] = [
  { label: "Home", to: "/", end: true },
  { label: "Sign in", to: "/sign-in" },
];

export const portalNavLinks: NavLinkItem[] = [
  { label: "Dashboard", to: "/portal", end: true },
  { label: "Projects", to: "/portal/projects" },
  { label: "Account", to: "/portal/account" },
];
