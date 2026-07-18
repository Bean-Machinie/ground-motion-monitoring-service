// Auth-aware root route ("/"), GitHub-style: signed-out visitors get the
// marketing homepage (with the classic header/footer); signed-in users get
// their portal dashboard inside the sidebar app shell.
// The /portal URLs keep working unchanged.
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { AppLayout } from "@/components/layout/AppLayout/AppLayout";
import { PortalLayout } from "@/components/layout/PortalLayout/PortalLayout";
import { HomePage } from "@/pages/home/HomePage";
import { DashboardPage } from "@/pages/portal/DashboardPage/DashboardPage";

export function RootPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState label="Checking your session…" />;
  }

  if (user) {
    return (
      <PortalLayout>
        <DashboardPage />
      </PortalLayout>
    );
  }

  return (
    <AppLayout>
      <HomePage />
    </AppLayout>
  );
}
