// Sites index: image cards for every physical area of interest, with
// the engagements running on each.
import { Link } from "react-router-dom";
import { usePortalData } from "@/context/PortalDataContext";
import { PortalPageHeader } from "@/components/layout/PortalShell/PortalPageHeader";
import { AppIcon } from "@/components/ui/AppIcon/AppIcon";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { SERVICE_KIND_LABELS } from "@/types/domain";
import siteImageA from "@/assets/images/offering-deformation.jpg";
import siteImageB from "@/assets/images/offering-risk.jpg";
import siteImageC from "@/assets/images/offering-research.jpg";
import styles from "./SitesPage.module.css";

/* Generic site visuals, assigned deterministically per card. */
const SITE_IMAGES = [siteImageA, siteImageB, siteImageC];

export function SitesPage() {
  const { sites, services, loading, error, refetch } = usePortalData();

  if (loading) {
    return <LoadingState label="Loading your sites…" />;
  }

  return (
    <div className={styles.page}>
      <PortalPageHeader
        crumbs={[{ label: "Workspace", to: "/" }, { label: "Sites" }]}
        title="Sites"
        lede="The physical areas of interest covered by your screenings and monitoring subscriptions."
      />

      {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

      {!error && sites.length === 0 ? (
        <EmptyState
          title="No sites yet"
          description="When an area of interest is set up for your account, it will appear here."
        />
      ) : null}

      {sites.length > 0 ? (
        <ul className={styles.cardGrid}>
          {sites.map((site, index) => {
            const siteServices = services.filter((s) => s.site_id === site.id);
            return (
              <li key={site.id}>
                <Link to={`/sites/${site.slug}`} className={styles.card}>
                  <div className={styles.cardMedia}>
                    <img
                      src={SITE_IMAGES[index % SITE_IMAGES.length]}
                      alt=""
                      className={styles.cardImage}
                      loading="lazy"
                    />
                  </div>

                  <div className={styles.cardBody}>
                    <p className={styles.kicker}>
                      <AppIcon name="globe" size={14} />
                      {site.country ?? "Location not specified"}
                    </p>
                    <h3 className={styles.cardTitle}>{site.name}</h3>

                    <div className={styles.cardFooter}>
                      <span className={styles.chips}>
                        {siteServices.length === 0 ? (
                          <span className={styles.chipMuted}>No services</span>
                        ) : (
                          siteServices.map((s) => (
                            <span key={s.id} className={styles.chip}>
                              {SERVICE_KIND_LABELS[s.kind]}
                            </span>
                          ))
                        )}
                      </span>
                      <span className={styles.cardArrow} aria-hidden="true">
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
