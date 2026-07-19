// Engagement detail (/services/:id for a service UUID).
// Monitoring: the issue index — every periodic and alert report in order,
// with the alert history alongside. Screening: redirects to its single
// report when there is exactly one.
import { Link, Navigate, useParams } from "react-router-dom";
import { usePortalData } from "@/context/PortalDataContext";
import { PortalPageHeader } from "@/components/layout/PortalShell/PortalPageHeader";
import { Card } from "@/components/ui/Card/Card";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import {
  ALERT_SEVERITY_LABELS,
  REPORT_KIND_LABELS,
  REPORT_STATE_LABELS,
  SERVICE_KIND_LABELS,
  SERVICE_STATUS_LABELS,
  TECHNIQUE_LABELS,
} from "@/types/domain";
import { formatDate, formatDateRange } from "@/lib/dates";
import styles from "./ServiceEngagementPage.module.css";

export function ServiceEngagementPage() {
  // Mounted under /services/:slug (via the ServiceRoute dispatcher), so the
  // engagement UUID arrives as either param name.
  const params = useParams<{ id?: string; slug?: string }>();
  const id = params.id ?? params.slug;
  const { sites, services, reports, alerts, loading } = usePortalData();

  if (loading) {
    return <LoadingState label="Loading engagement…" />;
  }

  const service = services.find((s) => s.id === id);
  if (!service) {
    return (
      <EmptyState
        title="Engagement not found"
        description="This engagement does not exist or you do not have access to it."
        action={<Link to="/">Back to workspace</Link>}
      />
    );
  }

  const site = sites.find((s) => s.id === service.site_id);
  const issues = reports
    .filter((r) => r.service_id === service.id)
    .sort((a, b) => b.issue_number - a.issue_number);
  const serviceAlerts = alerts.filter((a) => a.service_id === service.id);

  // A screening is its report: with exactly one issue, go straight there.
  if (service.kind === "screening" && issues.length === 1 && issues[0]) {
    return <Navigate to={`/reports/${issues[0].id}`} replace />;
  }

  return (
    <div className={styles.page}>
      <PortalPageHeader
        crumbs={[
          { label: "Sites", to: "/sites" },
          ...(site ? [{ label: site.name, to: `/sites/${site.slug}` }] : []),
          { label: SERVICE_KIND_LABELS[service.kind] },
        ]}
        title={`${SERVICE_KIND_LABELS[service.kind]}${site ? ` — ${site.name}` : ""}`}
        pill={{
          status: service.status,
          label: SERVICE_STATUS_LABELS[service.status],
        }}
        lede={`${TECHNIQUE_LABELS[service.technique]}${
          service.kind === "monitoring" && service.cadence
            ? " · Quarterly issues"
            : ""
        }`}
      />

      <Card className={styles.metaCard}>
        <dl className={styles.meta}>
          <div>
            <dt>Started</dt>
            <dd>{formatDate(service.started_on)}</dd>
          </div>
          <div>
            <dt>Ended</dt>
            <dd>{formatDate(service.ended_on)}</dd>
          </div>
          {service.kind === "monitoring" ? (
            <div>
              <dt>Next issue due</dt>
              <dd>{formatDate(service.next_issue_due)}</dd>
            </div>
          ) : null}
          <div>
            <dt>Technique</dt>
            <dd>{TECHNIQUE_LABELS[service.technique]}</dd>
          </div>
        </dl>
      </Card>

      <div className={styles.columns}>
        <section aria-labelledby="issues-heading" className={styles.section}>
          <h2 id="issues-heading" className={styles.sectionTitle}>
            {service.kind === "monitoring" ? "Issues" : "Reports"}
          </h2>

          {issues.length === 0 ? (
            <EmptyState
              title="No issues yet"
              description={
                service.kind === "monitoring"
                  ? "Quarterly and alert issues will appear here as they are produced."
                  : "The screening report will appear here once it is produced."
              }
            />
          ) : (
            <ul className={styles.issueList}>
              {issues.map((report) => (
                <li key={report.id}>
                  <Link
                    to={`/reports/${report.id}`}
                    className={styles.issueItem}
                  >
                    <span className={styles.issueNumber}>
                      #{report.issue_number}
                    </span>
                    <div className={styles.issueMain}>
                      <span className={styles.issueTitle}>
                        {report.headline ?? REPORT_KIND_LABELS[report.kind]}
                      </span>
                      <span className={styles.issueMeta}>
                        {REPORT_KIND_LABELS[report.kind]} ·{" "}
                        {formatDateRange(
                          report.period_start,
                          report.period_end,
                        )}
                      </span>
                    </div>
                    <StatusBadge
                      status={report.state}
                      label={REPORT_STATE_LABELS[report.state]}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {service.kind === "monitoring" ? (
          <section aria-labelledby="alerts-heading" className={styles.section}>
            <h2 id="alerts-heading" className={styles.sectionTitle}>
              Alert history
            </h2>

            {serviceAlerts.length === 0 ? (
              <EmptyState
                title="No alerts"
                description="Detected critical changes on this subscription will appear here."
              />
            ) : (
              <ul className={styles.alertList}>
                {serviceAlerts.map((alert) => (
                  <li key={alert.id} className={styles.alertItem}>
                    <div className={styles.alertHeader}>
                      <StatusBadge
                        status={alert.severity}
                        label={ALERT_SEVERITY_LABELS[alert.severity]}
                      />
                      <span className={styles.alertDate}>
                        {formatDate(alert.detected_at)}
                      </span>
                    </div>
                    <p className={styles.alertSummary}>
                      {alert.summary ?? "Change detected"}
                    </p>
                    {alert.triggered_report_id ? (
                      <Link
                        to={`/reports/${alert.triggered_report_id}`}
                        className={styles.alertLink}
                      >
                        View alert issue →
                      </Link>
                    ) : null}
                    {alert.acknowledged_at ? (
                      <span className={styles.alertAck}>
                        Acknowledged {formatDate(alert.acknowledged_at)}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
