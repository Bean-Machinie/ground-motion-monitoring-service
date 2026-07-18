// Portal dashboard (Untitled UI dashboard-01 style): page header with a
// date-range segmented control, metric cards with period deltas, recent
// projects, and a latest-results right rail. Live Supabase data throughout.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useProjects } from "@/hooks/useProjects";
import { useResults } from "@/hooks/useResults";
import { Button } from "@/components/ui/Button/Button";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import { formatDate } from "@/lib/dates";
import { PROJECT_STATUS_LABELS } from "@/types/project";
import { RESULT_TYPE_LABELS } from "@/types/result";
import type { Project } from "@/types/project";
import styles from "./DashboardPage.module.css";

type RangeKey = "12m" | "30d" | "7d" | "24h";

const RANGES: { key: RangeKey; label: string; hours: number }[] = [
  { key: "12m", label: "12 months", hours: 365 * 24 },
  { key: "30d", label: "30 days", hours: 30 * 24 },
  { key: "7d", label: "7 days", hours: 7 * 24 },
  { key: "24h", label: "24 hours", hours: 24 },
];

const RANGE_LABELS: Record<RangeKey, string> = {
  "12m": "in the last 12 months",
  "30d": "in the last 30 days",
  "7d": "in the last 7 days",
  "24h": "in the last 24 hours",
};

/** True when the ISO timestamp falls inside the selected range. */
function isWithin(iso: string | null, hours: number): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && Date.now() - t <= hours * 3_600_000;
}

function MetricCard({
  label,
  value,
  delta,
  deltaLabel,
}: {
  label: string;
  value: number;
  delta: number;
  deltaLabel: string;
}) {
  return (
    <div className={styles.metricCard}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={styles.metricValue}>{value}</span>
      <span
        className={`${styles.metricDelta} ${
          delta > 0 ? styles.metricDeltaUp : styles.metricDeltaFlat
        }`}
      >
        {delta > 0 ? <span aria-hidden="true">↑ </span> : null}
        {delta > 0 ? `${delta} new ` : "No change "}
        {deltaLabel}
      </span>
    </div>
  );
}

export function DashboardPage() {
  const { profile } = useProfile();
  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useProjects();
  const { results, loading: resultsLoading } = useResults();

  const [range, setRange] = useState<RangeKey>("30d");
  const rangeHours = RANGES.find((r) => r.key === range)?.hours ?? 30 * 24;
  const rangeLabel = RANGE_LABELS[range];

  const activeProjects = projects.filter((p) => p.status === "active");
  const publishedResults = results.filter((r) => r.status === "published");
  const recentProjects = projects.slice(0, 4);
  const latestResults = publishedResults.slice(0, 6);

  const projectById = useMemo(() => {
    const map = new Map<string, Project>();
    for (const project of projects) map.set(project.id, project);
    return map;
  }, [projects]);

  const newProjects = projects.filter((p) =>
    isWithin(p.created_at, rangeHours),
  ).length;
  const newActive = activeProjects.filter((p) =>
    isWithin(p.created_at, rangeHours),
  ).length;
  const newResults = publishedResults.filter((r) =>
    isWithin(r.published_at ?? r.created_at, rangeHours),
  ).length;
  const updatedProjects = projects.filter((p) =>
    isWithin(p.updated_at, rangeHours),
  ).length;

  const displayName = profile?.full_name || profile?.email || "there";

  if (projectsLoading || resultsLoading) {
    return <LoadingState label="Loading your dashboard…" />;
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.lede}>
            Welcome back, {displayName} — here is what is happening across
            your projects.
          </p>
        </div>

        <div
          className={styles.rangeControl}
          role="group"
          aria-label="Date range"
        >
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              className={`${styles.rangeButton} ${
                range === r.key ? styles.rangeButtonActive : ""
              }`}
              aria-pressed={range === r.key}
              onClick={() => setRange(r.key)}
            >
              <span className={styles.rangeLabelLong}>{r.label}</span>
              <span className={styles.rangeLabelShort} aria-hidden="true">
                {r.key}
              </span>
            </button>
          ))}
        </div>
      </header>

      {projectsError ? (
        <ErrorMessage message={projectsError} onRetry={refetchProjects} />
      ) : null}

      <div className={styles.metricsGrid}>
        <MetricCard
          label="Active projects"
          value={activeProjects.length}
          delta={newActive}
          deltaLabel={rangeLabel}
        />
        <MetricCard
          label="Total projects"
          value={projects.length}
          delta={newProjects}
          deltaLabel={rangeLabel}
        />
        <MetricCard
          label="Published results"
          value={publishedResults.length}
          delta={newResults}
          deltaLabel={rangeLabel}
        />
        <MetricCard
          label="Projects updated"
          value={updatedProjects}
          delta={0}
          deltaLabel={rangeLabel}
        />
      </div>

      <div className={styles.contentGrid}>
        {/* Recent projects */}
        <section
          aria-labelledby="recent-heading"
          className={styles.section}
        >
          <div className={styles.sectionHeader}>
            <h2 id="recent-heading" className={styles.sectionTitle}>
              Recent projects
            </h2>
            {projects.length > 0 ? (
              <Button to="/portal/projects" variant="secondary">
                View all
              </Button>
            ) : null}
          </div>

          {projects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              description="When a monitoring or analysis project is set up for your account, it will appear here."
            />
          ) : (
            <ul className={styles.projectList}>
              {recentProjects.map((project) => (
                <li key={project.id}>
                  <Link
                    to={`/portal/projects/${project.slug}`}
                    className={styles.projectCard}
                  >
                    <div className={styles.projectCardTop}>
                      <span className={styles.projectName}>
                        {project.name}
                      </span>
                      <StatusBadge
                        status={project.status}
                        label={PROJECT_STATUS_LABELS[project.status]}
                      />
                    </div>
                    {project.location_label || project.monitoring_type ? (
                      <span className={styles.projectMeta}>
                        {[project.location_label, project.monitoring_type]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    ) : null}
                    <span className={styles.projectUpdated}>
                      Updated {formatDate(project.updated_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Latest results rail */}
        <section
          aria-labelledby="results-heading"
          className={`${styles.section} ${styles.rail}`}
        >
          <div className={styles.sectionHeader}>
            <h2 id="results-heading" className={styles.sectionTitle}>
              Latest results
            </h2>
          </div>

          {latestResults.length === 0 ? (
            <EmptyState
              title="No results yet"
              description="Published monitoring results and reports will appear here."
            />
          ) : (
            <ul className={styles.resultList}>
              {latestResults.map((result) => {
                const project = projectById.get(result.project_id);
                return (
                  <li key={result.id} className={styles.resultItem}>
                    {project ? (
                      <Link
                        to={`/portal/projects/${project.slug}`}
                        className={styles.resultTitle}
                      >
                        {result.title}
                      </Link>
                    ) : (
                      <span className={styles.resultTitle}>
                        {result.title}
                      </span>
                    )}
                    <span className={styles.resultMeta}>
                      {RESULT_TYPE_LABELS[result.result_type]}
                      {project ? ` · ${project.name}` : ""}
                    </span>
                    <span className={styles.resultDate}>
                      {formatDate(result.published_at ?? result.created_at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
