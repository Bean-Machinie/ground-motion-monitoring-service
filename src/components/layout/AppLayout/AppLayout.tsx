// Marketing-site layout: TopPanel header for public pages. The full footer
// (link columns + legal) renders on the marketing homepage only. Signed-in
// views use the PortalLayout sidebar shell instead of this layout.
// Renders children when given (RootPage), otherwise the route Outlet.
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
      <main className={styles.main}>{children ?? <Outlet />}</main>
      {showFooter ? <Footer /> : null}
    </div>
  );
}
