// The "Your sites" tree: each site row links to /sites/:slug with a
// disclosure chevron; expanded, its services appear as child rows with a
// status dot. Expansion persists per site in localStorage, the ancestor
// of the current route auto-expands, arrow keys walk the tree
// (role="tree"), and above 12 sites a filter input appears. Collapsed to
// the icon rail, the whole tree becomes one icon opening a flyout.
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { usePortalData } from "@/context/PortalDataContext";
import { AppIcon } from "@/components/ui/AppIcon/AppIcon";
import { SERVICE_KIND_LABELS, type Service, type Site } from "@/types/domain";
import styles from "./Sidebar.module.css";

const EXPANDED_KEY = "heliosyn.sidebar.sites.expanded";
const FILTER_THRESHOLD = 12;

function readExpanded(): Record<string, boolean> {
  try {
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

/** Resolves which site/service the current route belongs to, so the tree
    can auto-expand the ancestor and mark the path active. */
function useActiveContext(): { siteId: string | null; serviceId: string | null } {
  const { pathname } = useLocation();
  const { sites, serviceById, reports } = usePortalData();

  return useMemo(() => {
    let siteId: string | null = null;
    let serviceId: string | null = null;

    const siteMatch = pathname.match(/^\/sites\/([^/]+)/);
    if (siteMatch) {
      siteId = sites.find((s) => s.slug === siteMatch[1])?.id ?? null;
    }
    const serviceMatch = pathname.match(
      /^\/services\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
    );
    if (serviceMatch && serviceMatch[1]) serviceId = serviceMatch[1];

    const reportMatch = pathname.match(/^\/reports\/([^/]+)$/);
    if (reportMatch) {
      const report = reports.find((r) => r.id === reportMatch[1]);
      if (report) serviceId = report.service_id;
    }

    if (serviceId) {
      const service = serviceById.get(serviceId);
      if (service) siteId = service.site_id;
    }

    return { siteId, serviceId };
  }, [pathname, sites, serviceById, reports]);
}

/** Service status dot tone: red for an unacknowledged critical alert,
    else green (active), amber (paused), neutral (everything else). */
function serviceDotTone(
  service: Service,
  criticalServiceIds: Set<string>,
): "danger" | "success" | "warning" | "neutral" {
  if (criticalServiceIds.has(service.id)) return "danger";
  if (service.status === "active") return "success";
  if (service.status === "paused") return "warning";
  return "neutral";
}

interface SiteTreeProps {
  collapsed: boolean;
}

export function SiteTree({ collapsed }: SiteTreeProps) {
  const { sites, services, alerts, loading } = usePortalData();
  const { siteId: activeSiteId, serviceId: activeServiceId } =
    useActiveContext();

  const [expanded, setExpanded] = useState<Record<string, boolean>>(readExpanded);
  const [filter, setFilter] = useState("");
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

  const criticalServiceIds = useMemo(
    () =>
      new Set(
        alerts
          .filter((a) => a.severity === "critical" && !a.acknowledged_at)
          .map((a) => a.service_id),
      ),
    [alerts],
  );

  const servicesBySite = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const service of services) {
      const list = map.get(service.site_id);
      if (list) list.push(service);
      else map.set(service.site_id, [service]);
    }
    return map;
  }, [services]);

  // Auto-expand the ancestor site of the current route.
  useEffect(() => {
    if (!activeSiteId) return;
    setExpanded((prev) => {
      if (prev[activeSiteId]) return prev;
      const next = { ...prev, [activeSiteId]: true };
      persistExpanded(next);
      return next;
    });
  }, [activeSiteId]);

  // The collapsed-rail flyout closes on navigation and outside clicks.
  useEffect(() => {
    setFlyoutOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!flyoutOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = flyoutRef.current;
      if (root && event.target instanceof Node && !root.contains(event.target)) {
        setFlyoutOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [flyoutOpen]);

  function toggleSite(siteId: string) {
    setExpanded((prev) => {
      const next = { ...prev, [siteId]: !prev[siteId] };
      persistExpanded(next);
      return next;
    });
  }

  /** Row clicks always ensure the site ends up expanded (never collapse).
      Covers re-clicking the already-active site after collapsing it via
      the chevron — navigation is a no-op there, so the auto-expand
      effect would not refire. Only the chevron collapses. */
  function expandSite(siteId: string) {
    setExpanded((prev) => {
      if (prev[siteId]) return prev;
      const next = { ...prev, [siteId]: true };
      persistExpanded(next);
      return next;
    });
  }


  const filteredSites = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return sites;
    return sites.filter((s) => s.name.toLowerCase().includes(query));
  }, [sites, filter]);

  /* ------------------------- Keyboard navigation ---------------------- */

  // Flat list of visible rows, in visual order, for arrow-key movement.
  const visibleNodes = useMemo(() => {
    const nodes: { id: string; kind: "site" | "service"; site: Site; service?: Service }[] = [];
    for (const site of filteredSites) {
      nodes.push({ id: `site:${site.id}`, kind: "site", site });
      if (expanded[site.id]) {
        for (const service of servicesBySite.get(site.id) ?? []) {
          nodes.push({ id: `svc:${service.id}`, kind: "service", site, service });
        }
      }
    }
    return nodes;
  }, [filteredSites, expanded, servicesBySite]);

  function focusNode(id: string | undefined) {
    if (!id) return;
    setFocusedId(id);
    rowRefs.current.get(id)?.focus();
  }

  function handleTreeKeyDown(event: ReactKeyboardEvent<HTMLUListElement>) {
    const currentIndex = visibleNodes.findIndex((n) => n.id === focusedId);
    if (currentIndex === -1) return;
    const current = visibleNodes[currentIndex];
    if (!current) return;

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
        if (current.kind === "site") {
          if (!expanded[current.site.id]) {
            toggleSite(current.site.id);
          } else {
            focusNode(
              visibleNodes.find(
                (n) => n.kind === "service" && n.site.id === current.site.id,
              )?.id,
            );
          }
        }
        break;
      case "ArrowLeft":
        event.preventDefault();
        if (current.kind === "site" && expanded[current.site.id]) {
          toggleSite(current.site.id);
        } else if (current.kind === "service") {
          focusNode(`site:${current.site.id}`);
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

  /* --------------------------- Collapsed rail ------------------------- */

  if (collapsed) {
    return (
      <div className={styles.railTreeRoot} ref={flyoutRef}>
        <button
          type="button"
          className={`${styles.row} ${styles.railTreeButton} ${
            activeSiteId ? styles.rowActive : ""
          }`}
          title="Your sites"
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
            <AppIcon name="push-pin" size={18} />
          </span>
        </button>

        {flyoutOpen ? (
          <div
            className={styles.flyout}
            role="menu"
            aria-label="Your sites"
            style={{
              top: flyoutPos.top,
              left: flyoutPos.left,
              maxHeight: `calc(100vh - ${flyoutPos.top}px - 16px)`,
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setFlyoutOpen(false);
            }}
          >
            <p className={styles.menuSectionLabel}>Your sites</p>
            {sites.length === 0 ? (
              <p className={styles.treeEmptyText}>
                {loading ? "Loading sites…" : "No sites yet"}
              </p>
            ) : (
              sites.map((site) => {
                const siteServices = servicesBySite.get(site.id) ?? [];
                return (
                  <div key={site.id} className={styles.flyoutGroup}>
                    <Link
                      to={`/sites/${site.slug}`}
                      className={styles.menuEntry}
                      role="menuitem"
                      title={site.name}
                    >
                      <span className={styles.menuEntryLabel}>{site.name}</span>
                    </Link>
                    {siteServices.length > 0 ? (
                      /* Same connected guide lines as the expanded tree. */
                      <ul className={styles.treeChildren}>
                        {siteServices.map((service) => (
                          <li key={service.id}>
                            <Link
                              to={`/services/${service.id}`}
                              className={`${styles.row} ${styles.serviceRow}`}
                              role="menuitem"
                            >
                              <span
                                className={`${styles.dot} ${
                                  styles[
                                    `dot_${serviceDotTone(service, criticalServiceIds)}`
                                  ]
                                }`}
                                aria-hidden="true"
                              />
                              <span className={styles.menuEntryLabel}>
                                {SERVICE_KIND_LABELS[service.kind]}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        ) : null}
      </div>
    );
  }

  /* --------------------------- Expanded tree -------------------------- */

  // While the org data loads, hold the space with quiet skeleton rows —
  // never flash the "No sites yet" state.
  if (loading) {
    return (
      <div className={styles.treeSkeleton} aria-hidden="true">
        <span className={styles.skeletonRow} />
        <span className={styles.skeletonRow} />
        <span className={styles.skeletonRow} />
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className={styles.treeEmpty}>
        <p className={styles.treeEmptyText}>No sites yet</p>
      </div>
    );
  }

  const firstVisibleId = visibleNodes[0]?.id ?? null;

  return (
    <div className={styles.treeRoot}>
      {sites.length > FILTER_THRESHOLD ? (
        <input
          type="search"
          className={styles.treeFilter}
          placeholder="Filter sites…"
          aria-label="Filter sites"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      ) : null}

      <ul
        role="tree"
        aria-label="Your sites"
        className={styles.tree}
        onKeyDown={handleTreeKeyDown}
      >
        {filteredSites.map((site) => {
          const isExpanded = Boolean(expanded[site.id]);
          const siteServices = servicesBySite.get(site.id) ?? [];
          const siteNodeId = `site:${site.id}`;
          const isAncestor =
            activeSiteId === site.id && activeServiceId !== null;

          return (
            <li key={site.id} role="none">
              {/* Split behaviour: clicking the chevron purposefully
                  toggles the disclosure (and never navigates); clicking
                  anywhere else on the row just navigates to the site
                  (which auto-expands it on arrival). */}
              <NavLink
                to={`/sites/${site.slug}`}
                role="treeitem"
                aria-expanded={siteServices.length > 0 ? isExpanded : undefined}
                ref={registerRow(siteNodeId)}
                tabIndex={
                  focusedId === siteNodeId ||
                  (focusedId === null && siteNodeId === firstVisibleId)
                    ? 0
                    : -1
                }
                onFocus={() => setFocusedId(siteNodeId)}
                onClick={() => expandSite(site.id)}
                className={({ isActive }) =>
                  [
                    styles.row,
                    styles.siteRow,
                    isActive ? styles.rowActive : "",
                    isAncestor ? styles.rowAncestor : "",
                  ]
                    .filter(Boolean)
                    .join(" ")
                }
              >
                <span
                  className={`${styles.disclosure} ${
                    isExpanded ? styles.disclosureOpen : ""
                  }`}
                  aria-hidden="true"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    toggleSite(site.id);
                  }}
                >
                  <span className={styles.chevron} />
                </span>
                <span className={styles.rowLabel}>{site.name}</span>
              </NavLink>

              {isExpanded && siteServices.length > 0 ? (
                <ul role="group" className={styles.treeChildren}>
                  {siteServices.map((service) => {
                    const nodeId = `svc:${service.id}`;
                    return (
                      <li key={service.id} role="none">
                        <NavLink
                          to={`/services/${service.id}`}
                          role="treeitem"
                          ref={registerRow(nodeId)}
                          tabIndex={focusedId === nodeId ? 0 : -1}
                          onFocus={() => setFocusedId(nodeId)}
                          className={({ isActive }) =>
                            [
                              styles.row,
                              styles.serviceRow,
                              // Router match OR derived context (e.g. when
                              // viewing one of this service's reports).
                              isActive || activeServiceId === service.id
                                ? styles.rowActive
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")
                          }
                        >
                          <span
                            className={`${styles.dot} ${
                              styles[
                                `dot_${serviceDotTone(service, criticalServiceIds)}`
                              ]
                            }`}
                            aria-hidden="true"
                          />
                          <span className={styles.rowLabel}>
                            {SERVICE_KIND_LABELS[service.kind]}
                          </span>
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
