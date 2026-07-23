// Auth-aware root route ("/"), GitHub-style: signed-out visitors get the
// marketing homepage in the top-bar layout; signed-in customers get their
// workspace inside the sidebar shell; admins land on the customer overview.
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { AppLayout } from "@/components/layout/AppLayout/AppLayout";
import { PortalShell } from "@/components/layout/PortalShell/PortalShell";
import { HomePage } from "@/pages/home/HomePage";
import { WorkspacePage } from "@/pages/workspace/WorkspacePage/WorkspacePage";

export function RootPage() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  // Wait for the profile too when signed in, so an admin never flashes the
  // customer workspace before the redirect resolves.
  if (loading || (user && profileLoading)) {
    return <LoadingState label="Checking your session…" />;
  }

  // Admins work out of the customer overview, not a personal portal.
  if (user && profile?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (user) {
    return (
      <PortalShell>
        <WorkspacePage />
      </PortalShell>
    );
  }

  return (
    <AppLayout>
      <HomePage />
    </AppLayout>
  );
}
