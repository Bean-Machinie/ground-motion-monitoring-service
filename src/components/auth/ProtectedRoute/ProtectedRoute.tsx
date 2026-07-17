// Route guard: renders children only for authenticated users,
// otherwise redirects to /sign-in (preserving the intended destination).
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState label="Checking your session…" />;
  }

  if (!user) {
    return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
