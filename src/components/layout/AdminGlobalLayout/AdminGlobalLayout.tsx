// Admin-global shell for the top level of /admin — the view an admin lands
// on. Same top panel and left-panel language as the customer app, but a
// deliberately minimal nav: Overview (all customer profiles as cards) and
// All reports (every issue across every customer). No map, no service tree,
// no single-customer scope — those belong to the per-customer scoped view
// reached by opening a customer card.
//
// Wrapped in AdminCustomersProvider so the pages under it share one customer
// roster (names for the reports table, counts for the cards).
import { NavLink, Outlet } from "react-router-dom";
import { AdminCustomersProvider } from "@/context/AdminCustomersContext";
import { TopPanel } from "@/components/layout/TopPanel/TopPanel";
import { AppIcon } from "@/components/ui/AppIcon/AppIcon";
import type { IconName } from "@/lib/icons";
import shell from "@/components/layout/PortalShell/PortalShell.module.css";
import sidebar from "@/components/layout/PortalShell/Sidebar.module.css";

function AdminNavRow({
  to,
  end,
  icon,
  label,
}: {
  to: string;
  end?: boolean;
  icon: IconName;
  label: string;
}) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          `${sidebar.row}${isActive ? ` ${sidebar.rowActive}` : ""}`
        }
      >
        <span className={sidebar.rowIcon} aria-hidden="true">
          <AppIcon name={icon} size={20} />
        </span>
        <span className={sidebar.rowLabel}>{label}</span>
      </NavLink>
    </li>
  );
}

export function AdminGlobalLayout() {
  return (
    <AdminCustomersProvider>
      <div className={shell.layout}>
        <TopPanel />
        <div className={shell.shell}>
          <aside className={sidebar.sidebar} aria-label="Admin navigation">
            <nav className={sidebar.body} aria-label="Admin">
              <p className={sidebar.sectionLabel}>Administration</p>
              <ul className={sidebar.section}>
                <AdminNavRow to="/admin" end icon="desktop" label="Overview" />
                <AdminNavRow
                  to="/admin/reports"
                  icon="file"
                  label="All reports"
                />
              </ul>
            </nav>
          </aside>

          <div className={shell.contentCol}>
            <main className={shell.main}>
              <div className={shell.contentInner}>
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </div>
    </AdminCustomersProvider>
  );
}
