// Redirects already-authenticated users away from auth pages to the portal.
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";

export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState label="Checking your session…" />;
  }

  if (user) {
    return <Navigate to="/portal" replace />;
  }

  return <>{children}</>;
}
