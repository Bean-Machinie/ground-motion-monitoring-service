// Route guard for administrator-only routes. Requires an authenticated
// user whose profile role is "admin"; others are redirected to the portal.
// Note: this is a UX guard only — real authorization is enforced by RLS.
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();

  if (authLoading || (user && profileLoading)) {
    return <LoadingState label="Checking your access…" />;
  }

  if (!user) {
    return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />;
  }

  if (profile?.role !== "admin") {
    return <Navigate to="/portal" replace />;
  }

  return <>{children}</>;
}
