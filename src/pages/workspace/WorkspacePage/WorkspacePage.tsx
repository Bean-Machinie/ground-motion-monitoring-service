// Signed-in workspace, ordered by what needs attention rather than by
// table: needs-attention items, latest published reports, and the org's
// services grouped by product format — all as clean clickable cards.
import { useMemo } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useSites } from "@/hooks/useSites";
import { useServices } from "@/hooks/useServices";
import { useReports } from "@/hooks/useReports";
import { useAlerts } from "@/hooks/useAlerts";
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
  const { sites, loading: sitesLoading } = useSites();
  const {
    services,
    loading: servicesLoading,
    error: servicesError,
    refetch: refetchServices,
  } = useServices();
  const { reports, loading: reportsLoading } = useReports();
  const { alerts, loading: alertsLoading } = useAlerts();

  const [searchParams] = useSearchParams();

  const siteById = useMemo(
    () => new Map(sites.map((s) => [s.id, s])),
    [sites],
  );
  const serviceById = useMemo(
    () => new Map(services.map((s) => [s.id, s])),
    [services],
  );

  // Redirect legacy tab URLs to their new homes.
  const legacyTab = searchParams.get("tab");
  if (legacyTab) {
    return <Navigate to={LEGACY_TAB_ROUTES[legacyTab] ?? "/"} replace />;
  }

  if (sitesLoading || servicesLoading || reportsLoading || alertsLoading) {
    return <LoadingState label="Loading your workspace…" />;
  }

  const siteNameForService = (service: Service | undefined) =>
    service ? (siteById.get(service.site_id)?.name ?? "—") : "—";

  // --------------------------- Needs attention ---------------------------
  const today = new Date().toISOString().slice(0, 10);
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged_at);
  const failedReports = reports.filter((r) => r.state === "failed");
  const overdueServices = services.filter(
    (s) =>
      s.kind === "monitoring" &&
      s.status === "active" &&
      s.next_issue_due !== null &&
      s.next_issue_due < today,
  );
  const attentionCount =
    unacknowledgedAlerts.length + failedReports.length + overdueServices.length;

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
      <header className={styles.pageHeader}>
        <div>
          <h1>Workspace</h1>
          <p className={styles.lede}>
            Welcome back, {displayName} — your screenings, monitoring
            subscriptions, and delivered reports.
          </p>
        </div>
        <Link to="/requests/new" className={styles.newRequest}>
          New Request
        </Link>
      </header>

      {servicesError ? (
        <ErrorMessage message={servicesError} onRetry={refetchServices} />
      ) : null}

      {/* ------------------------- Needs attention ---------------------- */}
      <section aria-labelledby="attention-heading" className={styles.section}>
        <h2 id="attention-heading" className={styles.sectionTitle}>
          Needs attention
        </h2>

        {attentionCount === 0 ? (
          <p className={styles.allClear}>
            All clear — nothing needs your attention.
          </p>
        ) : (
          <ul className={styles.attentionList}>
            {unacknowledgedAlerts.map((alert) => {
              const service = serviceById.get(alert.service_id);
              return (
                <li key={alert.id}>
                  <Link
                    to={`/services/${alert.service_id}`}
                    className={`${styles.attentionCard} ${
                      alert.severity === "critical"
                        ? styles.attentionDanger
                        : styles.attentionWarning
                    }`}
                  >
                    <span className={styles.attentionIcon} aria-hidden="true">
                      <AppIcon name="bell" size={20} />
                    </span>
                    <span className={styles.attentionBody}>
                      <span className={styles.attentionTitle}>
                        {alert.summary ?? "Change detected"}
                      </span>
                      <span className={styles.attentionMeta}>
                        {siteNameForService(service)} ·{" "}
                        {formatDate(alert.detected_at)}
                      </span>
                    </span>
                    <span className={styles.cardArrow} aria-hidden="true">
                      →
                    </span>
                  </Link>
                </li>
              );
            })}
            {failedReports.map((report) => {
              const service = serviceById.get(report.service_id);
              return (
                <li key={report.id}>
                  <Link
                    to={`/reports/${report.id}`}
                    className={`${styles.attentionCard} ${styles.attentionDanger}`}
                  >
                    <span className={styles.attentionIcon} aria-hidden="true">
                      <AppIcon name="file" size={20} />
                    </span>
                    <span className={styles.attentionBody}>
                      <span className={styles.attentionTitle}>
                        Report failed — {reportTitle(report)}
                      </span>
                      <span className={styles.attentionMeta}>
                        {siteNameForService(service)} ·{" "}
                        {formatDate(report.updated_at)}
                      </span>
                    </span>
                    <span className={styles.cardArrow} aria-hidden="true">
                      →
                    </span>
                  </Link>
                </li>
              );
            })}
            {overdueServices.map((service) => (
              <li key={service.id}>
                <Link
                  to={`/services/${service.id}`}
                  className={`${styles.attentionCard} ${styles.attentionWarning}`}
                >
                  <span className={styles.attentionIcon} aria-hidden="true">
                    <AppIcon name="desktop" size={20} />
                  </span>
                  <span className={styles.attentionBody}>
                    <span className={styles.attentionTitle}>
                      Next issue overdue
                    </span>
                    <span className={styles.attentionMeta}>
                      {siteNameForService(service)} · Due{" "}
                      {formatDate(service.next_issue_due)}
                    </span>
                  </span>
                  <span className={styles.cardArrow} aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
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
