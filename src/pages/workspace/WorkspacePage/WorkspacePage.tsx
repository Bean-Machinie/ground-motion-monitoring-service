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
import { Sparkline } from "@/components/ui/Sparkline/Sparkline";
import {
  formatMetricValue,
  reportChartSeries,
  reportHeadlineMetric,
  serviceDisplayName,
  shortLocation,
  type Service,
} from "@/types/domain";
import { formatShortDate } from "@/lib/dates";
import { buildActivity } from "@/lib/activity";
import card1 from "@/assets/images/card-1.png";
import card2 from "@/assets/images/card-2.png";
import card3 from "@/assets/images/card-3.jpg";
import styles from "./WorkspacePage.module.css";

/** Placeholder card images, cycled 1 → 2 → 3 → 1 within each section.
    Custom per-service images come later. */
const CARD_IMAGES = [card1, card2, card3];

/** Legacy ?tab=… URLs map onto the new routes. */
const LEGACY_TAB_ROUTES: Record<string, string> = {
  overview: "/",
  monitoring: "/",
  reports: "/reports",
};

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

/* ---------------------------- Motion figures ---------------------------- */

/** headline_metric tones → stroke/text colours. */
const METRIC_TONE_COLORS = {
  danger: "var(--color-danger)",
  warning: "var(--color-warning)",
  neutral: "var(--color-text-subtle)",
} as const;

/** Sparkline fallback when the report carries no metric: the service
    status colour, via the card-state tone. */
const STATE_TONE_COLORS: Record<DotTone, string> = {
  success: "var(--color-success)",
  danger: "var(--color-danger)",
  warning: "var(--color-warning)",
  neutral: "var(--color-text-subtle)",
};

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

  const renderCard = (service: Service, index: number) => {
    const site = siteById.get(service.site_id);
    const serviceReports = reportsFor(service.id);
    const hasOpenAlert = alertedServiceIds.has(service.id);
    const isOverdue = overdueServiceIds.has(service.id);
    const state = cardState(service, hasOpenAlert, isOverdue);
    const inRequestStage =
      service.status === "scoping" || service.status === "quoted";
    const deliveredScreening =
      service.kind === "screening" && service.status === "completed";
    const latestPublished = serviceReports
      .filter((r) => r.state === "published")
      .sort((a, b) => b.issue_number - a.issue_number)[0];

    // Hand-entered payload of the most recent published report. Either
    // may be absent — the card must look deliberate in all four
    // combinations, so absence removes the element, never substitutes a
    // placeholder.
    const metric = latestPublished
      ? reportHeadlineMetric(latestPublished)
      : null;
    const series =
      latestPublished && !inRequestStage
        ? reportChartSeries(latestPublished)
        : [];
    const metricText = metric
      ? `${formatMetricValue(metric.value)} ${metric.unit}`
      : null;
    const sparkStroke = metric
      ? METRIC_TONE_COLORS[metric.tone]
      : STATE_TONE_COLORS[state.tone];

    // No metric → the date of the most recent report in its place.
    const lastReportLine = latestPublished
      ? `Last report ${formatShortDate(latestPublished.published_at)}`
      : "No reports yet";

    /* Labelled facts: two small label/value pairs, except that a missing
       metric renders the last-report date as a plain 13px line. */
    type Fact =
      | { label: string; value: string; warning?: boolean }
      | { plain: string };
    const motionFact: Fact = metricText
      ? { label: "Motion", value: metricText }
      : { plain: lastReportLine };

    let facts: Fact[];
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
        metricText
          ? { label: "Total motion", value: metricText }
          : { plain: lastReportLine },
        {
          label: "Delivered",
          value: formatShortDate(
            latestPublished?.published_at ?? service.ended_on,
          ),
        },
      ];
    } else if (service.kind === "monitoring") {
      facts = [
        motionFact,
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
        motionFact,
        { label: "Latest report", value: latestPublished ? "Published" : "Pending" },
      ];
    }

    return (
      <li key={service.id}>
        {/* No action button: the whole card is the link. */}
        <Link to={`/services/${service.id}`} className={styles.card}>
          {/* Placeholder image, cycled 1-3; custom images come later.
              The status pill sits on the image, top-left. */}
          <div className={styles.imageHead}>
            <img
              src={CARD_IMAGES[index % CARD_IMAGES.length]}
              alt=""
              className={styles.cardImage}
              loading="lazy"
            />
            <span className={`${styles.pill} ${styles[`pill_${state.tone}`]}`}>
              {state.word}
            </span>
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

            {/* 70px sparkline slot: series present → trend line; absent →
                nothing at all, and the card is simply shorter. */}
            {series.length >= 2 ? (
              <div className={styles.cardSpark}>
                <Sparkline points={series} stroke={sparkStroke} height={70} />
              </div>
            ) : null}

            <dl className={styles.facts}>
              {facts.map((fact, i) =>
                "plain" in fact ? (
                  <div key={i} className={styles.fact}>
                    <span className={styles.factPlain}>{fact.plain}</span>
                  </div>
                ) : (
                  <div key={fact.label} className={styles.fact}>
                    <dt>{fact.label}</dt>
                    <dd
                      className={fact.warning ? styles.factWarning : undefined}
                    >
                      {fact.value}
                    </dd>
                  </div>
                ),
              )}
            </dl>
          </div>
        </Link>
      </li>
    );
  };

  /* --------------------------- Section header --------------------------- */

  const countParts = (
    list: Service[],
    kind: Service["kind"],
  ): { value: number; label: string }[] => {
    const parts: { value: number; label: string }[] = [];
    const running = list.filter((s) => s.status === "active").length;
    const delivered = list.filter((s) => s.status === "completed").length;
    const scoped = list.filter(
      (s) => s.status === "scoping" || s.status === "quoted",
    ).length;
    const paused = list.filter((s) => s.status === "paused").length;

    if (kind === "monitoring") {
      if (running > 0) parts.push({ value: running, label: "running" });
      if (scoped > 0) parts.push({ value: scoped, label: "being scoped" });
      if (paused > 0) parts.push({ value: paused, label: "paused" });
    } else {
      if (delivered > 0) parts.push({ value: delivered, label: "delivered" });
      if (running > 0) parts.push({ value: running, label: "in progress" });
      if (scoped > 0) parts.push({ value: scoped, label: "being scoped" });
    }
    return parts;
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
        {/* Reports-library-style strip: hairlines above and below, the
            title divided from the counts — and the counts from each
            other — by vertical rules. */}
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>{heading}</h2>
          {list.length > 0 && countParts(list, kind).length > 0 ? (
            <span className={styles.sectionFacts}>
              {countParts(list, kind).map((part) => (
                <span key={part.label} className={styles.sectionFact}>
                  <strong>{part.value}</strong> {part.label}
                </span>
              ))}
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
