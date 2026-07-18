// Shell for /portal routes: applies the auth guard and the sidebar
// app layout (no marketing header/footer for signed-in views).
import { Outlet } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute/ProtectedRoute";
import { PortalLayout } from "@/components/layout/PortalLayout/PortalLayout";

export function PortalShell() {
  return (
    <ProtectedRoute>
      <PortalLayout>
        <Outlet />
      </PortalLayout>
    </ProtectedRoute>
  );
}
