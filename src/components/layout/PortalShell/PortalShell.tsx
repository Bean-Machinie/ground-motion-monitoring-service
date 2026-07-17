// Shell for /portal routes: applies the auth guard and the shared
// content container. The header/footer come from the site-wide AppLayout.
import { Outlet } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute/ProtectedRoute";
import styles from "./PortalShell.module.css";

export function PortalShell() {
  return (
    <ProtectedRoute>
      <div className={`container ${styles.content}`}>
        <Outlet />
      </div>
    </ProtectedRoute>
  );
}
