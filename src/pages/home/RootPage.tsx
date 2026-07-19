// Auth-aware root route ("/"), GitHub-style: signed-out visitors get the
// marketing homepage in the top-bar layout; signed-in users get their
// workspace inside the sidebar shell.
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { AppLayout } from "@/components/layout/AppLayout/AppLayout";
import { PortalShell } from "@/components/layout/PortalShell/PortalShell";
import { HomePage } from "@/pages/home/HomePage";
import { WorkspacePage } from "@/pages/workspace/WorkspacePage/WorkspacePage";

export function RootPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState label="Checking your session…" />;
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
