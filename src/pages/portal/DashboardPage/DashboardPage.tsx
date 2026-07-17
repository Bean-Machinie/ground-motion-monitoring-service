// Portal dashboard: welcome message, project/result counts, and
// a recent-activity placeholder. Uses live Supabase data with empty states.
import { Link } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useProjects } from "@/hooks/useProjects";
import { useResults } from "@/hooks/useResults";
import { Card } from "@/components/ui/Card/Card";
import { Button } from "@/components/ui/Button/Button";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { PlaceholderPanel } from "@/components/ui/PlaceholderPanel/PlaceholderPanel";
import { formatDate } from "@/lib/dates";
import { site } from "@/config/site";
import styles from "./DashboardPage.module.css";

export function DashboardPage() {
  const { profile } = useProfile();
  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useProjects();
  const { results, loading: resultsLoading } = useResults();

  const activeProjects = projects.filter((p) => p.status === "active");
  const publishedResults = results.filter((r) => r.status === "published");
  const recentProjects = projects.slice(0, 3);

  const displayName = profile?.full_name || profile?.email || "there";

  if (projectsLoading || resultsLoading) {
    return <LoadingState label="Loading your dashboard…" />;
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1>Welcome, {displayName}</h1>
        <p className={styles.lede}>
          Your overview of projects and monitoring results in {site.shortName}.
        </p>
      </header>

      {projectsError ? (
        <ErrorMessage message={projectsError} onRetry={refetchProjects} />
      ) : null}

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>{activeProjects.length}</span>
          <span className={styles.statLabel}>Active projects</span>
        </Card>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>{publishedResults.length}</span>
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
          <Button to="/portal/projects" variant="secondary">
            View all projects
          </Button>
        ) : null}
      </section>

      <section aria-labelledby="activity-heading" className={styles.section}>
        <h2 id="activity-heading" className={styles.sectionTitle}>
          Recent activity
        </h2>
        <PlaceholderPanel
          title="Activity feed"
          description="A feed of monitoring updates and project activity will appear here in a later release."
        />
      </section>
    </div>
  );
}
