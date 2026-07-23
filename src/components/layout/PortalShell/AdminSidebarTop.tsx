// Admin variant of the sidebar's top section. Replaces the customer's
// "New request" action with the two things an admin needs there instead:
// a "← All customers" link back to the index, and a customer switcher —
// the highest-traffic admin action, so it earns the slot. Everything below
// (Overview, Needs attention, All reports, Map, the service tree) is the
// customer's sidebar, unchanged.
//
// Switching navigates to /admin/c/:newId, preserving the current sub-page
// when it is a list that exists for every customer (Overview, reports, map,
// attention, activity) and falling back to the customer's Overview for
// entity pages (a specific service/report/site) that would not resolve.
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useScope } from "@/context/ScopeContext";
import {
  customerLabel,
  useAdminCustomers,
} from "@/context/AdminCustomersContext";
import { AppIcon } from "@/components/ui/AppIcon/AppIcon";
import sidebar from "./Sidebar.module.css";
import styles from "./AdminSidebarTop.module.css";

/** Sub-pages that exist for every customer, so a switch can keep the user
    on the same kind of page. Entity pages (/services/:id, /reports/:id,
    /sites/:slug) are customer-specific and fall back to the Overview. */
const PORTABLE_SUBPAGES = new Set([
  "",
  "/reports",
  "/map",
  "/attention",
  "/activity",
]);

export function AdminSidebarTop({ collapsed }: { collapsed: boolean }) {
  const { customerId } = useScope();
  const { customers, byId } = useAdminCustomers();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0, width: 240 });

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const currentName = customerLabel(byId.get(customerId));

  // Which sub-page we are on within the current customer, e.g. "/reports".
  const subPage = useMemo(() => {
    const base = `/admin/c/${customerId}`;
    return location.pathname.startsWith(base)
      ? location.pathname.slice(base.length)
      : "";
  }, [location.pathname, customerId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const haystack = [c.organization_name, c.full_name, c.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [customers, query]);

  // Focus the search field when the panel opens.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Close on navigation.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Close on outside pointer-down / Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const t = event.target;
      if (
        t instanceof Node &&
        !panelRef.current?.contains(t) &&
        !triggerRef.current?.contains(t)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function togglePanel() {
    const el = triggerRef.current;
    if (!el) return;
    if (open) {
      setOpen(false);
      return;
    }
    const rect = el.getBoundingClientRect();
    // Collapsed rail: pop out to the right (like the service-tree flyout).
    // Expanded: drop straight down under the trigger.
    setPos(
      collapsed
        ? { top: rect.top, left: rect.right + 8, width: 260 }
        : { top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 240) },
    );
    setQuery("");
    setOpen(true);
  }

  function selectCustomer(id: string) {
    setOpen(false);
    if (id === customerId) return;
    const dest = PORTABLE_SUBPAGES.has(subPage)
      ? `/admin/c/${id}${subPage}`
      : `/admin/c/${id}`;
    navigate(dest);
  }

  return (
    <div className={styles.top}>
      <ul className={sidebar.section}>
        <li>
          <NavLink
            to="/admin"
            end
            title={collapsed ? "All customers" : undefined}
            className={({ isActive }) =>
              `${sidebar.row}${isActive ? ` ${sidebar.rowActive}` : ""}`
            }
          >
            <span className={sidebar.rowIcon} aria-hidden="true">
              <span className={styles.backGlyph}>←</span>
            </span>
            <span className={sidebar.rowLabel}>All customers</span>
          </NavLink>
        </li>
      </ul>

      <div className={styles.switcherWrap}>
        <button
          type="button"
          ref={triggerRef}
          className={`${sidebar.row} ${styles.trigger}${
            open ? ` ${styles.triggerOpen}` : ""
          }`}
          aria-haspopup="listbox"
          aria-expanded={open}
          title={collapsed ? currentName : undefined}
          onClick={togglePanel}
        >
          <span className={sidebar.rowIcon} aria-hidden="true">
            <AppIcon name="user-group" size={18} />
          </span>
          <span className={`${sidebar.rowLabel} ${styles.current}`}>
            {currentName}
          </span>
          {!collapsed ? (
            <span
              className={`${styles.caret}${open ? ` ${styles.caretOpen}` : ""}`}
              aria-hidden="true"
            />
          ) : null}
        </button>

        {open ? (
          <div
            ref={panelRef}
            className={styles.panel}
            role="listbox"
            aria-label="Switch customer"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            <div className={styles.searchRow}>
              <input
                ref={inputRef}
                type="text"
                className={styles.search}
                placeholder="Search customers…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className={styles.list}>
              {filtered.length === 0 ? (
                <p className={styles.empty}>No matches</p>
              ) : (
                filtered.map((c) => {
                  const isCurrent = c.id === customerId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="option"
                      aria-selected={isCurrent}
                      className={`${styles.entry}${
                        isCurrent ? ` ${styles.entryCurrent}` : ""
                      }`}
                      onClick={() => selectCustomer(c.id)}
                    >
                      <span className={styles.entryName}>
                        {customerLabel(c)}
                      </span>
                      <span className={styles.entryEmail}>{c.email}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
