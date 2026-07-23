// The services tree: MONITORING and SCREENINGS groups (static 11px
// labels, never nodes), one branch row per service — the customer's own
// name for the work — opening onto report-issue leaves. Depth is capped
// at two. A chevron renders only when there are two or more issues;
// leaves are capped at four (most recent first) with an "All N issues →"
// row after them. Expansion persists per service in localStorage, the
// ancestor of the current route auto-expands, and arrow keys walk the
// tree (role="tree"). Collapsed to the icon rail, the whole tree becomes
// one icon opening a flyout.
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { usePortalData } from "@/context/PortalDataContext";
import { useScope, useScopedHref, scopeBasePath } from "@/context/ScopeContext";
import { AppIcon } from "@/components/ui/AppIcon/AppIcon";
import {
  SERVICE_STATUS_LABELS,
  serviceDisplayName,
  type Report,
  type Service,
} from "@/types/domain";
import { formatQuarter, formatShortDate } from "@/lib/dates";
import styles from "./Sidebar.module.css";

const EXPANDED_KEY = "heliosyn.sidebar.services.expanded";
/** The old site→service tree's expansion state — cleared on first load. */
const LEGACY_EXPANDED_KEY = "heliosyn.sidebar.sites.expanded";
const LEAF_CAP = 4;

