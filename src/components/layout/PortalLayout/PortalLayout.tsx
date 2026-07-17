// Protected portal layout shared by all /portal routes:
// portal navigation, sign-out action, and the routed page content.
import { Outlet, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header/Header";
import { portalNavLinks } from "@/config/navigation";
import { useAuth } from "@/hooks/useAuth";
import styles from "./PortalLayout.module.css";

export function PortalLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/", { replace: true });
  }

  return (
    <div className={styles.layout}>
      <Header
        links={portalNavLinks}
        homeTo="/portal"
        actions={
          <button
            type="button"
            className={styles.signOut}
            onClick={() => void handleSignOut()}
          >
            Sign out
          </button>
        }
      />
      <main className={`container ${styles.main}`}>
        <Outlet />
      </main>
    </div>
  );
}
