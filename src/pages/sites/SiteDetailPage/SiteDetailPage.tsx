// Location page (/sites/:slug): a secondary lens, reached only from a
// service page — never from the sidebar. Ground motion at a location is
// physically continuous, so this answers "what else has happened here":
// the geometry plus a chronological timeline of every service and report
// issue ever run at the location.
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { usePortalData } from "@/context/PortalDataContext";
import { useScopedHref } from "@/context/ScopeContext";
import { PortalPageHeader } from "@/components/layout/PortalShell/PortalPageHeader";
import { Card } from "@/components/ui/Card/Card";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import {
  REPORT_KIND_LABELS,
  REPORT_STATE_LABELS,
  SERVICE_KIND_LABELS,
  SERVICE_STATUS_LABELS,
} from "@/types/domain";
import { formatDate } from "@/lib/dates";
import styles from "./SiteDetailPage.module.css";

interface TimelineEvent {
  key: string;
  date: string | null;
  title: string;
  meta: string;
  to: string;
  status: string;
  statusLabel: string;
}

export function SiteDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { sites, services, reports, loading, error, refetch } = usePortalData();
  const href = useScopedHref();

  const site = sites.find((s) => s.slug === slug);

  const events = useMemo<TimelineEvent[]>(() => {
    if (!site) return [];
    const siteServices = services.filter((s) => s.site_id === site.id);
    const serviceIds = new Set(siteServices.map((s) => s.id));
    const siteReports = reports.filter((r) => serviceIds.has(r.service_id));

    const serviceEvents: TimelineEvent[] = siteServices.map((s) => ({
      key: `service-${s.id}`,
      date: s.started_on ?? s.requested_at ?? s.created_at,
      title: s.name || SERVICE_KIND_LABELS[s.kind],
      meta: SERVICE_KIND_LABELS[s.kind],
      to: `/services/${s.id}`,
      status: s.status,
      statusLabel: SERVICE_STATUS_LABELS[s.status],
    }));

    const reportEvents: TimelineEvent[] = siteReports.map((r) => ({
      key: `report-${r.id}`,
      date: r.published_at ?? r.created_at,
      title: r.headline ?? `${REPORT_KIND_LABELS[r.kind]} #${r.issue_number}`,
      meta: `${REPORT_KIND_LABELS[r.kind]} · Issue ${r.issue_number}`,
      to: `/reports/${r.id}`,
      status: r.state,
      statusLabel: REPORT_STATE_LABELS[r.state],
    }));

    return [...serviceEvents, ...reportEvents].sort((a, b) =>
      (b.date ?? "").localeCompare(a.date ?? ""),
    );
  }, [site, services, reports]);

  if (loading) {
    return <LoadingState label="Loading site…" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />;
  }

  if (!site) {
    return (
      <EmptyState
        title="Location not found"
        description="This location does not exist or you do not have access to it."
        action={<Link to={href("/")}>Back to overview</Link>}
      />
    );
  }

  const hasLocation =
    site.centroid_lat !== null && site.centroid_lon !== null;

  return (
    <div className={styles.page}>
      <PortalPageHeader
        crumbs={[
          { label: "Overview", to: "/" },
          { label: site.name },
        ]}
        title={site.name}
        lede={`${site.country ?? "Location not specified"}${
          site.description ? ` — ${site.description}` : ""
        }`}
      />

      <div className={styles.detailGrid}>
        <Card className={styles.locationCard}>
          <h2 className={styles.cardTitle}>Location</h2>
          {hasLocation ? (
            <dl className={styles.meta}>
              <div>
                <dt>Centroid</dt>
                <dd>
                  {site.centroid_lat?.toFixed(5)},{" "}
                  {site.centroid_lon?.toFixed(5)}
                </dd>
              </div>
              <div>
                <dt>Geometry</dt>
                <dd>{site.geometry ? "AOI polygon on file" : "Not captured"}</dd>
              </div>
            </dl>
          ) : (
            <p className={styles.emptyNote}>
              No geometry has been captured for this site yet. The map view
              appears once an area of interest is on file.
            </p>
          )}
        </Card>

        <Card className={styles.locationCard}>
          <h2 className={styles.cardTitle}>About this location</h2>
          <dl className={styles.meta}>
            <div>
              <dt>Country</dt>
              <dd>{site.country ?? "—"}</dd>
            </div>
            <div>
              <dt>Added</dt>
              <dd>{formatDate(site.created_at)}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <section aria-labelledby="timeline-heading" className={styles.section}>
        <h2 id="timeline-heading" className={styles.sectionTitle}>
          Timeline
        </h2>

        {events.length === 0 ? (
          <EmptyState
            title="Nothing at this location yet"
            description="Monitoring, screenings, and report issues here will appear in chronological order."
          />
        ) : (
          <ol className={styles.timeline}>
            {events.map((event) => (
              <li key={event.key} className={styles.timelineEntry}>
                <span className={styles.timelineDate}>
                  {formatDate(event.date)}
                </span>
                <Link to={href(event.to)} className={styles.timelineCard}>
                  <span className={styles.timelineTitle}>{event.title}</span>
                  <span className={styles.timelineMeta}>{event.meta}</span>
                  <StatusBadge
                    status={event.status}
                    label={event.statusLabel}
                  />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
