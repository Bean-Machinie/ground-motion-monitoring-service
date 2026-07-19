// Overview (/) — three questions, in order: does anything need me, what
// do I have, what happened since I last looked. Nothing else.
//
//   1. Attention banner (only when something needs acting on).
//   2. Monitoring, then Screenings: portrait cards — sparkline header,
//      kicker, name, location, status pill, labelled facts, action.
//   3. Recent activity in a right-hand column, so the wide screen is
//      actually used.
import { useMemo } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { usePortalData } from "@/context/PortalDataContext";
import { usePortalCrumbs } from "@/components/layout/PortalShell/PortalShell";
import { ActivityFeed } from "@/components/portal/ActivityFeed/ActivityFeed";
import { AppIcon } from "@/components/ui/AppIcon/AppIcon";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import {
  serviceDisplayName,
  shortLocation,
  type Report,
  type Service,
} from "@/types/domain";
import { formatShortDate } from "@/lib/dates";
import { buildActivity } from "@/lib/activity";
import styles from "./WorkspacePage.module.css";

/** Legacy ?tab=… URLs map onto the new routes. */
const LEGACY_TAB_ROUTES: Record<string, string> = {
  overview: "/",
  monitoring: "/",
  reports: "/reports",
};

const MAX_CHART_POINTS = 15;
const FEED_CAP = 8;

/* ------------------------------ Card state ------------------------------ */

type DotTone = "success" | "danger" | "warning" | "neutral";

interface CardState {
  word: string;
  tone: DotTone;
}

/** Customer vocabulary, per product. Never "Completed" for a screening —
    the customer's word is "Delivered". */
function cardState(
  service: Service,
  hasOpenAlert: boolean,
  isOverdue: boolean,
): CardState {
  if (service.status === "scoping") return { word: "Being scoped", tone: "warning" };
  if (service.status === "quoted") return { word: "Quoted", tone: "warning" };

  if (service.kind === "monitoring") {
    if (hasOpenAlert) return { word: "Alert open", tone: "danger" };
    if (isOverdue) return { word: "Report overdue", tone: "warning" };
    if (service.status === "active") return { word: "Stable", tone: "success" };
    if (service.status === "paused") return { word: "Paused", tone: "neutral" };
    return { word: "Ended", tone: "neutral" };
  }

  if (service.status === "active") return { word: "In progress", tone: "success" };
  if (service.status === "completed") return { word: "Delivered", tone: "neutral" };
  return { word: "Ended", tone: "neutral" };
}

/* ------------------------------ Chart data ------------------------------ */

/** Cumulative-displacement series: one point per published issue for
    monitoring, the published report's per-epoch curve for a screening. */
function chartSeries(service: Service, serviceReports: Report[]): number[] {
  const published = serviceReports
    .filter((r) => r.state === "published")
    .sort((a, b) => a.issue_number - b.issue_number);

  if (service.kind === "screening") {
    const latest = published[published.length - 1];
    if (latest?.series_mm && Array.isArray(latest.series_mm)) {
      const series = latest.series_mm.filter(
        (v): v is number => typeof v === "number",
      );
      if (series.length > 0) return downsample(series);
    }
  }

  return downsample(
    published
      .map((r) => r.cumulative_mm)
      .filter((v): v is number => v !== null),
  );
}

function downsample(series: number[]): number[] {
  if (series.length <= MAX_CHART_POINTS) return series;
  const step = (series.length - 1) / (MAX_CHART_POINTS - 1);
  return Array.from(
    { length: MAX_CHART_POINTS },
    (_, i) => series[Math.round(i * step)] as number,
  );
}

/** −14 → "−14", −0.42 → "−0.4". Unicode minus, like the reports. */
function formatMm(value: number): string {
  const rounded =
    Math.abs(value) >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return String(rounded).replace("-", "−");
}

/** Displacement over the alert window when an alert is open, mean
    velocity when stable, total displacement for a delivered screening. */
function headlineFigure(
  service: Service,
  serviceReports: Report[],
  hasOpenAlert: boolean,
): string | null {
  const published = serviceReports
    .filter((r) => r.state === "published" && r.cumulative_mm !== null)
    .sort((a, b) => a.issue_number - b.issue_number);
  const latest = published[published.length - 1];

  if (service.kind === "screening") {
    if (latest?.cumulative_mm == null) return null;
    return `${formatMm(latest.cumulative_mm)} mm total`;
  }

  if (hasOpenAlert && published.length >= 2 && latest) {
    const previous = published[published.length - 2];
    const delta =
      (latest.cumulative_mm as number) - (previous?.cumulative_mm as number);
    const start = latest.period_start ? Date.parse(latest.period_start) : NaN;
    const end = latest.period_end ? Date.parse(latest.period_end) : NaN;
    const weeks =
      Number.isFinite(start) && Number.isFinite(end)
        ? Math.max(1, Math.round((end - start) / (7 * 86400000)))
        : null;
    return weeks
      ? `${formatMm(delta)} mm / ${weeks} wks`
      : `${formatMm(delta)} mm`;
  }

  if (published.length >= 2 && latest) {
    const first = published[0];
    const firstDate = Date.parse(
      first?.period_end ?? first?.published_at ?? "",
    );
    const lastDate = Date.parse(latest.period_end ?? latest.published_at ?? "");
    const years = (lastDate - firstDate) / (365.25 * 86400000);
    if (years > 0) {
      const velocity =
        ((latest.cumulative_mm as number) -
          (first?.cumulative_mm as number)) /
        years;
      return `${formatMm(velocity)} mm / yr`;
    }
  }

  return null;
}

