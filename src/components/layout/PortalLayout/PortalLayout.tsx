// App shell for signed-in views (Untitled UI dashboard-style):
// fixed left sidebar with primary nav, explore links, and a user card;
// scrollable main content on the right. On small screens the sidebar
// becomes an off-canvas drawer behind a slim top bar.
import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { site } from "@/config/site";
import { AppIcon } from "@/components/ui/AppIcon/AppIcon";
import type { IconName } from "@/lib/icons";
import logoLong from "@/assets/logo/Black/HELIOSYN_Long_Black.png";
import styles from "./PortalLayout.module.css";

interface PortalNavEntry {
  label: string;
  to: string;
  icon: IconName;
  /** Also highlight when the current path matches one of these. */
  aliases?: string[];
}

const PRIMARY_NAV: PortalNavEntry[] = [
  { label: "Dashboard", to: "/", icon: "desktop", aliases: ["/portal"] },
  { label: "Projects", to: "/portal/projects", icon: "box" },
  { label: "Account", to: "/portal/account", icon: "profile" },
];

const EXPLORE_NAV: PortalNavEntry[] = [
  { label: "Website", to: "/home", icon: "lighthouse" },
  { label: "InSAR Technology", to: "/technology", icon: "satellite" },
  { label: "Case Studies", to: "/case-studies", icon: "push-pin" },
];

/** Initials for the avatar, derived from the profile name or email. */
function getInitials(name: string | null | undefined, email: string): string {
  const source = name?.trim();
  if (source) {
    const parts = source.split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
    return (first + last).toUpperCase();
  }
  return (email[0] ?? "?").toUpperCase();
}

function SidebarNav({ entries }: { entries: PortalNavEntry[] }) {
  const { pathname } = useLocation();
  return (
    <ul className={styles.navList}>
      {entries.map((entry) => {
        const isActive =
          pathname === entry.to ||
          (entry.aliases?.includes(pathname) ?? false) ||
          (entry.to !== "/" &&
            entry.to !== "/home" &&
            pathname.startsWith(`${entry.to}/`));
        return (
          <li key={entry.to}>
            <NavLink
              to={entry.to}
              className={`${styles.navEntry} ${
                isActive ? styles.navEntryActive : ""
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className={styles.navIcon} aria-hidden="true">
                <AppIcon name={entry.icon} size={20} />
              </span>
              {entry.label}
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
}

export function PortalLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Navigating closes the mobile drawer.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Escape closes the mobile drawer.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  const email = profile?.email ?? user?.email ?? "";
  const displayName = profile?.full_name || email;
  const initials = getInitials(profile?.full_name, email);

  function handleSignOut() {
    void signOut().then(() => navigate("/", { replace: true }));
  }

  const sidebar = (
    <div className={styles.sidebarInner}>
      <Link to="/" className={styles.brand} aria-label={site.name}>
        <img
          src={logoLong}
          alt={`${site.companyName} — ${site.name}`}
          className={styles.brandLogo}
        />
      </Link>

      <nav className={styles.nav} aria-label="Portal navigation">
        <SidebarNav entries={PRIMARY_NAV} />

        {profile?.role === "admin" ? (
          <SidebarNav
            entries={[
              { label: "Administration", to: "/admin", icon: "shield-lock" },
            ]}
          />
        ) : null}
      </nav>

      <div className={styles.sidebarFooter}>
        <p className={styles.navGroupLabel}>Explore</p>
        <SidebarNav entries={EXPLORE_NAV} />

        <div className={styles.userCard}>
          <span className={styles.avatar} aria-hidden="true">
            {initials}
          </span>
          <span className={styles.userMeta}>
            <span className={styles.userName} title={displayName}>
              {displayName}
            </span>
            <span className={styles.userEmail} title={email}>
              {email}
            </span>
          </span>
          <button
            type="button"
            className={styles.signOutButton}
            onClick={handleSignOut}
            aria-label="Sign out"
            title="Sign out"
          >
            <AppIcon name="logout" size={20} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.shell}>
      {/* Slim top bar, visible on small screens only. */}
      <header className={styles.mobileBar}>
        <button
          type="button"
          className={styles.menuButton}
          aria-label={drawerOpen ? "Close menu" : "Open menu"}
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen((o) => !o)}
        >
          <span className={styles.menuIconBars} aria-hidden="true" />
        </button>
        <Link to="/" className={styles.mobileBrand} aria-label={site.name}>
          <img
            src={logoLong}
            alt={`${site.companyName} — ${site.name}`}
            className={styles.brandLogo}
          />
        </Link>
        <span className={styles.mobileAvatar} aria-hidden="true">
          {initials}
        </span>
      </header>

      <aside
        className={`${styles.sidebar} ${
          drawerOpen ? styles.sidebarOpen : ""
        }`}
      >
        {sidebar}
      </aside>

      {drawerOpen ? (
        <button
          type="button"
          className={styles.scrim}
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}

      <main className={styles.main}>
        <div className={styles.mainInner}>{children}</div>
      </main>
    </div>
  );
}
