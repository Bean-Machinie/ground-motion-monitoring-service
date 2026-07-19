// Report library: every issue across all services, filterable by site,
// service kind, report kind, and date range. The page that makes an
// ongoing subscription feel like it accumulates value.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSites } from "@/hooks/useSites";
import { useServices } from "@/hooks/useServices";
import { useReports } from "@/hooks/useReports";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
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

export function ReportsLibraryPage() {
  const { sites, loading: sitesLoading } = useSites();
  const { services, loading: servicesLoading } = useServices();
  const { reports, loading, error, refetch } = useReports();

  const [siteFilter, setSiteFilter] = useState<string>(ALL);
  const [serviceKindFilter, setServiceKindFilter] = useState<string>(ALL);
  const [reportKindFilter, setReportKindFilter] = useState<string>(ALL);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const serviceById = useMemo(
    () => new Map(services.map((s) => [s.id, s])),
    [services],
  );
  const siteById = useMemo(() => new Map(sites.map((s) => [s.id, s])), [sites]);

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
    const date = report.published_at ?? report.created_at;
    if (fromDate && date.slice(0, 10) < fromDate) return false;
    if (toDate && date.slice(0, 10) > toDate) return false;
    return true;
  });

  if (loading || sitesLoading || servicesLoading) {
    return <LoadingState label="Loading your reports…" />;
  }

  return (
    <div className={styles.page}>
      <header>
        <h1>Reports</h1>
        <p className={styles.lede}>
          Every screening report and monitoring issue delivered to your
          account, in one place.
        </p>
      </header>

      {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

      <div className={styles.filterBar}>
        <label className={styles.filter}>
          <span>Site</span>
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
          >
            <option value={ALL}>All sites</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.filter}>
          <span>Service</span>
          <select
            value={serviceKindFilter}
            onChange={(e) => setServiceKindFilter(e.target.value)}
          >
            <option value={ALL}>All services</option>
            {(Object.keys(SERVICE_KIND_LABELS) as ServiceKind[]).map((k) => (
              <option key={k} value={k}>
                {SERVICE_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.filter}>
          <span>Report kind</span>
          <select
            value={reportKindFilter}
            onChange={(e) => setReportKindFilter(e.target.value)}
          >
            <option value={ALL}>All kinds</option>
            {(Object.keys(REPORT_KIND_LABELS) as ReportKind[]).map((k) => (
              <option key={k} value={k}>
                {REPORT_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.filter}>
          <span>From</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </label>

        <label className={styles.filter}>
          <span>To</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </label>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          title="No reports yet"
          description="Delivered screening reports and monitoring issues will accumulate here."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No reports match these filters"
          description="Try widening the site, kind, or date range filters."
        />
      ) : (
        <ul className={styles.list}>
          {filtered.map((report) => {
            const service = serviceById.get(report.service_id);
            const site = service ? siteById.get(service.site_id) : undefined;
            return (
              <li key={report.id}>
                <Link to={`/reports/${report.id}`} className={styles.item}>
                  <div className={styles.itemMain}>
                    <span className={styles.itemTitle}>
                      {report.headline ??
                        `${REPORT_KIND_LABELS[report.kind]} #${report.issue_number}`}
                    </span>
                    <span className={styles.itemMeta}>
                      {site?.name ?? "—"} ·{" "}
                      {service ? SERVICE_KIND_LABELS[service.kind] : "—"} ·{" "}
                      {REPORT_KIND_LABELS[report.kind]} · Issue{" "}
                      {report.issue_number}
                    </span>
                  </div>
                  <span className={styles.itemDate}>
                    {formatDate(report.published_at)}
                  </span>
                  <StatusBadge
                    status={report.state}
                    label={REPORT_STATE_LABELS[report.state]}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
