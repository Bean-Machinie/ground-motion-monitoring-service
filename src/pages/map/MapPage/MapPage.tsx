// /map — every site on one map. A lightweight plot of site centroids
// (no tile service is wired up yet); each marker links to its site.
// Sites without geometry are listed honestly below the plot.
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { usePortalData } from "@/context/PortalDataContext";
import { PortalPageHeader } from "@/components/layout/PortalShell/PortalPageHeader";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { AppIcon } from "@/components/ui/AppIcon/AppIcon";
import type { Site } from "@/types/domain";
import styles from "./MapPage.module.css";

interface PlacedSite {
  site: Site;
  /** Percentage position within the plot area. */
  x: number;
  y: number;
}

/** Equirectangular placement of centroids within padded bounds. */
function placeSites(sites: Site[]): PlacedSite[] {
  const located = sites.filter(
    (s) => s.centroid_lat !== null && s.centroid_lon !== null,
  );
  if (located.length === 0) return [];

  const lats = located.map((s) => s.centroid_lat as number);
  const lons = located.map((s) => s.centroid_lon as number);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  // Padded spans so single sites and tight clusters stay off the edges.
  const latSpan = Math.max(maxLat - minLat, 2);
  const lonSpan = Math.max(maxLon - minLon, 4);
  const latMid = (minLat + maxLat) / 2;
  const lonMid = (minLon + maxLon) / 2;

  return located.map((site) => ({
    site,
    x:
      50 +
      (((site.centroid_lon as number) - lonMid) / (lonSpan * 1.3)) * 100,
    y:
      50 -
      (((site.centroid_lat as number) - latMid) / (latSpan * 1.3)) * 100,
  }));
}

export function MapPage() {
  const { sites, services, loading, error, refetch } = usePortalData();

  // Service-first: a marker opens the most recent service at the
  // location (the location page itself is reached from service pages).
  const primaryTarget = (site: Site): string => {
    const service = services.find((s) => s.site_id === site.id);
    return service ? `/services/${service.id}` : `/sites/${site.slug}`;
  };

  const placed = useMemo(() => placeSites(sites), [sites]);
  const unmapped = sites.filter(
    (s) => s.centroid_lat === null || s.centroid_lon === null,
  );

  if (loading) {
    return <LoadingState label="Loading the map…" />;
  }

  return (
    <div className={styles.page}>
      <PortalPageHeader
        crumbs={[{ label: "Workspace", to: "/" }, { label: "Map view" }]}
        title="Map view"
        lede="All of your locations in one place. Select a marker to open the work there."
      />

      {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

      {sites.length === 0 ? (
        <EmptyState
          title="No locations yet"
          description="When an area of interest is set up for your account, it will appear on this map."
          action={<Link to="/requests/new">Start with a new request →</Link>}
        />
      ) : placed.length === 0 ? (
        <EmptyState
          title="No geometry yet"
          description="None of your locations has a captured centroid yet. Once geometry is on file, they will appear here."
        />
      ) : (
        <div
          className={styles.plot}
          role="img"
          aria-label="Map of your locations"
        >
          <div className={styles.plotGrid} aria-hidden="true" />
          {placed.map(({ site, x, y }) => (
            <Link
              key={site.id}
              to={primaryTarget(site)}
              className={styles.marker}
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <span className={styles.markerDot} aria-hidden="true" />
              <span className={styles.markerLabel}>{site.name}</span>
            </Link>
          ))}
        </div>
      )}

      {unmapped.length > 0 && placed.length > 0 ? (
        <section className={styles.unmapped}>
          <h2 className={styles.unmappedTitle}>Not on the map yet</h2>
          <ul className={styles.unmappedList}>
            {unmapped.map((site) => (
              <li key={site.id}>
                <Link to={primaryTarget(site)} className={styles.unmappedLink}>
                  <AppIcon name="globe" size={14} />
                  {site.name}
                  <span className={styles.unmappedNote}>
                    — no geometry on file
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
