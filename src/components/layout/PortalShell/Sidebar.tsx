// Persistent portal sidebar. Top to bottom: New request (separated by a
// hairline), primary nav (Workspace / Needs attention), the services
// tree in its own scroll area (like a chat list — it scrolls, the rest
// stays put), Library, and a footer with just the collapse toggle. No
// brand (top panel has it), no profile (top panel has it), no Settings
// (the profile menu has it).
//
// Collapse: the width animates while every icon keeps its exact
// position — labels only fade. Nothing shifts, scales, or re-centers.
import { NavLink } from "react-router-dom";
import { usePortalData } from "@/context/PortalDataContext";
import { usePortalChrome } from "@/components/layout/PortalShell/PortalShell";
import { ServiceTree } from "@/components/layout/PortalShell/ServiceTree";
import { AppIcon } from "@/components/ui/AppIcon/AppIcon";
import type { IconName } from "@/lib/icons";
import styles from "./Sidebar.module.css";

/* ------------------------------ Nav row -------------------------------- */

interface NavRowProps {
  to: string;
  end?: boolean;
  icon: IconName;
  label: string;
  badge?: number;
  collapsed: boolean;
}

function NavRow({ to, end, icon, label, badge, collapsed }: NavRowProps) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        title={collapsed ? label : undefined}
        className={({ isActive }) =>
          `${styles.row}${isActive ? ` ${styles.rowActive}` : ""}`
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

/* -------------------------- Collapse toggle icon ------------------------ */

/** Standard panel-left icon (lucide-style): a panel with an arrow that
    points the way the sidebar will move. */
function PanelToggleIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="9" y1="4" x2="9" y2="20" />
      {collapsed ? (
        /* PanelLeftOpen: arrow pointing right */
        <path d="m14 9 3 3-3 3" />
      ) : (
        /* PanelLeftClose: arrow pointing left */
        <path d="m17 9-3 3 3 3" />
      )}
    </svg>
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

      <nav className={styles.body} aria-label="Primary">
        {/* Primary action first, cleanly separated from the places below. */}
        <ul className={styles.section}>
          <NavRow
            to="/requests/new"
            icon="add"
            label="New request"
            collapsed={collapsed}
          />
        </ul>

        <div className={styles.divider} role="separator" />

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

        <ul className={styles.section}>
          {/* `end`: individual report pages belong to their service in
              the tree below — the library row only lights up on itself. */}
          <NavRow
            to="/reports"
            end
            icon="file"
            label="All reports"
            collapsed={collapsed}
          />
          <NavRow to="/map" icon="globe" label="Map view" collapsed={collapsed} />
        </ul>

        {/* The tree scrolls on its own (chat-list style); everything else
            in the sidebar stays anchored. Group labels (MONITORING /
            SCREENINGS) live inside the tree and scroll with it. */}
        <div className={styles.treeScroll}>
          <ServiceTree collapsed={collapsed} />
        </div>
      </nav>

      {!isNarrow ? (
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.collapseToggle}
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className={styles.rowIcon} aria-hidden="true">
              <PanelToggleIcon collapsed={collapsed} />
            </span>
          </button>
        </div>
      ) : null}
    </aside>
  );
}
