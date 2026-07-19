// Auth-aware root route ("/"), GitHub-style: signed-out visitors get the
// marketing homepage; signed-in users get their portal dashboard directly.
// The /portal URLs keep working unchanged.
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { HomePage } from "@/pages/home/HomePage";
import { WorkspacePage } from "@/pages/workspace/WorkspacePage/WorkspacePage";
import portalStyles from "@/components/layout/PortalShell/PortalShell.module.css";

export function RootPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState label="Checking your session…" />;
  }

  if (user) {
    return (
      <div className={`container ${portalStyles.content}`}>
        <WorkspacePage />
      </div>
    );
  }

  return <HomePage />;
}
