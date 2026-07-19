// Needs-attention cards: unacknowledged alerts, failed reports, and
// monitoring services with an overdue next issue. Shared between the
// Workspace section and the dedicated /attention page; reads from the
// shell-level portal data, so it never refetches.
import { Link } from "react-router-dom";
import { usePortalData } from "@/context/PortalDataContext";
import { AppIcon } from "@/components/ui/AppIcon/AppIcon";
import { REPORT_KIND_LABELS, type Report, type Service } from "@/types/domain";
import { formatDate } from "@/lib/dates";
import styles from "./AttentionList.module.css";

function reportTitle(report: Report): string {
  return (
    report.headline ??
    `${REPORT_KIND_LABELS[report.kind]} #${report.issue_number}`
  );
}

export function AttentionList() {
  const { attention, siteById, serviceById } = usePortalData();

  const siteNameForService = (service: Service | undefined) =>
    service ? (siteById.get(service.site_id)?.name ?? "—") : "—";

  if (attention.count === 0) {
    return (
      <p className={styles.allClear}>
        All clear — nothing needs your attention.
      </p>
    );
  }

  return (
    <ul className={styles.attentionList}>
      {attention.alerts.map((alert) => {
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
                  {siteNameForService(service)} · {formatDate(alert.detected_at)}
                </span>
              </span>
              <span className={styles.cardArrow} aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        );
      })}

      {attention.failedReports.map((report) => {
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
                  {siteNameForService(service)} · {formatDate(report.updated_at)}
                </span>
              </span>
              <span className={styles.cardArrow} aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        );
      })}

      {attention.overdueServices.map((service) => (
        <li key={service.id}>
          <Link
            to={`/services/${service.id}`}
            className={`${styles.attentionCard} ${styles.attentionWarning}`}
          >
            <span className={styles.attentionIcon} aria-hidden="true">
              <AppIcon name="desktop" size={20} />
            </span>
            <span className={styles.attentionBody}>
              <span className={styles.attentionTitle}>Next issue overdue</span>
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
  );
}
