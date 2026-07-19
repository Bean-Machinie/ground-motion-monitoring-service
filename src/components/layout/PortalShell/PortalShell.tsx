// Two-column app shell for every signed-in route: persistent sidebar
// (brand, primary nav, site tree, library, footer) plus a content column.
// Public/marketing routes never use this — they keep the top-bar layout.
//
// Renders <Outlet /> when used as a layout route, or `children` when a
// dispatcher (RootPage, ServiceRoute) mounts it directly.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute/ProtectedRoute";
import { PortalDataProvider } from "@/context/PortalDataContext";
import { TopPanel } from "@/components/layout/TopPanel/TopPanel";
import { Sidebar } from "@/components/layout/PortalShell/Sidebar";
import {
  Breadcrumbs,
  type Crumb,
} from "@/components/ui/Breadcrumbs/Breadcrumbs";
import styles from "./PortalShell.module.css";

/* ------------------------- Shell chrome context ------------------------ */

interface PortalChrome {
  /** Sidebar collapsed to the 56px icon rail (wide viewports only). */
  collapsed: boolean;
  toggleCollapsed: () => void;
  /** Below 1024px the sidebar is an off-canvas drawer. */
  isNarrow: boolean;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  /** Breadcrumb trail shown in the fixed bar under the top panel. */
  setCrumbs: (crumbs: Crumb[]) => void;
}

const PortalChromeContext = createContext<PortalChrome | null>(null);

export function usePortalChrome(): PortalChrome {
  const ctx = useContext(PortalChromeContext);
  if (!ctx) {
    throw new Error("usePortalChrome must be used inside PortalShell");
  }
  return ctx;
}

/** Pages call this to put their breadcrumb trail into the fixed bar
    under the top panel (it stays put while the content scrolls). */
export function usePortalCrumbs(crumbs: Crumb[]) {
  const { setCrumbs } = usePortalChrome();
  // Content-keyed dependency: crumb arrays are rebuilt every render.
  const key = JSON.stringify(crumbs);
  useEffect(() => {
    setCrumbs(crumbs);
    return () => setCrumbs([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setCrumbs]);
}

const COLLAPSED_KEY = "heliosyn.sidebar.collapsed";

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

/* -------------------------------- Shell -------------------------------- */

export function PortalShell({ children }: { children?: ReactNode }) {
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [isNarrow, setIsNarrow] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);

  // Track the 1024px breakpoint: below it the sidebar is a drawer.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Navigation closes the drawer.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* private mode — collapse just won't persist */
      }
      return next;
    });
  }, []);

  const chrome: PortalChrome = {
    collapsed: !isNarrow && collapsed,
    toggleCollapsed,
    isNarrow,
    drawerOpen,
    setDrawerOpen,
    setCrumbs,
  };

  return (
    <ProtectedRoute>
      <PortalDataProvider>
        <PortalChromeContext.Provider value={chrome}>
          {/* Top panel stays part of the signed-in app; the sidebar +
              content columns live below it. */}
          <div className={styles.layout}>
            <a href="#portal-main" className={styles.skipLink}>
              Skip to content
            </a>

            <TopPanel />

            <div className={styles.shell}>
              <Sidebar />

              {/* Scrim behind the off-canvas drawer. */}
              {isNarrow && drawerOpen ? (
                <div
                  className={styles.overlay}
                  aria-hidden="true"
                  onClick={() => setDrawerOpen(false)}
                />
              ) : null}

              <div className={styles.contentCol}>
                {/* Narrow viewports only: slim bar with the hamburger that
                    opens the drawer. Never rendered alongside the visible
                    sidebar — CSS hides it at ≥1024px. */}
                <div className={styles.mobileBar}>
                  <button
                    type="button"
                    className={styles.hamburger}
                    aria-label="Open navigation"
                    aria-expanded={drawerOpen}
                    onClick={() => setDrawerOpen(true)}
                  >
                    <span aria-hidden="true" />
                    <span aria-hidden="true" />
                    <span aria-hidden="true" />
                  </button>
                  <span className={styles.mobileBarLabel}>Menu</span>
                </div>

                {/* Fixed context line under the top panel: breadcrumb on
                    the left, a slot on the right for future fixed
                    controls. Stays put while the content scrolls. */}
                <div className={styles.crumbBar}>
                  {crumbs.length > 0 ? <Breadcrumbs items={crumbs} /> : <span />}
                  <div className={styles.crumbBarEnd} />
                </div>

                <main id="portal-main" className={styles.main} tabIndex={-1}>
                  <div className={styles.contentInner}>
                    {children ?? <Outlet />}
                  </div>
                </main>
              </div>
            </div>
          </div>
        </PortalChromeContext.Provider>
      </PortalDataProvider>
    </ProtectedRoute>
  );
}
