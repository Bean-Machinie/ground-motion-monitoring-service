// Sites index: every physical area of interest the org has, with a count
// of engagements on each.
import { Link } from "react-router-dom";
import { useSites } from "@/hooks/useSites";
import { useServices } from "@/hooks/useServices";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { SERVICE_KIND_LABELS } from "@/types/domain";
import styles from "./SitesPage.module.css";

export function SitesPage() {
  const { sites, loading, error, refetch } = useSites();
  const { services, loading: servicesLoading } = useServices();

  if (loading || servicesLoading) {
    return <LoadingState label="Loading your sites…" />;
  }

  return (
    <div className={styles.page}>
      <header>
        <h1>Sites</h1>
        <p className={styles.lede}>
          The physical areas of interest covered by your screenings and
          monitoring subscriptions.
        </p>
      </header>

      {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

      {!error && sites.length === 0 ? (
        <EmptyState
          title="No sites yet"
          description="When an area of interest is set up for your account, it will appear here."
        />
      ) : null}

      {sites.length > 0 ? (
        <ul className={styles.list}>
          {sites.map((site) => {
            const siteServices = services.filter((s) => s.site_id === site.id);
            return (
              <li key={site.id}>
                <Link to={`/sites/${site.slug}`} className={styles.item}>
                  <div className={styles.itemMain}>
                    <span className={styles.itemName}>{site.name}</span>
                    <span className={styles.itemMeta}>
                      {site.country ?? "—"}
                    </span>
                  </div>
                  <span className={styles.itemServices}>
                    {siteServices.length === 0
                      ? "No services"
                      : siteServices
                          .map((s) => SERVICE_KIND_LABELS[s.kind])
                          .join(" · ")}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
