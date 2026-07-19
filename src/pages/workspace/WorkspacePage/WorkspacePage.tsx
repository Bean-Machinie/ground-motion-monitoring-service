// Signed-in workspace, ordered by what needs attention rather than by
// table: needs-attention items, latest published reports, and the org's
// services grouped by product format.
import { useMemo } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useSites } from "@/hooks/useSites";
import { useServices } from "@/hooks/useServices";
import { useReports } from "@/hooks/useReports";
import { useAlerts } from "@/hooks/useAlerts";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import {
  ALERT_SEVERITY_LABELS,
  REPORT_KIND_LABELS,
  SERVICE_KIND_LABELS,
  SERVICE_STATUS_LABELS,
  TECHNIQUE_LABELS,
  type Report,
  type Service,
} from "@/types/domain";
import { formatDate } from "@/lib/dates";
import styles from "./WorkspacePage.module.css";

/** Legacy ?tab=… URLs map onto the new routes. */
const LEGACY_TAB_ROUTES: Record<string, string> = {
  overview: "/",
  monitoring: "/",
  reports: "/reports",
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
                    className={styles.attentionItem}
                  >
                    <StatusBadge
                      status={alert.severity}
                      label={ALERT_SEVERITY_LABELS[alert.severity]}
                    />
                    <span className={styles.attentionText}>
                      {alert.summary ?? "Change detected"} —{" "}
                      {siteNameForService(service)}
                    </span>
                    <span className={styles.attentionMeta}>
                      {formatDate(alert.detected_at)}
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
                    className={styles.attentionItem}
                  >
                    <StatusBadge status="failed" label="Failed" />
                    <span className={styles.attentionText}>
                      {reportTitle(report)} — {siteNameForService(service)}
                    </span>
                    <span className={styles.attentionMeta}>
                      {formatDate(report.updated_at)}
                    </span>
                  </Link>
                </li>
              );
            })}
            {overdueServices.map((service) => (
              <li key={service.id}>
                <Link
                  to={`/services/${service.id}`}
                  className={styles.attentionItem}
                >
                  <StatusBadge status="warning" label="Overdue" />
                  <span className={styles.attentionText}>
                    Next issue overdue — {siteNameForService(service)}
                  </span>
                  <span className={styles.attentionMeta}>
                    Due {formatDate(service.next_issue_due)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* -------------------------- Latest reports ---------------------- */}
      <section aria-labelledby="latest-heading" className={styles.section}>
        <h2 id="latest-heading" className={styles.sectionTitle}>
          Latest reports
        </h2>

        {latestReports.length === 0 ? (
          <EmptyState
            title="No published reports yet"
            description="When a report issue is published for one of your services, it will appear here."
          />
        ) : (
          <ul className={styles.reportList}>
            {latestReports.map((report) => {
              const service = serviceById.get(report.service_id);
              return (
                <li key={report.id}>
                  <Link
                    to={`/reports/${report.id}`}
                    className={styles.reportItem}
                  >
                    <div className={styles.reportItemMain}>
                      <span className={styles.reportName}>
                        {reportTitle(report)}
                      </span>
                      <span className={styles.reportMeta}>
                        {siteNameForService(service)} ·{" "}
                        {REPORT_KIND_LABELS[report.kind]}
                      </span>
                    </div>
                    <span className={styles.reportDate}>
                      {formatDate(report.published_at)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {reports.length > 0 ? (
          <Link to="/reports" className={styles.inlineLink}>
            All reports →
          </Link>
        ) : null}
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
          [
            { kind: "monitoring" as const, list: monitoringServices },
            { kind: "screening" as const, list: screeningServices },
          ].map(({ kind, list }) =>
            list.length > 0 ? (
              <div key={kind} className={styles.serviceGroup}>
                <h3 className={styles.serviceGroupTitle}>
                  {SERVICE_KIND_LABELS[kind]}
                </h3>
                <ul className={styles.serviceList}>
                  {list.map((service) => (
                    <li key={service.id}>
                      <Link
                        to={`/services/${service.id}`}
                        className={styles.serviceItem}
                      >
                        <span className={styles.serviceName}>
                          {siteById.get(service.site_id)?.name ?? "—"}
                        </span>
                        <span className={styles.serviceMeta}>
                          {TECHNIQUE_LABELS[service.technique]}
                        </span>
                        <StatusBadge
                          status={service.status}
                          label={SERVICE_STATUS_LABELS[service.status]}
                        />
                        {service.kind === "monitoring" ? (
                          <span className={styles.serviceMeta}>
                            Next issue: {formatDate(service.next_issue_due)}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )
        )}
      </section>
    </div>
  );
}
