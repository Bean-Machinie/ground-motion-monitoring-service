// Signed-in workspace, ordered by what needs attention rather than by
// table: needs-attention items, latest published reports, and Active
// work — one card per service, headlined by the customer's own name for
// it. Data comes from the shell-level portal context (fetched once).
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { usePortalData } from "@/context/PortalDataContext";
import { PortalPageHeader } from "@/components/layout/PortalShell/PortalPageHeader";
import { AttentionList } from "@/components/portal/AttentionList/AttentionList";
import { AppIcon } from "@/components/ui/AppIcon/AppIcon";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import {
  REPORT_KIND_LABELS,
  SERVICE_STATUS_LABELS,
  serviceDisplayName,
  serviceKindLine,
  type Report,
  type Service,
} from "@/types/domain";
import { formatDate, formatShortDate } from "@/lib/dates";
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

/** Card status dot: red for an unacknowledged alert, green for active,
    neutral otherwise (scoping and quoted stay deliberately calm). */
function cardDotTone(
  service: Service,
  alertedServiceIds: Set<string>,
): "danger" | "success" | "neutral" {
  if (alertedServiceIds.has(service.id)) return "danger";
  if (service.status === "active") return "success";
  return "neutral";
}

/** The card footer: always a date-shaped fact, never a vague promise.
    "Issue 5 due 10 Sep", "Delivered 2 Mar", "Scoping in progress". */
function nextDateLine(service: Service, serviceReports: Report[]): string {
  if (service.status === "scoping") return "Scoping in progress";
  if (service.status === "quoted") return "Quote ready";
  if (service.status === "paused") return "Paused";
  if (service.status === "cancelled") return "Cancelled";

  const published = serviceReports.filter((r) => r.state === "published");

  if (service.status === "completed") {
    const delivered =
      published[0]?.published_at ?? service.ended_on ?? service.updated_at;
    return `Delivered ${formatShortDate(delivered)}`;
  }

  // Active monitoring: the next issue number is one past the latest.
  if (service.kind === "monitoring" && service.next_issue_due) {
    const latest = serviceReports.reduce(
      (max, r) => Math.max(max, r.issue_number),
      0,
    );
    return `Issue ${latest + 1} due ${formatShortDate(service.next_issue_due)}`;
  }

  return published[0]?.published_at
    ? `Delivered ${formatShortDate(published[0].published_at)}`
    : "In progress";
}

export function WorkspacePage() {
  const { profile } = useProfile();
  const {
    services,
    reports,
    alerts,
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

  // ----------------------------- Active work ------------------------------
  const monitoringServices = services.filter((s) => s.kind === "monitoring");
  const screeningServices = services.filter((s) => s.kind === "screening");

  const alertedServiceIds = new Set(
    alerts.filter((a) => !a.acknowledged_at).map((a) => a.service_id),
  );
  const reportsForService = (serviceId: string) =>
    reports
      .filter((r) => r.service_id === serviceId)
      .sort((a, b) => b.issue_number - a.issue_number);

  const displayName = profile?.full_name || profile?.email || "there";

  return (
    <div className={styles.page}>
      <PortalPageHeader
        crumbs={[{ label: "Workspace" }]}
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

      {/* --------------------------- Active work ------------------------ */}
      <section aria-labelledby="services-heading" className={styles.section}>
        <h2 id="services-heading" className={styles.sectionTitle}>
          Active work
        </h2>

        {services.length === 0 ? (
          <EmptyState
            title="Nothing under way yet"
            description="Request a monitoring subscription or a screening and it will appear here from the moment you ask."
            action={
              <Link to="/requests/new" className={styles.newRequest}>
                New Request
              </Link>
            }
          />
        ) : (
          <ul className={styles.serviceGrid}>
            {[...monitoringServices, ...screeningServices].map((service) => {
              const site = siteById.get(service.site_id);
              const serviceReports = reportsForService(service.id);
              const inRequestStage =
                service.status === "scoping" || service.status === "quoted";
              const latestPublished = serviceReports.find(
                (r) => r.state === "published",
              );

              return (
                <li key={service.id}>
                  <Link
                    to={`/services/${service.id}`}
                    className={styles.serviceCard}
                  >
                    {/* 1. Status dot and short state word. */}
                    <span className={styles.serviceState}>
                      <span
                        className={`${styles.serviceDot} ${
                          styles[
                            `serviceDot_${cardDotTone(service, alertedServiceIds)}`
                          ]
                        }`}
                        aria-hidden="true"
                      />
                      {SERVICE_STATUS_LABELS[service.status]}
                    </span>

                    {/* 2. The customer's own name — the headline. */}
                    <h3
                      className={styles.serviceTitle}
                      title={serviceDisplayName(service, site)}
                    >
                      {serviceDisplayName(service, site)}
                    </h3>

                    {/* 3. "{cadence} {kind} · {location}, {country}" —
                        never the technique, never location-first. */}
                    <p className={styles.serviceKindLine}>
                      {serviceKindLine(service, site)}
                    </p>

                    {/* 5. Latest published headline — or, in the request
                        stage, an honest status line instead. */}
                    {inRequestStage ? (
                      <p className={styles.serviceStatusLine}>
                        We're reviewing your request
                      </p>
                    ) : latestPublished?.headline ? (
                      <p className={styles.serviceHeadline}>
                        {latestPublished.headline}
                      </p>
                    ) : null}

                    {/* 6. Next date. */}
                    <span className={styles.serviceFooter}>
                      <span className={styles.serviceNext}>
                        {nextDateLine(service, serviceReports)}
                      </span>
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
    </div>
  );
}
