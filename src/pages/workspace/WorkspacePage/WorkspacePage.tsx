// Signed-in workspace, ordered by what needs attention rather than by
// table: needs-attention items, latest published reports, and the org's
// services grouped by product format — all as clean clickable cards.
// Data comes from the shell-level portal context (fetched once).
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { usePortalData } from "@/context/PortalDataContext";
import { PortalPageHeader } from "@/components/layout/PortalShell/PortalPageHeader";
import { AttentionList } from "@/components/portal/AttentionList/AttentionList";
import { AppIcon } from "@/components/ui/AppIcon/AppIcon";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import {
  REPORT_KIND_LABELS,
  SERVICE_KIND_LABELS,
  SERVICE_STATUS_LABELS,
  TECHNIQUE_LABELS,
  type Report,
  type Service,
} from "@/types/domain";
import { formatDate } from "@/lib/dates";
import monitoringImage from "@/assets/images/offering-deformation.jpg";
import screeningImage from "@/assets/images/offering-risk.jpg";
import styles from "./WorkspacePage.module.css";

/** Legacy ?tab=… URLs map onto the new routes. */
const LEGACY_TAB_ROUTES: Record<string, string> = {
  overview: "/",
  monitoring: "/",
  reports: "/reports",
};

const SERVICE_IMAGES: Record<Service["kind"], string> = {
  monitoring: monitoringImage,
  screening: screeningImage,
};

function reportTitle(report: Report): string {
  return (
    report.headline ??
    `${REPORT_KIND_LABELS[report.kind]} #${report.issue_number}`
  );
}

export function WorkspacePage() {
  const { profile } = useProfile();
  const {
    services,
    reports,
    loading,
    error,
    refetch,
    siteById,
    serviceById,
    attention,
  } = usePortalData();

  const [searchParams] = useSearchParams();

  // Redirect legacy tab URLs to their new homes.
  const legacyTab = searchParams.get("tab");
  if (legacyTab) {
    return <Navigate to={LEGACY_TAB_ROUTES[legacyTab] ?? "/"} replace />;
  }

  if (loading) {
    return <LoadingState label="Loading your workspace…" />;
  }

  const attentionCount = attention.count;

  const siteNameForService = (service: Service | undefined) =>
    service ? (siteById.get(service.site_id)?.name ?? "—") : "—";

  // ---------------------------- Latest reports ---------------------------
  const latestReports = reports
    .filter((r) => r.state === "published")
    .slice(0, 5);

  // ---------------------------- Your services ----------------------------
  const monitoringServices = services.filter((s) => s.kind === "monitoring");
  const screeningServices = services.filter((s) => s.kind === "screening");

  const displayName = profile?.full_name || profile?.email || "there";

  return (
    <div className={styles.page}>
      <PortalPageHeader
        title="Workspace"
        lede={`Welcome back, ${displayName} — your screenings, monitoring subscriptions, and delivered reports.`}
      />

      {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

      {/* ------------------------- Needs attention ---------------------- */}
      <section aria-labelledby="attention-heading" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 id="attention-heading" className={styles.sectionTitle}>
            Needs attention
          </h2>
          {attentionCount > 0 ? (
            <Link to="/attention" className={styles.inlineLink}>
              View all →
            </Link>
          ) : null}
        </div>

        <AttentionList />
      </section>

      {/* -------------------------- Latest reports ---------------------- */}
      <section aria-labelledby="latest-heading" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 id="latest-heading" className={styles.sectionTitle}>
            Latest reports
          </h2>
          {reports.length > 0 ? (
            <Link to="/reports" className={styles.inlineLink}>
              All reports →
            </Link>
          ) : null}
        </div>

        {latestReports.length === 0 ? (
          <EmptyState
            title="No published reports yet"
            description="When a report issue is published for one of your services, it will appear here."
          />
        ) : (
          <ul className={styles.reportGrid}>
            {latestReports.map((report) => {
              const service = serviceById.get(report.service_id);
              return (
                <li key={report.id}>
                  <Link
                    to={`/reports/${report.id}`}
                    className={styles.reportCard}
                  >
                    <span className={styles.reportIcon} aria-hidden="true">
                      <AppIcon name="file" size={20} />
                    </span>
                    <span className={styles.reportKicker}>
                      {REPORT_KIND_LABELS[report.kind]}
                    </span>
                    <span className={styles.reportTitle}>
                      {reportTitle(report)}
                    </span>
                    <span className={styles.reportMeta}>
                      {siteNameForService(service)}
                    </span>
                    <span className={styles.reportFooter}>
                      <span>{formatDate(report.published_at)}</span>
                      <span className={styles.cardArrow} aria-hidden="true">
                        →
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* -------------------------- Your services ----------------------- */}
      <section aria-labelledby="services-heading" className={styles.section}>
        <h2 id="services-heading" className={styles.sectionTitle}>
          Your services
        </h2>

        {services.length === 0 ? (
          <EmptyState
            title="No services yet"
            description="When a screening or monitoring engagement is set up for your account, it will appear here."
            action={
              <Link to="/requests/new" className={styles.newRequest}>
                New Request
              </Link>
            }
          />
        ) : (
          <ul className={styles.serviceGrid}>
            {[...monitoringServices, ...screeningServices].map((service) => (
              <li key={service.id}>
                <Link
                  to={`/services/${service.id}`}
                  className={styles.serviceCard}
                >
                  <div className={styles.serviceMedia}>
                    <img
                      src={SERVICE_IMAGES[service.kind]}
                      alt=""
                      className={styles.serviceImage}
                      loading="lazy"
                    />
                    <span className={styles.serviceKindChip}>
                      {SERVICE_KIND_LABELS[service.kind]}
                    </span>
                  </div>
                  <div className={styles.serviceBody}>
                    <p className={styles.serviceKicker}>
                      {TECHNIQUE_LABELS[service.technique]}
                    </p>
                    <h3 className={styles.serviceTitle}>
                      {siteById.get(service.site_id)?.name ?? "—"}
                    </h3>
                    <div className={styles.serviceFooter}>
                      <StatusBadge
                        status={service.status}
                        label={SERVICE_STATUS_LABELS[service.status]}
                      />
                      {service.kind === "monitoring" ? (
                        <span className={styles.serviceNext}>
                          Next issue {formatDate(service.next_issue_due)}
                        </span>
                      ) : null}
                      <span className={styles.cardArrow} aria-hidden="true">
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
