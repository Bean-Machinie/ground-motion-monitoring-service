// Portal workspace: tabbed view over the customer account —
// Overview (stats + recent projects), Active Monitoring (operation cards),
// and Reports (delivered/in-progress report cards).
// Uses live Supabase data with empty states throughout.
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useProjects } from "@/hooks/useProjects";
import { useResults } from "@/hooks/useResults";
import { Card } from "@/components/ui/Card/Card";
import { Button } from "@/components/ui/Button/Button";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { PlaceholderPanel } from "@/components/ui/PlaceholderPanel/PlaceholderPanel";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import { PROJECT_STATUS_LABELS } from "@/types/project";
import { RESULT_STATUS_LABELS, RESULT_TYPE_LABELS } from "@/types/result";
import { formatDate } from "@/lib/dates";
import { site } from "@/config/site";
import opImageA from "@/assets/images/offering-deformation.jpg";
import opImageB from "@/assets/images/offering-risk.jpg";
import opImageC from "@/assets/images/offering-research.jpg";
import styles from "./DashboardPage.module.css";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "monitoring", label: "Active Monitoring" },
  { id: "reports", label: "Reports" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** Generic operation visuals, cycled per card. */
const OPERATION_IMAGES = [opImageA, opImageB, opImageC];

export function DashboardPage() {
  const { profile } = useProfile();
  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useProjects();
  const { results, loading: resultsLoading } = useResults();

  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const tab: TabId = TABS.some((t) => t.id === rawTab)
    ? (rawTab as TabId)
    : "overview";

  function selectTab(next: TabId) {
    setSearchParams(next === "overview" ? {} : { tab: next });
  }

  // Derived collections ---------------------------------------------------
  const activeProjects = projects.filter((p) => p.status === "active");
  const operations = projects.filter(
    (p) => p.status === "active" || p.status === "processing",
  );
  const publishedResults = results.filter((r) => r.status === "published");
  const inProgressResults = results.filter(
    (r) => r.status === "draft" || r.status === "processing",
  );
  const recentProjects = projects.slice(0, 3);

  const projectById = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects],
  );

  const displayName = profile?.full_name || profile?.email || "there";

  if (projectsLoading || resultsLoading) {
    return <LoadingState label="Loading your workspace…" />;
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1>Workspace</h1>
        <p className={styles.lede}>
          Welcome back, {displayName} — manage active monitoring, reports, and
          generated movement intelligence in {site.shortName}.
        </p>
      </header>

      {projectsError ? (
        <ErrorMessage message={projectsError} onRetry={refetchProjects} />
      ) : null}

      {/* Tab bar with the New Request action on the right. */}
      <div className={styles.tabRow}>
        <div className={styles.tabList} role="tablist" aria-label="Workspace">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`${styles.tab} ${tab === t.id ? styles.tabActive : ""}`}
              onClick={() => selectTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Link to="/portal/requests/new" className={styles.newRequest}>
          New Request
        </Link>
      </div>

      {/* ------------------------------ Overview --------------------------- */}
      {tab === "overview" ? (
        <div className={styles.tabPanel} role="tabpanel">
          <div className={styles.statsGrid}>
            <Card className={styles.statCard}>
              <span className={styles.statValue}>{activeProjects.length}</span>
              <span className={styles.statLabel}>Active projects</span>
            </Card>
            <Card className={styles.statCard}>
              <span className={styles.statValue}>
                {publishedResults.length}
              </span>
              <span className={styles.statLabel}>Available results</span>
            </Card>
            <Card className={styles.statCard}>
              <span className={styles.statValue}>{projects.length}</span>
              <span className={styles.statLabel}>Total projects</span>
            </Card>
          </div>

          <section aria-labelledby="recent-heading" className={styles.section}>
            <h2 id="recent-heading" className={styles.sectionTitle}>
              Recent projects
            </h2>

            {projects.length === 0 ? (
              <EmptyState
                title="No projects yet"
                description="When a monitoring or analysis project is set up for your account, it will appear here."
              />
            ) : (
              <ul className={styles.recentList}>
                {recentProjects.map((project) => (
                  <li key={project.id}>
                    <Link
                      to={`/portal/projects/${project.slug}`}
                      className={styles.recentItem}
                    >
                      <span className={styles.recentName}>{project.name}</span>
                      <span className={styles.recentMeta}>
                        Updated {formatDate(project.updated_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {projects.length > 0 ? (
              <button
                type="button"
                className={styles.inlineLink}
                onClick={() => selectTab("monitoring")}
              >
                View active monitoring →
              </button>
            ) : null}
          </section>

          <section
            aria-labelledby="activity-heading"
            className={styles.section}
          >
            <h2 id="activity-heading" className={styles.sectionTitle}>
              Recent activity
            </h2>
            <PlaceholderPanel
              title="Activity feed"
              description="A feed of monitoring updates and project activity will appear here in a later release."
            />
          </section>
        </div>
      ) : null}

      {/* -------------------------- Active Monitoring ---------------------- */}
      {tab === "monitoring" ? (
        <div className={styles.tabPanel} role="tabpanel">
          <h2 className={styles.panelTitle}>Active Monitoring Operations</h2>

          <div className={styles.summaryBar}>
            <span className={styles.summaryItem}>
              <strong>{operations.length}</strong> Active operation
              {operations.length === 1 ? "" : "s"}
            </span>
            <span className={styles.summaryItem}>
              <strong>
                {projects.filter((p) => p.status === "processing").length}
              </strong>{" "}
              Processing
            </span>
            <span className={styles.summaryItem}>
              Latest update:{" "}
              <strong>
                {operations.length > 0
                  ? formatDate(operations[0]?.updated_at)
                  : "—"}
              </strong>
            </span>
          </div>

          {operations.length === 0 ? (
            <EmptyState
              title="No active monitoring operations"
              description="When a monitoring operation is running for your account, it will appear here."
              action={
                <Link to="/portal/requests/new" className={styles.newRequest}>
                  New Request
                </Link>
              }
            />
          ) : (
            <ul className={styles.cardGrid}>
              {operations.map((project, index) => (
                <li key={project.id} className={styles.opCard}>
                  <img
                    src={OPERATION_IMAGES[index % OPERATION_IMAGES.length]}
                    alt=""
                    className={styles.opImage}
                    loading="lazy"
                  />
                  <div className={styles.opBody}>
                    {project.monitoring_type ? (
                      <p className={styles.kicker}>{project.monitoring_type}</p>
                    ) : null}
                    <h3 className={styles.opTitle}>{project.name}</h3>
                    <p className={styles.opLocation}>
                      {project.location_label ?? "Requested area of interest"}
                    </p>

                    <div className={styles.opDivider} />

                    <div className={styles.badgeRow}>
                      <StatusBadge
                        status={project.status}
                        label={PROJECT_STATUS_LABELS[project.status]}
                      />
                    </div>

                    <dl className={styles.opMeta}>
                      <div>
                        <dt>Last update</dt>
                        <dd>{formatDate(project.updated_at)}</dd>
                      </div>
                      <div>
                        <dt>Start date</dt>
                        <dd>{formatDate(project.start_date)}</dd>
                      </div>
                    </dl>

                    <Button
                      to={`/portal/projects/${project.slug}`}
                      className={styles.opButton}
                    >
                      Open Operation
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {/* ------------------------------ Reports ---------------------------- */}
      {tab === "reports" ? (
        <div className={styles.tabPanel} role="tabpanel">
          <h2 className={styles.panelTitle}>Reports &amp; Screenings</h2>

          <div className={styles.summaryBar}>
            <span className={styles.summaryItem}>
              <strong>{publishedResults.length}</strong> Delivered
            </span>
            <span className={styles.summaryItem}>
              <strong>{inProgressResults.length}</strong> In progress
            </span>
            <span className={styles.summaryItem}>
              Latest delivery:{" "}
              <strong>
                {publishedResults.length > 0
                  ? formatDate(publishedResults[0]?.published_at)
                  : "Pending"}
              </strong>
            </span>
          </div>

          {results.length === 0 ? (
            <EmptyState
              title="No reports yet"
              description="Delivered screenings, reports, and analysis results will appear here."
              action={
                <Link to="/portal/requests/new" className={styles.newRequest}>
                  New Request
                </Link>
              }
            />
          ) : (
            <ul className={styles.cardGrid}>
              {results.map((result) => {
                const project = projectById.get(result.project_id);
                return (
                  <li key={result.id} className={styles.reportCard}>
                    <p className={styles.kicker}>
                      {RESULT_TYPE_LABELS[result.result_type]}
                    </p>
                    <h3 className={styles.opTitle}>{result.title}</h3>
                    <div className={styles.badgeRow}>
                      <StatusBadge
                        status={result.status}
                        label={RESULT_STATUS_LABELS[result.status]}
                      />
                    </div>

                    {result.summary ? (
                      <p className={styles.reportSummary}>{result.summary}</p>
                    ) : null}

                    <div className={styles.opDivider} />

                    <dl className={styles.opMeta}>
                      <div>
                        <dt>Project</dt>
                        <dd>{project?.name ?? "—"}</dd>
                      </div>
                      <div>
                        <dt>
                          {result.status === "published"
                            ? "Delivered"
                            : "Expected delivery"}
                        </dt>
                        <dd>{formatDate(result.published_at)}</dd>
                      </div>
                    </dl>

                    {project ? (
                      <Button
                        to={`/portal/projects/${project.slug}`}
                        variant="secondary"
                        className={styles.opButton}
                      >
                        {result.status === "published"
                          ? "View Report"
                          : "View Progress"}
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