function readExpanded(): Record<string, boolean> {
  try {
    window.localStorage.removeItem(LEGACY_EXPANDED_KEY);
    const raw = window.localStorage.getItem(EXPANDED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function persistExpanded(value: Record<string, boolean>) {
  try {
    window.localStorage.setItem(EXPANDED_KEY, JSON.stringify(value));
  } catch {
    /* private mode — expansion just won't persist */
  }
}

/** Short leaf label only — never the full report title; the column is
    too narrow. "Q2 2026", "Alert — 8 Jul", "Report 2". */
function leafLabel(report: Report): string {
  if (report.kind === "alert") {
    return `Alert — ${formatShortDate(report.published_at ?? report.created_at)}`;
  }
  if (report.kind === "periodic") {
    const quarter = formatQuarter(
      report.period_end ?? report.published_at ?? report.created_at,
    );
    if (quarter) return quarter;
  }
  return `Report ${report.issue_number}`;
}

/** Most recent activity on a service, for sort order. */
function lastActivity(service: Service, serviceReports: Report[]): string {
  const dates = serviceReports.map(
    (r) => r.published_at ?? r.updated_at ?? r.created_at,
  );
  dates.push(service.updated_at);
  return dates.reduce((a, b) => (b > a ? b : a), "");
}

/** Branch status dot: danger for an unacknowledged alert, warning for
    overdue or scoping/quoted, success for active, neutral for
    completed/paused/cancelled. */
function serviceDotTone(
  service: Service,
  alertedServiceIds: Set<string>,
  overdueServiceIds: Set<string>,
): "danger" | "success" | "warning" | "neutral" {
  if (alertedServiceIds.has(service.id)) return "danger";
  if (overdueServiceIds.has(service.id)) return "warning";
  if (service.status === "scoping" || service.status === "quoted") {
    return "warning";
  }
  if (service.status === "active") return "success";
  return "neutral";
}

/** Resolves which service (and report) the current route belongs to, so
    the tree can auto-expand the ancestor and mark the path active. */
function useActiveContext(): {
  serviceId: string | null;
  reportId: string | null;
} {
  const { pathname } = useLocation();
  const { reports } = usePortalData();
  const { mode, customerId } = useScope();

  return useMemo(() => {
    // In admin scope the portal lives under /admin/c/:customerId; strip
    // that prefix so the matchers below stay scope-agnostic.
    const base = scopeBasePath(mode, customerId);
    const path =
      base && pathname.startsWith(base)
        ? pathname.slice(base.length) || "/"
        : pathname;

    const serviceMatch = path.match(
      /^\/services\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
    );
    if (serviceMatch?.[1]) {
      return { serviceId: serviceMatch[1], reportId: null };
    }

    const reportMatch = path.match(/^\/reports\/([^/]+)$/);
    if (reportMatch) {
      const report = reports.find((r) => r.id === reportMatch[1]);
      if (report) return { serviceId: report.service_id, reportId: report.id };
    }

    return { serviceId: null, reportId: null };
  }, [pathname, reports, mode, customerId]);
}

interface TreeNode {
  id: string;
  kind: "branch" | "leaf" | "all";
  service: Service;
  report?: Report;
}

interface ServiceTreeProps {
  collapsed: boolean;
}

export function ServiceTree({ collapsed }: ServiceTreeProps) {
  const { services, reports, alerts, siteById, loading } = usePortalData();
  const href = useScopedHref();
  const { serviceId: activeServiceId, reportId: activeReportId } =
    useActiveContext();

  const [expanded, setExpanded] =
    useState<Record<string, boolean>>(readExpanded);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  // Fixed-position anchor for the flyout so it escapes the sidebar's
  // overflow clipping.
  const [flyoutPos, setFlyoutPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const rowRefs = useRef(new Map<string, HTMLAnchorElement>());
  const flyoutRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  /* ------------------------------ Derivations --------------------------- */

  const alertedServiceIds = useMemo(
    () =>
      new Set(
        alerts.filter((a) => !a.acknowledged_at).map((a) => a.service_id),
      ),
    [alerts],
  );

  const overdueServiceIds = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return new Set(
      services
        .filter(
          (s) =>
            s.kind === "monitoring" &&
            s.status === "active" &&
            s.next_issue_due !== null &&
            s.next_issue_due < today,
        )
        .map((s) => s.id),
    );
  }, [services]);

  // Issues per service, most recent first.
  const reportsByService = useMemo(() => {
    const map = new Map<string, Report[]>();
    for (const report of reports) {
      const list = map.get(report.service_id);
      if (list) list.push(report);
      else map.set(report.service_id, [report]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => b.issue_number - a.issue_number);
    }
    return map;
  }, [reports]);

  // Branches within each group: open alerts first, then most recent
  // activity.
  const sortServices = useMemo(() => {
    return (list: Service[]) =>
      [...list].sort((a, b) => {
        const aAlert = alertedServiceIds.has(a.id) ? 0 : 1;
        const bAlert = alertedServiceIds.has(b.id) ? 0 : 1;
        if (aAlert !== bAlert) return aAlert - bAlert;
        return lastActivity(b, reportsByService.get(b.id) ?? []).localeCompare(
          lastActivity(a, reportsByService.get(a.id) ?? []),
        );
      });
  }, [alertedServiceIds, reportsByService]);

  const groups = useMemo(
    () =>
      [
        {
          key: "monitoring",
          label: "Monitoring",
          services: sortServices(
            services.filter((s) => s.kind === "monitoring"),
          ),
        },
        {
          key: "screenings",
          label: "Screenings",
          services: sortServices(
            services.filter((s) => s.kind === "screening"),
          ),
        },
      ].filter((group) => group.services.length > 0),
    [services, sortServices],
  );

  /* ------------------------------ Behaviour ----------------------------- */

  // Auto-expand the ancestor branch of the current route.
  useEffect(() => {
    if (!activeServiceId) return;
    setExpanded((prev) => {
      if (prev[activeServiceId]) return prev;
      const next = { ...prev, [activeServiceId]: true };
      persistExpanded(next);
      return next;
    });
  }, [activeServiceId]);

  // The collapsed-rail flyout closes on navigation and outside clicks.
  useEffect(() => {
    setFlyoutOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!flyoutOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = flyoutRef.current;
      if (
        root &&
        event.target instanceof Node &&
        !root.contains(event.target)
      ) {
        setFlyoutOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [flyoutOpen]);

  function toggleBranch(serviceId: string) {
    setExpanded((prev) => {
      const next = { ...prev, [serviceId]: !prev[serviceId] };
      persistExpanded(next);
      return next;
    });
  }

  /* ------------------------- Keyboard navigation ------------------------ */

  // Flat list of visible rows, in visual order, for arrow-key movement.
  const visibleNodes = useMemo(() => {
    const nodes: TreeNode[] = [];
    for (const group of groups) {
      for (const service of group.services) {
        nodes.push({ id: `svc:${service.id}`, kind: "branch", service });
        const issues = reportsByService.get(service.id) ?? [];
        if (issues.length >= 2 && expanded[service.id]) {
          for (const report of issues.slice(0, LEAF_CAP)) {
            nodes.push({
              id: `rpt:${report.id}`,
              kind: "leaf",
              service,
              report,
            });
          }
          if (issues.length > LEAF_CAP) {
            nodes.push({ id: `all:${service.id}`, kind: "all", service });
          }
        }
      }
    }
    return nodes;
  }, [groups, expanded, reportsByService]);

  function focusNode(id: string | undefined) {
    if (!id) return;
    setFocusedId(id);
    rowRefs.current.get(id)?.focus();
  }

  function handleTreeKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const currentIndex = visibleNodes.findIndex((n) => n.id === focusedId);
    if (currentIndex === -1) return;
    const current = visibleNodes[currentIndex];
    if (!current) return;

    const isBranch = current.kind === "branch";
    const expandable =
      isBranch && (reportsByService.get(current.service.id) ?? []).length >= 2;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusNode(visibleNodes[currentIndex + 1]?.id);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusNode(visibleNodes[currentIndex - 1]?.id);
        break;
      case "ArrowRight":
        event.preventDefault();
        if (expandable) {
          if (!expanded[current.service.id]) {
            toggleBranch(current.service.id);
          } else {
            focusNode(
              visibleNodes.find(
                (n) =>
                  n.kind !== "branch" && n.service.id === current.service.id,
              )?.id,
            );
          }
        }
        break;
      case "ArrowLeft":
        event.preventDefault();
        if (expandable && expanded[current.service.id]) {
          toggleBranch(current.service.id);
        } else if (!isBranch) {
          focusNode(`svc:${current.service.id}`);
        }
        break;
      case "Home":
        event.preventDefault();
        focusNode(visibleNodes[0]?.id);
        break;
      case "End":
        event.preventDefault();
        focusNode(visibleNodes[visibleNodes.length - 1]?.id);
        break;
      default:
        break;
    }
  }

  function registerRow(id: string) {
    return (el: HTMLAnchorElement | null) => {
      if (el) rowRefs.current.set(id, el);
      else rowRefs.current.delete(id);
    };
  }

  /* --------------------------- Collapsed rail --------------------------- */

  if (collapsed) {
    return (
      <div className={styles.railTreeRoot} ref={flyoutRef}>
        <button
          type="button"
          className={`${styles.row} ${styles.railTreeButton} ${
            activeServiceId ? styles.rowActive : ""
          }`}
          title="Your work"
          aria-haspopup="menu"
          aria-expanded={flyoutOpen}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setFlyoutPos({ top: rect.top, left: rect.right + 10 });
            setFlyoutOpen((o) => !o);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setFlyoutOpen(false);
          }}
        >
          <span className={styles.rowIcon} aria-hidden="true">
            <AppIcon name="push-pin" size={20} />
          </span>
        </button>

        {flyoutOpen ? (
          <div
            className={styles.flyout}
            role="menu"
            aria-label="Your work"
            style={{
              top: flyoutPos.top,
              left: flyoutPos.left,
              maxHeight: `calc(100vh - ${flyoutPos.top}px - 16px)`,
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setFlyoutOpen(false);
            }}
          >
            {groups.length === 0 ? (
              <p className={styles.treeEmptyText}>
                {loading ? "Loading…" : "No requests yet"}
              </p>
            ) : (
              groups.map((group) => (
                <div key={group.key} className={styles.flyoutGroup}>
                  <p className={styles.menuSectionLabel}>{group.label}</p>
                  {group.services.map((service) => {
                    const issues = reportsByService.get(service.id) ?? [];
                    const displayName = serviceDisplayName(
                      service,
                      siteById.get(service.site_id),
                    );
                    return (
                      <div key={service.id}>
                        <Link
                          to={href(`/services/${service.id}`)}
                          className={styles.menuEntry}
                          role="menuitem"
                          title={displayName}
                        >
                          <span
                            className={`${styles.dot} ${
                              styles[
                                `dot_${serviceDotTone(
                                  service,
                                  alertedServiceIds,
                                  overdueServiceIds,
                                )}`
                              ]
                            }`}
                            aria-hidden="true"
                          />
                          <span className={styles.menuEntryLabel}>
                            {displayName}
                          </span>
                          {service.status === "scoping" ||
                          service.status === "quoted" ? (
                            <span className={styles.statusWord}>
                              {SERVICE_STATUS_LABELS[service.status]}
                            </span>
                          ) : null}
                        </Link>
                        {issues.length >= 2 ? (
                          <ul className={styles.treeChildren}>
                            {issues.slice(0, LEAF_CAP).map((report) => (
                              <li key={report.id}>
                                <Link
                                  to={href(`/reports/${report.id}`)}
                                  className={`${styles.row} ${styles.leafRow}`}
                                  role="menuitem"
                                >
                                  <span
                                    className={`${styles.leafIcon} ${
                                      report.kind === "alert"
                                        ? styles.leafIconDanger
                                        : ""
                                    }`}
                                    aria-hidden="true"
                                  >
                                    <AppIcon
                                      name={
                                        report.kind === "alert"
                                          ? "warning"
                                          : "file"
                                      }
                                      size={14}
                                    />
                                  </span>
                                  <span className={styles.menuEntryLabel}>
                                    {leafLabel(report)}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>
    );
  }

  /* --------------------------- Expanded tree ---------------------------- */

  // While the org data loads, hold the space with quiet skeleton rows —
  // never flash the empty state.
  if (loading) {
    return (
      <div className={styles.treeSkeleton} aria-hidden="true">
        <span className={styles.skeletonRow} />
        <span className={styles.skeletonRow} />
        <span className={styles.skeletonRow} />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className={styles.treeEmpty}>
        <p className={styles.treeEmptyText}>No requests yet</p>
      </div>
    );
  }

  const firstVisibleId = visibleNodes[0]?.id ?? null;

  return (
    <div
      className={styles.treeRoot}
      role="tree"
      aria-label="Your work"
      onKeyDown={handleTreeKeyDown}
    >
      {groups.map((group) => (
        <div key={group.key} role="none">
          {/* Static label — not a tree node, never collapsible. */}
          <p className={styles.treeGroupLabel} aria-hidden="true">
            {group.label}
          </p>

          <ul role="group" aria-label={group.label} className={styles.tree}>
            {group.services.map((service) => {
              const issues = reportsByService.get(service.id) ?? [];
              // A chevron that opens to a single child is a lie about the
              // structure: only ≥2 issues make a branch.
              const expandable = issues.length >= 2;
              const isExpanded = expandable && Boolean(expanded[service.id]);
              const nodeId = `svc:${service.id}`;
              // Ancestor treatment when one of this service's reports is
              // the current route.
              const isAncestor =
                activeServiceId === service.id && activeReportId !== null;
              const showStatusWord =
                service.status === "scoping" || service.status === "quoted";
              const displayName = serviceDisplayName(
                service,
                siteById.get(service.site_id),
              );

              return (
                <li key={service.id} role="none">
                  {/* Separate hit targets: the chevron toggles, the rest
                      of the row navigates to the service. */}
                  <NavLink
                    to={href(`/services/${service.id}`)}
                    role="treeitem"
                    aria-expanded={expandable ? isExpanded : undefined}
                    ref={registerRow(nodeId)}
                    tabIndex={
                      focusedId === nodeId ||
                      (focusedId === null && nodeId === firstVisibleId)
                        ? 0
                        : -1
                    }
                    onFocus={() => setFocusedId(nodeId)}
                    className={({ isActive }) =>
                      [
                        styles.row,
                        styles.branchRow,
                        isActive && !isAncestor ? styles.rowActive : "",
                        isAncestor ? styles.rowAncestor : "",
                      ]
                        .filter(Boolean)
                        .join(" ")
                    }
                  >
                    {expandable ? (
                      <span
                        className={`${styles.disclosure} ${
                          isExpanded ? styles.disclosureOpen : ""
                        }`}
                        aria-hidden="true"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          toggleBranch(service.id);
                        }}
                      >
                        <span className={styles.chevron} />
                      </span>
                    ) : (
                      /* Nothing to expand: an empty slot, not a chevron. */
                      <span className={styles.disclosure} aria-hidden="true" />
                    )}
                    <span
                      className={`${styles.dot} ${
                        styles[
                          `dot_${serviceDotTone(
                            service,
                            alertedServiceIds,
                            overdueServiceIds,
                          )}`
                        ]
                      }`}
                      aria-hidden="true"
                    />
                    <span className={styles.rowLabel} title={displayName}>
                      {displayName}
                    </span>
                    {showStatusWord ? (
                      <span className={styles.statusWord}>
                        {SERVICE_STATUS_LABELS[service.status]}
                      </span>
                    ) : null}
                  </NavLink>

                  {isExpanded ? (
                    <ul role="group" className={styles.treeChildren}>
                      {issues.slice(0, LEAF_CAP).map((report) => {
                        const leafId = `rpt:${report.id}`;
                        return (
                          <li key={report.id} role="none">
                            <NavLink
                              to={href(`/reports/${report.id}`)}
                              role="treeitem"
                              ref={registerRow(leafId)}
                              tabIndex={focusedId === leafId ? 0 : -1}
                              onFocus={() => setFocusedId(leafId)}
                              className={({ isActive }) =>
                                [
                                  styles.row,
                                  styles.leafRow,
                                  isActive ? styles.rowActive : "",
                                ]
                                  .filter(Boolean)
                                  .join(" ")
                              }
                            >
                              <span
                                className={`${styles.leafIcon} ${
                                  report.kind === "alert"
                                    ? styles.leafIconDanger
                                    : ""
                                }`}
                                aria-hidden="true"
                              >
                                <AppIcon
                                  name={
                                    report.kind === "alert" ? "warning" : "file"
                                  }
                                  size={14}
                                />
                              </span>
                              <span className={styles.rowLabel}>
                                {leafLabel(report)}
                              </span>
                            </NavLink>
                          </li>
                        );
                      })}

                      {issues.length > LEAF_CAP ? (
                        <li role="none">
                          <Link
                            to={href(`/services/${service.id}`)}
                            role="treeitem"
                            ref={registerRow(`all:${service.id}`)}
                            tabIndex={
                              focusedId === `all:${service.id}` ? 0 : -1
                            }
                            onFocus={() => setFocusedId(`all:${service.id}`)}
                            className={`${styles.row} ${styles.leafRow} ${styles.allIssuesRow}`}
                          >
                            <span className={styles.rowLabel}>
                              All {issues.length} issues →
                            </span>
                          </Link>
                        </li>
                      ) : null}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
