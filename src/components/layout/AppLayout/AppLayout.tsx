// Single site-wide layout: one TopPanel for every page. The full footer
// (link columns + legal) renders on the homepage only.
import { Outlet, useLocation } from "react-router-dom";
import { TopPanel } from "@/components/layout/TopPanel/TopPanel";
import { Footer } from "@/components/layout/Footer/Footer";
import styles from "./AppLayout.module.css";

export function AppLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <div className={styles.layout}>
      <TopPanel />
      <main className={styles.main}>
        <Outlet />
      </main>
      {isHome ? <Footer /> : null}
    </div>
  );
}
