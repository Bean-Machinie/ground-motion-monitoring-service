// Persistent portal sidebar: brand, primary nav (Workspace / Needs
// attention), the site tree, library lenses, and a footer block with the
// primary action, settings, the account menu, and the collapse toggle.
// Collapses to a 56px icon rail on wide viewports; becomes an off-canvas
// drawer below 1024px.
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { usePortalData } from "@/context/PortalDataContext";
import { usePortalChrome } from "@/components/layout/PortalShell/PortalShell";
import { SiteTree } from "@/components/layout/PortalShell/SiteTree";
import { AppIcon } from "@/components/ui/AppIcon/AppIcon";
import { site as siteConfig } from "@/config/site";
import { EXPLORE_MENU_ENTRIES } from "@/config/navigation";
import type { IconName } from "@/lib/icons";
import styles from "./Sidebar.module.css";

/* ------------------------------ Nav row -------------------------------- */

interface NavRowProps {
  to: string;
  end?: boolean;
  icon: IconName;
  label: string;
  badge?: number;
  /** Gold treatment: reserved for the shell's primary action. */
  primary?: boolean;
  collapsed: boolean;
}

function NavRow({ to, end, icon, label, badge, primary, collapsed }: NavRowProps) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        title={collapsed ? label : undefined}
        className={({ isActive }) =>
          [
            styles.row,
            primary ? styles.rowPrimary : "",
            isActive && !primary ? styles.rowActive : "",
          ]
            .filter(Boolean)
            .join(" ")
        }
      >
        <span className={styles.rowIcon} aria-hidden="true">
          <AppIcon name={icon} size={18} />
        </span>
        <span className={styles.rowLabel}>{label}</span>
        {badge !== undefined && badge > 0 ? (
          <span className={styles.badge} aria-label={`${badge} items`}>
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </NavLink>
    </li>
  );
}

/* ---------------------------- Account menu ----------------------------- */

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

/** Footer account row: opens an upward popover holding the account
    actions and the Explore/marketing links moved out of the main nav. */
function AccountMenu({ collapsed }: { collapsed: boolean }) {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (root && event.target instanceof Node && !root.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (!user) return null;

  const email = profile?.email ?? user.email ?? "";
  const displayName = profile?.full_name || email;
  const initials = getInitials(profile?.full_name, email);

  function entry(label: string, icon: IconName, onSelect: () => void): ReactNode {
    return (
      <button
        type="button"
        role="menuitem"
        className={styles.menuEntry}
        onClick={() => {
          setOpen(false);
          onSelect();
        }}
      >
        <span className={styles.menuIcon} aria-hidden="true">
          <AppIcon name={icon} size={18} />
        </span>
        {label}
      </button>
    );
  }

  return (
    <div className={styles.accountRoot} ref={rootRef}>
      <button
        type="button"
        className={styles.accountTrigger}
        aria-haspopup="menu"
        aria-expanded={open}
        title={collapsed ? displayName : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        <span className={styles.avatar} aria-hidden="true">
          {initials}
        </span>
        <span className={styles.accountName}>{displayName}</span>
      </button>

      {open ? (
        <div
          className={styles.menu}
          role="menu"
          aria-label="Account"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        >
          <div className={styles.menuHeader}>
            <span className={styles.menuName}>{displayName}</span>
            <span className={styles.menuEmail}>{email}</span>
          </div>

          {entry("Account settings", "settings", () => navigate("/account"))}
          {profile?.role === "admin"
            ? entry("Administration", "shield-lock", () => navigate("/admin"))
            : null}

          <div className={styles.menuDivider} role="separator" />
          <p className={styles.menuSectionLabel}>Explore {siteConfig.companyName}</p>
          {EXPLORE_MENU_ENTRIES.map((item) =>
            entry(item.label, item.icon ?? "globe", () => navigate(item.to)),
          )}

          <div className={styles.menuDivider} role="separator" />
          {entry("Sign out", "logout", () => {
            void signOut().then(() => navigate("/", { replace: true }));
          })}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------- Sidebar ------------------------------- */

export function Sidebar() {
  const { collapsed, toggleCollapsed, isNarrow, drawerOpen, setDrawerOpen } =
    usePortalChrome();
  const { attention } = usePortalData();

  const className = [
    styles.sidebar,
    collapsed ? styles.collapsed : "",
    isNarrow ? styles.drawer : "",
    isNarrow && drawerOpen ? styles.drawerOpen : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside className={className} aria-label="Portal navigation">
      {/* No brand here — the logo already lives in the top panel. The
          drawer just gets a close row. */}
      {isNarrow ? (
        <div className={styles.drawerHead}>
          <span className={styles.drawerHeadLabel}>Navigation</span>
          <button
            type="button"
            className={styles.drawerClose}
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
          >
            <AppIcon name="cross" size={16} />
          </button>
        </div>
      ) : null}

      <nav className={styles.scrollArea} aria-label="Primary">
        <ul className={styles.section}>
          <NavRow
            to="/"
            end
            icon="desktop"
            label="Workspace"
            collapsed={collapsed}
          />
          <NavRow
            to="/attention"
            icon="warning"
            label="Needs attention"
            badge={attention.count}
            collapsed={collapsed}
          />
        </ul>

        {!collapsed ? (
          <p className={styles.sectionLabel} id="sidebar-sites-label">
            Your sites
          </p>
        ) : null}
        <SiteTree collapsed={collapsed} labelledBy="sidebar-sites-label" />

        {!collapsed ? <p className={styles.sectionLabel}>Library</p> : null}
        <ul className={styles.section}>
          <NavRow
            to="/reports"
            icon="file"
            label="All reports"
            collapsed={collapsed}
          />
          <NavRow to="/map" icon="globe" label="Map view" collapsed={collapsed} />
        </ul>
      </nav>

      <div className={styles.footer}>
        <ul className={styles.section}>
          <NavRow
            to="/requests/new"
            icon="add"
            label="New request"
            primary
            collapsed={collapsed}
          />
          <NavRow
            to="/account"
            icon="settings"
            label="Settings"
            collapsed={collapsed}
          />
        </ul>

        <AccountMenu collapsed={collapsed} />

        {!isNarrow ? (
          <button
            type="button"
            className={styles.collapseToggle}
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span
              className={`${styles.collapseChevron} ${
                collapsed ? styles.collapseChevronFlipped : ""
              }`}
              aria-hidden="true"
            />
            <span className={styles.rowLabel}>Collapse</span>
          </button>
        ) : null}
      </div>
    </aside>
  );
}
