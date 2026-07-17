// Protected portal layout shared by all /portal routes: top panel with
// portal navigation (sign-out lives in the Account dropdown) and content.
import { Outlet, useNavigate } from "react-router-dom";
import { TopPanel } from "@/components/layout/TopPanel/TopPanel";
import { PORTAL_NAV_ITEMS, type NavAction } from "@/config/navigation";
import { useAuth } from "@/hooks/useAuth";
import styles from "./PortalLayout.module.css";

export function PortalLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  function handleAction(action: NavAction) {
    if (action === "sign-out") {
      void signOut().then(() => navigate("/", { replace: true }));
    }
  }

  return (
    <div className={styles.layout}>
      <TopPanel navItems={PORTAL_NAV_ITEMS} onAction={handleAction} />
      <main className={`container ${styles.main}`}>
        <Outlet />
      </main>
    </div>
  );
}
