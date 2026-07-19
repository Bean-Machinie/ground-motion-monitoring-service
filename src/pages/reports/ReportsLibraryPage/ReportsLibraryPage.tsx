// Report library (/reports). A live summary strip plus Sort and Filter
// menus, all computed from ONE filtered array in one pass: the filter
// selection narrows `visibleReports`, the sort orders it, and the strip
// numbers, "latest" dates, and the card grid all re-derive together.
//
// Mechanics mirror the workspace pattern: one dropdown open at a time,
// outside-click / Escape closes, picking a sort option closes the menu,
// toggling a filter checkbox keeps it open so several can be flipped in
// a row. Sort/filter state deliberately resets on reload.
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { usePortalData } from "@/context/PortalDataContext";
import { PortalPageHeader } from "@/components/layout/PortalShell/PortalPageHeader";
import { AppIcon } from "@/components/ui/AppIcon/AppIcon";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import {
  REPORT_KIND_LABELS,
  REPORT_STATE_LABELS,
  serviceDisplayName,
  type Report,
} from "@/types/domain";
import { formatDate } from "@/lib/dates";
import styles from "./ReportsLibraryPage.module.css";

/* ------------------------------ Sorting --------------------------------- */

const SORT_OPTIONS = [
  { value: "latest", label: "Latest Activity" },
  { value: "status", label: "Status" },
  { value: "kind", label: "Report Kind" },
  { value: "service", label: "Service" },
  { value: "location", label: "Location" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];

/** One shared timeline for delivered and in-progress reports: whichever
    of published/updated/created exists first. */
function activityRank(report: Report): number {
  const value =
    report.published_at ?? report.updated_at ?? report.created_at;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

/** Pipeline-urgency order for the Status sort. */
const STATE_RANK: Record<Report["state"], number> = {
  failed: 0,
  processing: 1,
  in_review: 2,
  pending: 3,
  published: 4,
  superseded: 5,
};

const KIND_RANK: Record<Report["kind"], number> = {
  alert: 0,
  periodic: 1,
  screening: 2,
};

/* ------------------------------ Filtering ------------------------------- */

/** Customer-facing status buckets over the raw report states. */
const STATUS_FILTERS = [
  { value: "delivered", label: "Delivered" },
  { value: "in_progress", label: "In Progress" },
  { value: "failed", label: "Failed" },
  { value: "superseded", label: "Superseded" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];

function statusBucket(report: Report): StatusFilter {
  if (report.state === "published") return "delivered";
  if (report.state === "failed") return "failed";
  if (report.state === "superseded") return "superseded";
  return "in_progress";
}

const KIND_FILTERS = [
  { value: "screening", label: "Screening reports" },
  { value: "periodic", label: "Periodic issues" },
  { value: "alert", label: "Alert issues" },
] as const;

const ALL_STATUSES = STATUS_FILTERS.map((f) => f.value);
const ALL_KINDS = KIND_FILTERS.map((f) => f.value);
const FILTER_TOTAL = ALL_STATUSES.length + ALL_KINDS.length;

/* ------------------------------- The page ------------------------------- */

export function ReportsLibraryPage() {
  const { reports, loading, error, refetch, siteById, serviceById } =
    usePortalData();

  const [sortOption, setSortOption] = useState<SortOption>("latest");
  const [activeStatuses, setActiveStatuses] =
    useState<StatusFilter[]>([...ALL_STATUSES]);
  const [activeKinds, setActiveKinds] = useState<Report["kind"][]>([
    ...ALL_KINDS,
  ]);
  const [openMenu, setOpenMenu] = useState<"sort" | "filter" | null>(null);

  const sortRef = useRef<HTMLDivElement | null>(null);
  const filterRef = useRef<HTMLDivElement | null>(null);

  // One dropdown at a time; outside pointerdown or Escape closes it.
  useEffect(() => {
    if (!openMenu) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = openMenu === "sort" ? sortRef.current : filterRef.current;
      if (root && event.target instanceof Node && !root.contains(event.target)) {
        setOpenMenu(null);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu]);

  /* One pass: filter → sort → everything below derives from the result. */
  const visibleReports = useMemo(() => {
    const serviceName = (report: Report): string => {
      const service = serviceById.get(report.service_id);
      return service
        ? serviceDisplayName(service, siteById.get(service.site_id))
        : "";
    };
    const siteName = (report: Report): string => {
      const service = serviceById.get(report.service_id);
      return service ? (siteById.get(service.site_id)?.name ?? "") : "";
    };

    const compare = (a: Report, b: Report): number => {
      switch (sortOption) {
        case "status":
          return (
            STATE_RANK[a.state] - STATE_RANK[b.state] ||
            activityRank(b) - activityRank(a)
          );
        case "kind":
          return (
            KIND_RANK[a.kind] - KIND_RANK[b.kind] ||
            activityRank(b) - activityRank(a)
          );
        case "service":
          return (
            serviceName(a).localeCompare(serviceName(b)) ||
            b.issue_number - a.issue_number
          );
        case "location":
          return (
            siteName(a).localeCompare(siteName(b)) ||
            activityRank(b) - activityRank(a)
          );
        case "latest":
        default:
          return activityRank(b) - activityRank(a);
      }
    };

    return reports
      .filter(
        (r) =>
          activeStatuses.includes(statusBucket(r)) &&
          activeKinds.includes(r.kind),
      )
      .sort(compare);
  }, [reports, sortOption, activeStatuses, activeKinds, serviceById, siteById]);

  /* Summary strip: computed AFTER filtering, so unchecking a status also
     removes it from these numbers. */
  const summary = useMemo(() => {
    const delivered = visibleReports
      .filter((r) => statusBucket(r) === "delivered")
      .sort((a, b) => activityRank(b) - activityRank(a));
    const inProgress = visibleReports.filter(
      (r) => statusBucket(r) === "in_progress",
    );
    const byActivity = [...visibleReports].sort(
      (a, b) => activityRank(b) - activityRank(a),
    );
    const latest = byActivity[0];

    return {
      deliveredCount: delivered.length,
      inProgressCount: inProgress.length,
      latestDelivery: delivered[0]?.published_at
        ? formatDate(delivered[0].published_at)
        : "Pending",
      latestActivity: latest
        ? formatDate(
            latest.published_at ?? latest.updated_at ?? latest.created_at,
          )
        : "Pending",
    };
  }, [visibleReports]);

  const checkedCount = activeStatuses.length + activeKinds.length;
  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === sortOption)?.label ?? "";

  const toggleStatus = (value: StatusFilter) =>
    setActiveStatuses((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value],
    );
  const toggleKind = (value: Report["kind"]) =>
    setActiveKinds((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value],
    );

  if (loading) {
    return <LoadingState label="Loading your reports…" />;
  }

  return (
    <div className={styles.page}>
      <PortalPageHeader
        crumbs={[{ label: "Overview", to: "/" }, { label: "Reports" }]}
        title="Reports"
        lede="Every screening report and monitoring issue delivered to your account, in one place."
      />

      {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

      {/* ------------------------ Summary strip ------------------------- */}
      <div className={styles.strip}>
        <div className={styles.stripFacts}>
          <span className={styles.stripFact}>
            <strong>{summary.deliveredCount}</strong>{" "}
            {summary.deliveredCount === 1 ? "Report" : "Reports"} Delivered
          </span>
          <span className={styles.stripFact}>
            <strong>{summary.inProgressCount}</strong> In Progress
          </span>
          <span className={styles.stripFact}>
            Latest Delivery: <strong>{summary.latestDelivery}</strong>
          </span>
          <span className={styles.stripFact}>
            Latest Activity: <strong>{summary.latestActivity}</strong>
          </span>
        </div>

        <div className={styles.stripControls}>
          {/* Sort: radio-style, closes on pick. */}
          <div className={styles.menuRoot} ref={sortRef}>
            <button
              type="button"
              className={`${styles.menuButton}${
                openMenu === "sort" ? ` ${styles.menuButtonOpen}` : ""
              }`}
              aria-haspopup="menu"
              aria-expanded={openMenu === "sort"}
              onClick={() =>
                setOpenMenu((m) => (m === "sort" ? null : "sort"))
              }
            >
              Sort <span className={styles.menuButtonValue}>{sortLabel}</span>
            </button>
            {openMenu === "sort" ? (
              <div className={styles.menu} role="menu" aria-label="Sort reports">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={sortOption === option.value}
                    className={`${styles.menuItem} ${
                      sortOption === option.value ? styles.menuItemActive : ""
                    }`}
                    onClick={() => {
                      setSortOption(option.value);
                      setOpenMenu(null);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Filter: checkboxes, stays open for several toggles. */}
          <div className={styles.menuRoot} ref={filterRef}>
            <button
              type="button"
              className={`${styles.menuButton}${
                openMenu === "filter" ? ` ${styles.menuButtonOpen}` : ""
              }`}
              aria-haspopup="menu"
              aria-expanded={openMenu === "filter"}
              onClick={() =>
                setOpenMenu((m) => (m === "filter" ? null : "filter"))
              }
            >
              Filter{" "}
              <span className={styles.menuButtonValue}>
                {checkedCount}/{FILTER_TOTAL}
              </span>
            </button>
            {openMenu === "filter" ? (
              <div
                className={styles.menu}
                role="menu"
                aria-label="Filter reports"
              >
                <p className={styles.menuGroupLabel}>Status</p>
                {STATUS_FILTERS.map((option) => (
                  <label key={option.value} className={styles.menuCheck}>
                    <input
                      type="checkbox"
                      checked={activeStatuses.includes(option.value)}
                      onChange={() => toggleStatus(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
                <p className={styles.menuGroupLabel}>Kind</p>
                {KIND_FILTERS.map((option) => (
                  <label key={option.value} className={styles.menuCheck}>
                    <input
                      type="checkbox"
                      checked={activeKinds.includes(option.value)}
                      onChange={() => toggleKind(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* --------------------------- Card grid -------------------------- */}
      {reports.length === 0 ? (
        <EmptyState
          title="No reports yet"
          description="Delivered screening reports and monitoring issues will accumulate here."
        />
      ) : visibleReports.length === 0 ? (
        <EmptyState
          title="No reports match these filters"
          description="Re-enable some statuses or kinds in the Filter menu."
        />
      ) : (
        <ul className={styles.cardGrid}>
          {visibleReports.map((report) => {
            const service = serviceById.get(report.service_id);
            const site = service ? siteById.get(service.site_id) : undefined;
            return (
              <li key={report.id}>
                <Link to={`/reports/${report.id}`} className={styles.card}>
                  <div className={styles.cardTop}>
                    <span className={styles.iconChip} aria-hidden="true">
                      <AppIcon name="file" size={22} />
                    </span>
                    <StatusBadge
                      status={report.state}
                      label={REPORT_STATE_LABELS[report.state]}
                    />
                  </div>

                  <p className={styles.kicker}>
                    {REPORT_KIND_LABELS[report.kind]} · Issue{" "}
                    {report.issue_number}
                  </p>
                  <h3 className={styles.cardTitle}>
                    {report.headline ??
                      `${REPORT_KIND_LABELS[report.kind]} #${report.issue_number}`}
                  </h3>
                  <p className={styles.cardSite}>
                    {service
                      ? serviceDisplayName(service, site)
                      : (site?.name ?? "—")}
                  </p>

                  <div className={styles.cardFooter}>
                    <span className={styles.cardDate}>
                      {report.published_at
                        ? formatDate(report.published_at)
                        : "Not yet published"}
                    </span>
                    <span className={styles.cardArrow} aria-hidden="true">
                      →
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
