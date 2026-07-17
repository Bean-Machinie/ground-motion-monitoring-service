// Individual project view: project metadata, associated results, and
// placeholder panels for future maps, charts, and downloadable reports.
import { Link, useParams } from "react-router-dom";
import { useProject } from "@/hooks/useProject";
import { useResults } from "@/hooks/useResults";
import { Card } from "@/components/ui/Card/Card";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import { PlaceholderPanel } from "@/components/ui/PlaceholderPanel/PlaceholderPanel";
import { PROJECT_STATUS_LABELS } from "@/types/project";
import { RESULT_STATUS_LABELS, RESULT_TYPE_LABELS } from "@/types/result";
import { formatDate, formatDateRange } from "@/lib/dates";
import styles from "./ProjectDetailPage.module.css";

export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const {
    project,
    loading: projectLoading,
    error: projectError,
    notFound,
    refetch: refetchProject,
  } = useProject(slug);
  const {
    results,
    loading: resultsLoading,
    error: resultsError,
    refetch: refetchResults,
  } = useResults(project?.id);

  if (projectLoading) {
    return <LoadingState label="Loading project…" />;
  }

  if (projectError) {
    return <ErrorMessage message={projectError} onRetry={refetchProject} />;
  }

  if (notFound || !project) {
    return (
      <EmptyState
        title="Project not found"
        description="This project does not exist or is not associated with your account."
        action={<Link to="/portal/projects">Back to projects</Link>}
      />
    );
  }

  return (
    <div className={styles.page}>
      <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
        <Link to="/portal/projects">Projects</Link>
        <span aria-hidden="true"> / </span>
        <span>{project.name}</span>
      </nav>

      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>{project.name}</h1>
          <StatusBadge
            status={project.status}
            label={PROJECT_STATUS_LABELS[project.status]}
          />
        </div>
        {project.description ? (
          <p className={styles.description}>{project.description}</p>
        ) : null}
        <dl className={styles.meta}>
          <div className={styles.metaEntry}>
            <dt>Location</dt>
            <dd>{project.location_label ?? "—"}</dd>
          </div>
          <div className={styles.metaEntry}>
            <dt>Monitoring type</dt>
            <dd>{project.monitoring_type ?? "—"}</dd>
          </div>
          <div className={styles.metaEntry}>
            <dt>Start date</dt>
            <dd>{formatDate(project.start_date)}</dd>
          </div>
          <div className={styles.metaEntry}>
            <dt>Last updated</dt>
            <dd>{formatDate(project.updated_at)}</dd>
          </div>
        </dl>
      </header>

      <section aria-labelledby="results-heading" className={styles.section}>
        <h2 id="results-heading" className={styles.sectionTitle}>
          Results
        </h2>

        {resultsLoading ? <LoadingState label="Loading results…" /> : null}

        {resultsError ? (
          <ErrorMessage message={resultsError} onRetry={refetchResults} />
        ) : null}

        {!resultsLoading && !resultsError && results.length === 0 ? (
          <EmptyState
            title="No results yet"
            description="Results for this project will appear here once they are published."
          />
        ) : null}

        {results.length > 0 ? (
          <ul className={styles.resultList}>
            {results.map((result) => (
              <li key={result.id}>
                <Card className={styles.resultCard}>
                  <div className={styles.resultHeader}>
                    <h3 className={styles.resultTitle}>{result.title}</h3>
                    <StatusBadge
                      status={result.status}
                      label={RESULT_STATUS_LABELS[result.status]}
                    />
                  </div>
                  {result.summary ? (
                    <p className={styles.resultSummary}>{result.summary}</p>
                  ) : null}
                  <dl className={styles.resultMeta}>
                    <div className={styles.metaEntry}>
                      <dt>Type</dt>
                      <dd>{RESULT_TYPE_LABELS[result.result_type]}</dd>
                    </div>
                    <div className={styles.metaEntry}>
                      <dt>Analysis period</dt>
                      <dd>
                        {formatDateRange(
                          result.analysis_period_start,
                          result.analysis_period_end,
                        )}
                      </dd>
                    </div>
                    <div className={styles.metaEntry}>
                      <dt>Published</dt>
                      <dd>{formatDate(result.published_at)}</dd>
                    </div>
                    <div className={styles.metaEntry}>
                      <dt>Updated</dt>
                      <dd>{formatDate(result.updated_at)}</dd>
                    </div>
                  </dl>
                </Card>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section aria-labelledby="upcoming-heading" className={styles.section}>
        <h2 id="upcoming-heading" className={styles.sectionTitle}>
          Coming to this project
        </h2>
        <div className={styles.placeholderGrid}>
          <PlaceholderPanel
            title="Interactive map"
            description="A map view of monitoring locations and measurement points will be available here."
          />
          <PlaceholderPanel
            title="Time-series charts"
            description="Displacement time-series charts for this project will be available here."
          />
          <PlaceholderPanel
            title="Downloadable reports"
            description="Report downloads associated with this project will be available here."
          />
        </div>
      </section>
    </div>
  );
}
