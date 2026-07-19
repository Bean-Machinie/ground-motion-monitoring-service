// Dispatcher for /services/:param, which serves two worlds:
//   - marketing service pages (/services/screening, /services/monitoring, …)
//   - customer engagement detail (/services/<uuid>)
// A UUID param means an engagement; anything else is a marketing slug.
import { useParams } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute/ProtectedRoute";
import { ServiceDetailPage } from "@/pages/services/ServiceDetailPage/ServiceDetailPage";
import { ServiceEngagementPage } from "@/pages/services/ServiceEngagementPage/ServiceEngagementPage";
import portalStyles from "@/components/layout/PortalShell/PortalShell.module.css";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ServiceRoute() {
  const { slug } = useParams<{ slug: string }>();

  if (UUID_RE.test(slug ?? "")) {
    return (
      <ProtectedRoute>
        <div className={`container ${portalStyles.content}`}>
          <ServiceEngagementPage />
        </div>
      </ProtectedRoute>
    );
  }

  return <ServiceDetailPage />;
}
