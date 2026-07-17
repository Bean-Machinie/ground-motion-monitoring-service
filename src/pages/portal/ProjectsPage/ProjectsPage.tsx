// Portal projects list: the authenticated customer's projects with
// loading, empty, and error states.
import { Link } from "react-router-dom";
import { useProjects } from "@/hooks/useProjects";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import { PROJECT_STATUS_LABELS } from "@/types/project";
import { formatDate } from "@/lib/dates";
import styles from "./ProjectsPage.module.css";

export function ProjectsPage() {
  const { projects, loading, error, refetch } = useProjects();

  if (loading) {
    return <LoadingState label="Loading your projects…" />;
  }

  return (
    <div className={styles.page}>
      <header>
        <h1>Projects</h1>
        <p className={styles.lede}>
          Monitoring and analysis projects associated with your account.
        </p>
      </header>

      {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

      {!error && projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="When a monitoring or analysis project is set up for your account, it will appear here."
        />
      ) : null}

      {projects.length > 0 ? (
        <ul className={styles.list}>
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                to={`/portal/projects/${project.slug}`}
                className={styles.item}
              >
                <div className={styles.itemHeader}>
                  <span className={styles.itemName}>{project.name}</span>
                  <StatusBadge
                    status={project.status}
                    label={PROJECT_STATUS_LABELS[project.status]}
                  />
                </div>
                <dl className={styles.itemMeta}>
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
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
