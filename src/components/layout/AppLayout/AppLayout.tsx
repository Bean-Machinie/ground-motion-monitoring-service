// Layout for public/marketing pages: one TopPanel for every page. The
// full footer (link columns + legal) renders on the marketing homepage
// only. Signed-in app routes use PortalShell instead — never this.
// Renders <Outlet /> as a layout route, or `children` when a dispatcher
// (RootPage, ServiceRoute) mounts it directly.
import type { ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { TopPanel } from "@/components/layout/TopPanel/TopPanel";
import { Footer } from "@/components/layout/Footer/Footer";
import styles from "./AppLayout.module.css";

export function AppLayout({ children }: { children?: ReactNode }) {
  const { pathname } = useLocation();
  const { user, loading } = useAuth();
  // Footer belongs to the marketing homepage: "/" when signed out, and
  // "/home" (the Explore -> Home page) for everyone.
  const showFooter =
    pathname === "/home" || (pathname === "/" && !loading && !user);

  return (
    <div className={styles.layout}>
      <TopPanel />
      {/* Scrolling happens below the header, so the scrollbar never runs
          over the top panel and its gutter is always reserved. */}
      <div className={styles.scroller}>
        <main className={styles.main}>{children ?? <Outlet />}</main>
        {showFooter ? <Footer /> : null}
      </div>
    </div>
  );
}
