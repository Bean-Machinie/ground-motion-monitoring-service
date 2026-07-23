// Unified report viewer over the generic payload. Layout, top to bottom:
//
//   1. Report kind, period, and issue number — the envelope
//   2. headline as the page title
//   3. summary as body text
//   4. headline_metric and the chart_series sparkline, only when present
//   5. Attachments — label, file type, size; primary first, distinguished
//   6. Inline preview of the primary attachment when it is a PDF; a
//      download button only for any other type
//
// A report with a headline, a summary, and one Word document is a
// complete, valid report — the expected case for now, not a broken one.
// Monitoring keeps its previous/next issue chrome; that is envelope, not
// payload.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Sparkline } from "@/components/ui/Sparkline/Sparkline";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import {
  REPORT_KIND_LABELS,
  REPORT_STATE_LABELS,
  formatMetricValue,
  reportChartSeries,
  reportHeadlineMetric,
  type Report,
  type ReportAttachment,
  type Service,
  type Site,
} from "@/types/domain";
import { formatDate, formatDateRange } from "@/lib/dates";
import styles from "./ReportViewer.module.css";

interface ReportViewerProps {
  report: Report;
  service: Service | undefined;
  site: Site | undefined;
  /** All issues of the same service, ascending by issue_number. */
  siblings: Report[];
  attachments: ReportAttachment[];
}

/** Attachment files live in the private "reports" bucket and are served
    only through short-lived signed URLs. */
const BUCKET = "reports";
const SIGNED_URL_TTL_SECONDS = 30 * 60;

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** "PDF", "DOCX", "GEOTIFF" — from the uploaded filename, since there is
    no kind enum anymore and mime types are not always present. */
function fileTypeLabel(attachment: ReportAttachment): string {
  const dot = attachment.filename.lastIndexOf(".");
  if (dot === -1 || dot === attachment.filename.length - 1) return "File";
  return attachment.filename.slice(dot + 1).toUpperCase();
}

const TONE_COLORS = {
  danger: "var(--color-danger)",
  warning: "var(--color-warning)",
  neutral: "var(--color-text-subtle)",
} as const;

