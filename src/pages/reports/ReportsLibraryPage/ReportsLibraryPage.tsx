// Report library: every issue across all services as clean clickable
// cards, filterable by site, service kind, report kind, and period.
import { useState } from "react";
import { Link } from "react-router-dom";
import { usePortalData } from "@/context/PortalDataContext";
import { PortalPageHeader } from "@/components/layout/PortalShell/PortalPageHeader";
import { AppIcon } from "@/components/ui/AppIcon/AppIcon";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { Select } from "@/components/ui/Select/Select";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import {
  REPORT_KIND_LABELS,
  REPORT_STATE_LABELS,
  SERVICE_KIND_LABELS,
  type ReportKind,
  type ServiceKind,
} from "@/types/domain";
import { formatDate } from "@/lib/dates";
import styles from "./ReportsLibraryPage.module.css";

const ALL = "all";

const PERIOD_OPTIONS = [
  { value: ALL, label: "Any time" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last quarter" },
  { value: "365", label: "Last 12 months" },
] as const;

function periodCutoff(period: string): string | null {
  if (period === ALL) return null;
  const days = Number(period);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff.toISOString();
}

export function ReportsLibraryPage() {
  const { sites, reports, loading, error, refetch, siteById, serviceById } =
    usePortalData();

  const [siteFilter, setSiteFilter] = useState<string>(ALL);
  const [serviceKindFilter, setServiceKindFilter] = useState<string>(ALL);
  const [reportKindFilter, setReportKindFilter] = useState<string>(ALL);
  const [period, setPeriod] = useState<string>(ALL);

  const cutoff = periodCutoff(period);
  const filtered = reports.filter((report) => {
    const service = serviceById.get(report.service_id);
    if (siteFilter !== ALL && service?.site_id !== siteFilter) return false;
    if (
      serviceKindFilter !== ALL &&
      service?.kind !== (serviceKindFilter as ServiceKind)
    ) {
      return false;
    }
    if (
      reportKindFilter !== ALL &&
      report.kind !== (reportKindFilter as ReportKind)
    ) {
      return false;
    }
    if (cutoff && (report.published_at ?? report.created_at) < cutoff) {
      return false;
    }
    return true;
  });

  if (loading) {
    return <LoadingState label="Loading your reports…" />;
  }

  return (
    <div className={styles.page}>
      <PortalPageHeader
        crumbs={[{ label: "Workspace", to: "/" }, { label: "Reports" }]}
        title="Reports"
        lede="Every screening report and monitoring issue delivered to your account, in one place."
      />

      {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

      <div className={styles.filterBar}>
        <Select
          label="Site"
          value={siteFilter}
          onChange={setSiteFilter}
          options={[
            { value: ALL, label: "All sites" },
            ...sites.map((site) => ({ value: site.id, label: site.name })),
          ]}
        />
        <Select
          label="Service"
          value={serviceKindFilter}
          onChange={setServiceKindFilter}
          options={[
            { value: ALL, label: "All services" },
            ...(Object.keys(SERVICE_KIND_LABELS) as ServiceKind[]).map(
              (k) => ({ value: k, label: SERVICE_KIND_LABELS[k] }),
            ),
          ]}
        />
        <Select
          label="Report kind"
          value={reportKindFilter}
          onChange={setReportKindFilter}
          options={[
            { value: ALL, label: "All kinds" },
            ...(Object.keys(REPORT_KIND_LABELS) as ReportKind[]).map((k) => ({
              value: k,
              label: REPORT_KIND_LABELS[k],
            })),
          ]}
        />
        <Select
          label="Period"
          value={period}
          onChange={setPeriod}
          options={[...PERIOD_OPTIONS]}
        />
        <span className={styles.filterCount}>
          {filtered.length} of {reports.length}
        </span>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          title="No reports yet"
          description="Delivered screening reports and monitoring issues will accumulate here."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No reports match these filters"
          description="Try widening the site, kind, or period filters."
        />
      ) : (
        <ul className={styles.cardGrid}>
          {filtered.map((report) => {
            const service = serviceById.get(report.service_id);
            const site = service ? siteById.get(service.site_id) : undefined;
            return (
              <li key={report.id}>
                <Link to={`/reports/${report.id}`} className={styles.card}>
                  <div className={styles.cardTop}>
                    <span className={styles.iconChip} aria-hidden="true">
                      <AppIcon name="file" size={22} />
                    </span>
                    <StatusBadge
                      status={report.state}
                      label={REPORT_STATE_LABELS[report.state]}
                    />
                  </div>

                  <p className={styles.kicker}>
                    {REPORT_KIND_LABELS[report.kind]} · Issue{" "}
                    {report.issue_number}
                  </p>
                  <h3 className={styles.cardTitle}>
                    {report.headline ??
                      `${REPORT_KIND_LABELS[report.kind]} #${report.issue_number}`}
                  </h3>
                  <p className={styles.cardSite}>{site?.name ?? "—"}</p>

                  <div className={styles.cardFooter}>
                    <span className={styles.cardDate}>
                      {report.published_at
                        ? formatDate(report.published_at)
                        : "Not yet published"}
                    </span>
                    <span className={styles.cardArrow} aria-hidden="true">
                      →
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
