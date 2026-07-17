// Single site-wide layout: one TopPanel and Footer for every page, so the
// experience stays consistent whether or not the user is signed in.
import { Outlet } from "react-router-dom";
import { TopPanel } from "@/components/layout/TopPanel/TopPanel";
import { Footer } from "@/components/layout/Footer/Footer";
import styles from "./AppLayout.module.css";

export function AppLayout() {
  return (
    <div className={styles.layout}>
      <TopPanel />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
