// Unified report viewer: a screening report and a monitoring issue render
// with the same layout, map section, and time-series section. The only
// difference is chrome — monitoring adds previous/next issue navigation
// and a "change since last issue" delta section.
import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import { Card } from "@/components/ui/Card/Card";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import {
  ARTIFACT_KIND_LABELS,
  REPORT_KIND_LABELS,
  REPORT_STATE_LABELS,
  type Report,
  type ReportArtifact,
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
  artifacts: ReportArtifact[];
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ReportViewer({
  report,
  service,
  site,
  siblings,
  artifacts,
}: ReportViewerProps) {
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);

  const isMonitoring = service?.kind === "monitoring";

  const index = siblings.findIndex((r) => r.id === report.id);
  const prevIssue = index > 0 ? siblings[index - 1] : undefined;
  const nextIssue =
    index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined;

  const mapArtifacts = artifacts.filter(
    (a) => a.kind === "velocity_map" || a.kind === "coherence",
  );
  const seriesArtifacts = artifacts.filter(
    (a) => a.kind === "displacement_timeseries",
  );
  const fileArtifacts = artifacts.filter(
    (a) => a.kind === "netcdf" || a.kind === "geotiff" || a.kind === "pdf",
  );

  async function generatePdf() {
    setPdfBusy(true);
    setPdfMessage(null);
    try {
      // POST /reports/:id/pdf — served by the report-pdf edge function,
      // which renders the published report server-side from the same data
      // as this view and stores the output as a report_artifacts row.
      const { error } = await supabase.functions.invoke("report-pdf", {
        body: { report_id: report.id },
      });
      if (error) throw error;
      setPdfMessage("PDF generation requested — it will appear under files.");
    } catch (err) {
      setPdfMessage(getErrorMessage(err));
    } finally {
      setPdfBusy(false);
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

      <header className={styles.header}>
        <p className={styles.kicker}>
          {REPORT_KIND_LABELS[report.kind]}
          {site ? ` · ${site.name}` : ""}
        </p>
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

      {report.summary ? (
        <p className={styles.summary}>{report.summary}</p>
      ) : null}

      {/* Same map + time-series sections for both contexts. */}
      <section aria-labelledby="map-heading" className={styles.section}>
        <h2 id="map-heading" className={styles.sectionTitle}>
          Deformation map
        </h2>
        {mapArtifacts.length === 0 ? (
          <EmptyState
            title="No map artifacts on this report"
            description="The velocity and coherence maps appear here once artifact data is attached to this issue."
          />
        ) : (
          <ul className={styles.artifactList}>
            {mapArtifacts.map((a) => (
              <li key={a.id} className={styles.artifactItem}>
                <span className={styles.artifactKind}>
                  {ARTIFACT_KIND_LABELS[a.kind]}
                </span>
                <span className={styles.artifactPath}>{a.storage_path}</span>
                <span className={styles.artifactMeta}>
                  {formatBytes(a.bytes)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="series-heading" className={styles.section}>
        <h2 id="series-heading" className={styles.sectionTitle}>
          Displacement time series
        </h2>
        {seriesArtifacts.length === 0 ? (
          <EmptyState
            title="No time-series artifacts on this report"
            description="Displacement time-series charts appear here once artifact data is attached to this issue."
          />
        ) : (
          <ul className={styles.artifactList}>
            {seriesArtifacts.map((a) => (
              <li key={a.id} className={styles.artifactItem}>
                <span className={styles.artifactKind}>
                  {ARTIFACT_KIND_LABELS[a.kind]}
                </span>
                <span className={styles.artifactPath}>{a.storage_path}</span>
                <span className={styles.artifactMeta}>
                  {formatBytes(a.bytes)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Monitoring chrome: change since last issue. */}
      {isMonitoring ? (
        <section aria-labelledby="delta-heading" className={styles.section}>
          <h2 id="delta-heading" className={styles.sectionTitle}>
            Change since last issue
          </h2>
          {prevIssue ? (
            <Card className={styles.deltaCard}>
              <p className={styles.deltaText}>
                Compared against{" "}
                <Link to={`/reports/${prevIssue.id}`}>
                  Issue {prevIssue.issue_number}
                </Link>{" "}
                ({formatDateRange(prevIssue.period_start, prevIssue.period_end)}
                ). Numeric change metrics appear here once both issues carry
                artifact data.
              </p>
            </Card>
          ) : (
            <EmptyState
              title="First issue"
              description="This is the first issue of this subscription, so there is no previous issue to compare against."
            />
          )}
        </section>
      ) : null}

      {/* Files + export. */}
      <section aria-labelledby="files-heading" className={styles.section}>
        <h2 id="files-heading" className={styles.sectionTitle}>
          Files
        </h2>

        {fileArtifacts.length === 0 ? (
          <EmptyState
            title="No files on this report"
            description="Exports such as GeoTIFF, NetCDF, and the generated PDF appear here."
          />
        ) : (
          <ul className={styles.artifactList}>
            {fileArtifacts.map((a) => (
              <li key={a.id} className={styles.artifactItem}>
                <span className={styles.artifactKind}>
                  {ARTIFACT_KIND_LABELS[a.kind]}
                </span>
                <span className={styles.artifactPath}>{a.storage_path}</span>
                <span className={styles.artifactMeta}>
                  {formatBytes(a.bytes)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className={styles.exportRow}>
          {report.pdf_url ? (
            <a
              href={report.pdf_url}
              target="_blank"
              rel="noreferrer"
              className={styles.exportButton}
            >
              Download PDF
            </a>
          ) : report.state === "published" ? (
            <button
              type="button"
              className={styles.exportButton}
              onClick={() => void generatePdf()}
              disabled={pdfBusy}
            >
              {pdfBusy ? "Generating…" : "Generate PDF"}
            </button>
          ) : (
            <span className={styles.exportNote}>
              PDF export becomes available once this report is published.
            </span>
          )}
          {pdfMessage ? (
            <span className={styles.exportNote}>{pdfMessage}</span>
          ) : null}
        </div>
      </section>
    </article>
  );
}