/* ------------------------------ Sparkline ------------------------------- */

const CHART_STROKES: Record<string, string> = {
  danger: "#E24B4A",
  active: "#1D9E75",
  muted: "#888780",
};

function chartStroke(service: Service, hasOpenAlert: boolean): string {
  if (hasOpenAlert) return CHART_STROKES.danger as string;
  if (service.status === "active") return CHART_STROKES.active as string;
  return CHART_STROKES.muted as string;
}

function Sparkline({ series, stroke }: { series: number[]; stroke: string }) {
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const points = series
    .map((value, i) => {
      const x = (i / (series.length - 1)) * 100;
      const y = 10 + ((max - value) / span) * 50;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 70"
      className={styles.chart}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ------------------------------- The page ------------------------------- */

export function WorkspacePage() {
  const {
    services,
    reports,
    alerts,
    siteById,
    loading,
    error,
    refetch,
    attention,
  } = usePortalData();

  const [searchParams] = useSearchParams();

  usePortalCrumbs(useMemo(() => [{ label: "Overview" }], []));

  const alertedServiceIds = useMemo(
    () =>
      new Set(
        alerts.filter((a) => !a.acknowledged_at).map((a) => a.service_id),
      ),
    [alerts],
  );
  const overdueServiceIds = useMemo(
    () => new Set(attention.overdueServices.map((s) => s.id)),
    [attention.overdueServices],
  );

  const events = useMemo(
    () => buildActivity(services, reports, alerts, siteById).slice(0, FEED_CAP),
    [services, reports, alerts, siteById],
  );

  // Redirect legacy tab URLs to their new homes.
  const legacyTab = searchParams.get("tab");
  if (legacyTab) {
    return <Navigate to={LEGACY_TAB_ROUTES[legacyTab] ?? "/"} replace />;
  }

  if (loading) {
    return <LoadingState label="Loading your overview…" />;
  }

  const reportsFor = (serviceId: string) =>
    reports.filter((r) => r.service_id === serviceId);

  /** Urgency order inside a section: alerts, overdue, running, request
      stage, then the rest. */
  const urgency = (s: Service): number => {
    if (alertedServiceIds.has(s.id)) return 0;
    if (overdueServiceIds.has(s.id)) return 1;
    if (s.status === "active") return 2;
    if (s.status === "scoping" || s.status === "quoted") return 3;
    return 4;
  };
  const bySectionOrder = (a: Service, b: Service) => urgency(a) - urgency(b);

  const monitoring = services
    .filter((s) => s.kind === "monitoring")
    .sort(bySectionOrder);
  const screenings = services
    .filter((s) => s.kind === "screening")
    .sort(bySectionOrder);

  const isNewCustomer = services.length === 0;

  /* ----------------------------- Card ---------------------------------- */

  const renderCard = (service: Service) => {
    const site = siteById.get(service.site_id);
    const serviceReports = reportsFor(service.id);
    const hasOpenAlert = alertedServiceIds.has(service.id);
    const isOverdue = overdueServiceIds.has(service.id);
    const state = cardState(service, hasOpenAlert, isOverdue);
    const inRequestStage =
      service.status === "scoping" || service.status === "quoted";
    const series = inRequestStage ? [] : chartSeries(service, serviceReports);
    const figure = inRequestStage
      ? null
      : headlineFigure(service, serviceReports, hasOpenAlert);
    const deliveredScreening =
      service.kind === "screening" && service.status === "completed";
    const latestPublished = serviceReports
      .filter((r) => r.state === "published")
      .sort((a, b) => b.issue_number - a.issue_number)[0];

    /* Labelled facts, example-style: two small label/value pairs. */
    let facts: { label: string; value: string; warning?: boolean }[];
    if (inRequestStage) {
      facts = [
        {
          label: "Stage",
          value: service.status === "quoted" ? "Quoted" : "Requested",
        },
        { label: "Requested", value: formatShortDate(service.requested_at) },
      ];
    } else if (deliveredScreening) {
      facts = [
        { label: "Total motion", value: figure ?? "—" },
        {
          label: "Delivered",
          value: formatShortDate(
            latestPublished?.published_at ?? service.ended_on,
          ),
        },
      ];
    } else if (service.kind === "monitoring") {
      facts = [
        { label: "Motion", value: figure ?? "No data yet" },
        isOverdue
          ? {
              label: "Next report",
              value: `Due ${formatShortDate(service.next_issue_due)} · overdue`,
              warning: true,
            }
          : {
              label: "Next report",
              value: service.next_issue_due
                ? formatShortDate(service.next_issue_due)
                : "—",
            },
      ];
    } else {
      facts = [
        { label: "Motion", value: figure ?? "No data yet" },
        { label: "Latest report", value: latestPublished ? "Published" : "Pending" },
      ];
    }

    const action = deliveredScreening
      ? "Read Report"
      : inRequestStage
        ? "View Request"
        : service.kind === "monitoring"
          ? "Open Monitoring"
          : "Open Screening";

    return (
      <li key={service.id}>
        <Link to={`/services/${service.id}`} className={styles.card}>
          {/* Chart header: the card's visual, like the photo slot in the
              reference — but showing real motion data. */}
          <div className={styles.chartHead}>
            {inRequestStage ? (
              <span className={styles.chartNote}>
                We're reviewing your request
              </span>
            ) : series.length >= 3 ? (
              <Sparkline
                series={series}
                stroke={chartStroke(service, hasOpenAlert)}
              />
            ) : (
              <svg
                viewBox="0 0 100 70"
                className={styles.chart}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <line
                  x1="6"
                  y1="35"
                  x2="94"
                  y2="35"
                  stroke="var(--color-border-strong)"
                  strokeWidth="1.5"
                  strokeDasharray="3 4"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            )}
          </div>

          <div className={styles.cardBody}>
            <p className={styles.cardKicker}>
              {service.kind === "monitoring"
                ? "Quarterly monitoring"
                : "Screening report"}
            </p>
            <h3 className={styles.cardName}>
              {serviceDisplayName(service, site)}
            </h3>
            <p className={styles.cardLocation}>{shortLocation(site)}</p>

            <span className={`${styles.pill} ${styles[`pill_${state.tone}`]}`}>
              {state.word}
            </span>

            <dl className={styles.facts}>
              {facts.map((fact) => (
                <div key={fact.label} className={styles.fact}>
                  <dt>{fact.label}</dt>
                  <dd className={fact.warning ? styles.factWarning : undefined}>
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>

            <span className={styles.cardButton}>{action}</span>
          </div>
        </Link>
      </li>
    );
  };

  /* --------------------------- Section header --------------------------- */

  const countParts = (list: Service[], kind: Service["kind"]): string => {
    const parts: string[] = [];
    const running = list.filter((s) => s.status === "active").length;
    const delivered = list.filter((s) => s.status === "completed").length;
    const scoped = list.filter(
      (s) => s.status === "scoping" || s.status === "quoted",
    ).length;
    const paused = list.filter((s) => s.status === "paused").length;

    if (kind === "monitoring") {
      if (running > 0) parts.push(`${running} running`);
      if (scoped > 0) parts.push(`${scoped} being scoped`);
      if (paused > 0) parts.push(`${paused} paused`);
    } else {
      if (delivered > 0) parts.push(`${delivered} delivered`);
      if (running > 0) parts.push(`${running} in progress`);
      if (scoped > 0) parts.push(`${scoped} being scoped`);
    }
    return parts.join(" · ");
  };

  const renderSection = (
    kind: Service["kind"],
    list: Service[],
    heading: string,
    explainer: string,
  ) => {
    // Hide a section the customer has none of — except for a brand-new
    // customer, where both sections teach the product model.
    if (list.length === 0 && !isNewCustomer) return null;

    return (
      <section aria-label={heading} className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>{heading}</h2>
          {list.length > 0 ? (
            <span className={styles.sectionCount}>
              {countParts(list, kind)}
            </span>
          ) : null}
        </div>
        <p className={styles.sectionExplainer}>{explainer}</p>

        {list.length > 0 ? (
          <ul className={styles.cardGrid}>{list.map(renderCard)}</ul>
        ) : (
          <p className={styles.sectionEmpty}>
            Nothing here yet —{" "}
            <Link to={`/requests/new?product=${kind}`}>
              start with a new request
            </Link>
            .
          </p>
        )}
      </section>
    );
  };

  return (
    <div className={styles.page}>
      {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

      {/* 1. Does anything need me? Rendered only when the answer is yes. */}
      {attention.count > 0 ? (
        <Link to="/attention" className={styles.banner}>
          <span className={styles.bannerIcon} aria-hidden="true">
            <AppIcon name="warning" size={16} />
          </span>
          <span className={styles.bannerText}>
            {attention.count} {attention.count === 1 ? "thing needs" : "things need"}{" "}
            attention
          </span>
          <span className={styles.bannerAction}>Review →</span>
        </Link>
      ) : null}

      {/* 2 + 3. Products on the left, activity on the right. */}
      <div className={styles.columns}>
        <div className={styles.main}>
          {renderSection(
            "monitoring",
            monitoring,
            "Monitoring",
            "A new report every quarter, plus an alert if something moves.",
          )}
          {renderSection(
            "screening",
            screenings,
            "Screenings",
            "A one-off assessment. A single report, delivered once.",
          )}
        </div>

        {events.length > 0 ? (
          <aside aria-label="Recent activity" className={styles.aside}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Recent activity</h2>
            </div>
            <ActivityFeed events={events} />
            <Link to="/activity" className={styles.asideLink}>
              All activity →
            </Link>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
