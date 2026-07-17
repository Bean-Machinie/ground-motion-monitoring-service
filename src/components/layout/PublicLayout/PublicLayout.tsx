// Layout for public pages: top panel with public navigation, content, footer.
import { Outlet } from "react-router-dom";
import { TopPanel } from "@/components/layout/TopPanel/TopPanel";
import { Footer } from "@/components/layout/Footer/Footer";
import { PUBLIC_NAV_ITEMS, type NavItem } from "@/config/navigation";
import { useAuth } from "@/hooks/useAuth";
import styles from "./PublicLayout.module.css";

export function PublicLayout() {
  const { user } = useAuth();

  const navItems: NavItem[] = [
    ...PUBLIC_NAV_ITEMS,
    user
      ? { kind: "link", label: "Portal", to: "/portal" }
      : { kind: "link", label: "Sign in", to: "/sign-in" },
  ];

  return (
    <div className={styles.layout}>
      <TopPanel navItems={navItems} />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
