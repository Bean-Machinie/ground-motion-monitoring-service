// Dispatcher for /services/:param, which serves two worlds:
//   - marketing service pages (/services/screening, /services/monitoring, …)
//     in the public top-bar layout
//   - customer engagement detail (/services/<uuid>) in the sidebar shell
// A UUID param means an engagement; anything else is a marketing slug.
import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout/AppLayout";
import { PortalShell } from "@/components/layout/PortalShell/PortalShell";
import { ServiceDetailPage } from "@/pages/services/ServiceDetailPage/ServiceDetailPage";
import { ServiceEngagementPage } from "@/pages/services/ServiceEngagementPage/ServiceEngagementPage";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ServiceRoute() {
  const { slug } = useParams<{ slug: string }>();

  if (UUID_RE.test(slug ?? "")) {
    return (
      <PortalShell>
        <ServiceEngagementPage />
      </PortalShell>
    );
  }

  return (
    <AppLayout>
      <ServiceDetailPage />
    </AppLayout>
  );
}