export function ReportViewer({
  report,
  service,
  site,
  siblings,
  attachments,
}: ReportViewerProps) {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const isMonitoring = service?.kind === "monitoring";

  const index = siblings.findIndex((r) => r.id === report.id);
  const prevIssue = index > 0 ? siblings[index - 1] : undefined;
  const nextIssue =
    index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined;

  const metric = reportHeadlineMetric(report);
  const series = reportChartSeries(report);
  const primary = attachments.find((a) => a.is_primary);
  const primaryIsPdf = primary?.mime_type === "application/pdf";

  // Signed URL for the inline PDF preview only; downloads sign on click.
  useEffect(() => {
    setPreviewUrl(null);
    setPreviewError(null);
    if (!primary || primary.mime_type !== "application/pdf") return;
    let cancelled = false;
    void supabase.storage
      .from(BUCKET)
      .createSignedUrl(primary.storage_path, SIGNED_URL_TTL_SECONDS)
      .then(({ data, error: signError }) => {
        if (cancelled) return;
        if (data?.signedUrl) setPreviewUrl(data.signedUrl);
        // Surface the failure instead of silently hiding the preview —
        // a missing storage read policy would otherwise be invisible.
        else if (signError) setPreviewError(getErrorMessage(signError));
      });
    return () => {
      cancelled = true;
    };
  }, [primary?.id, primary?.storage_path, primary?.mime_type]);

  async function download(attachment: ReportAttachment) {
    setDownloadError(null);
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(attachment.storage_path, SIGNED_URL_TTL_SECONDS, {
          download: attachment.filename,
        });
      if (error) throw error;
      window.open(data.signedUrl, "_blank", "noopener");
    } catch (err) {
      setDownloadError(getErrorMessage(err));
    }
  }

  return (
    <article className={styles.viewer}>
      {/* Monitoring chrome: issue navigation. Screening renders none. */}
      {isMonitoring ? (
        <nav className={styles.issueNav} aria-label="Issue navigation">
          {prevIssue ? (
            <Link to={`/reports/${prevIssue.id}`} className={styles.issueNavLink}>
              ← Issue {prevIssue.issue_number}
            </Link>
          ) : (
            <span className={styles.issueNavDisabled}>← Previous</span>
          )}
          <span className={styles.issueNavCurrent}>
            Issue {report.issue_number} of {siblings.length}
          </span>
          {nextIssue ? (
            <Link to={`/reports/${nextIssue.id}`} className={styles.issueNavLink}>
              Issue {nextIssue.issue_number} →
            </Link>
          ) : (
            <span className={styles.issueNavDisabled}>Next →</span>
          )}
        </nav>
      ) : null}

      {/* 1. The envelope: kind, period, issue number. */}
      <header className={styles.header}>
        <p className={styles.kicker}>
          {REPORT_KIND_LABELS[report.kind]} · Issue {report.issue_number}
          {site ? ` · ${site.name}` : ""}
        </p>
        {/* 2. headline as the page title. */}
        <h1 className={styles.headline}>
          {report.headline ??
            `${REPORT_KIND_LABELS[report.kind]} #${report.issue_number}`}
        </h1>
        <div className={styles.headerMeta}>
          <StatusBadge
            status={report.state}
            label={REPORT_STATE_LABELS[report.state]}
          />
          <span className={styles.metaText}>
            Observation window:{" "}
            {formatDateRange(report.period_start, report.period_end)}
          </span>
          {report.published_at ? (
            <span className={styles.metaText}>
              Published {formatDate(report.published_at)}
            </span>
          ) : null}
        </div>
      </header>

      {report.supersedes_report_id ? (
        <p className={styles.supersedes}>
          This is a corrected issue.{" "}
          <Link to={`/reports/${report.supersedes_report_id}`}>
            View the superseded report
          </Link>
          .
        </p>
      ) : null}

      {/* 3. summary as body text. */}
      {report.summary ? (
        <p className={styles.summary}>{report.summary}</p>
      ) : null}

      {/* 4. Metric and sparkline — only when present. A report without
          them renders nothing here; no placeholder. */}
      {metric || series.length >= 2 ? (
        <section aria-label="Summary figures" className={styles.figures}>
          {metric ? (
            <p
              className={styles.metric}
              style={{ color: TONE_COLORS[metric.tone] }}
            >
              <span className={styles.metricValue}>
                {formatMetricValue(metric.value)}
              </span>{" "}
              <span className={styles.metricUnit}>{metric.unit}</span>
            </p>
          ) : null}
          {series.length >= 2 ? (
            <div className={styles.sparklineSlot}>
              <Sparkline
                points={series}
                stroke={TONE_COLORS[metric?.tone ?? "neutral"]}
              />
            </div>
          ) : null}
        </section>
      ) : null}

      {/* 5. Attachments: every file with label, type, and size. Primary
          first (the hook orders it first) and visually distinguished. */}
      <section aria-labelledby="attachments-heading" className={styles.section}>
        <h2 id="attachments-heading" className={styles.sectionTitle}>
          Attachments
        </h2>

        {attachments.length === 0 ? (
          <EmptyState
            title="No files on this report"
            description="The delivered files appear here once they are attached to this issue."
          />
        ) : (
          <ul className={styles.attachmentList}>
            {attachments.map((a) => (
              <li
                key={a.id}
                className={
                  a.is_primary
                    ? `${styles.attachmentItem} ${styles.attachmentPrimary}`
                    : styles.attachmentItem
                }
              >
                <span className={styles.attachmentLabel}>
                  {a.label || a.filename}
                  {a.is_primary ? (
                    <span className={styles.primaryTag}>Primary</span>
                  ) : null}
                </span>
                <span className={styles.attachmentFilename}>{a.filename}</span>
                <span className={styles.attachmentMeta}>
                  {fileTypeLabel(a)} · {formatBytes(a.bytes)}
                </span>
                <button
                  type="button"
                  className={styles.downloadButton}
                  onClick={() => void download(a)}
                >
                  Download
                </button>
              </li>
            ))}
          </ul>
        )}
        {downloadError ? (
          <p className={styles.downloadError}>{downloadError}</p>
        ) : null}
        {previewError ? (
          <p className={styles.downloadError}>
            Preview unavailable: {previewError}
          </p>
        ) : null}
      </section>

      {/* 6. Inline preview only when the primary attachment is a PDF.
          Any other type gets its download button above and nothing more —
          a Word-document report is complete, not broken. */}
      {primaryIsPdf && previewUrl ? (
        <section aria-labelledby="preview-heading" className={styles.section}>
          <h2 id="preview-heading" className={styles.sectionTitle}>
            {primary?.label || "Report"}
          </h2>
          <iframe
            src={previewUrl}
            title={primary?.label || "Report preview"}
            className={styles.pdfPreview}
          />
        </section>
      ) : null}
    </article>
  );
}
