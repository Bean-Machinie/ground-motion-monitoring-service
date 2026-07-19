// Sticky two-row top panel shared by the whole site: top bar
// (search | brand logo | profile) and the main nav bar with an animated
// hover-highlight pill and accessible dropdowns.
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { site } from "@/config/site";
import {
  NAV_ITEMS,
  type NavItem,
  type NavMenuEntry,
} from "@/config/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ProfileMenu } from "@/components/layout/TopPanel/ProfileMenu";
import { AppIcon } from "@/components/ui/AppIcon/AppIcon";
import logoLong from "@/assets/logo/Black/HELIOSYN_Long_Black.png";
import logoIcon from "@/assets/logo/Black/HELIOSYN_Icon_Black.png";
import styles from "./TopPanel.module.css";

interface HighlightState {
  x: number;
  width: number;
  visible: boolean;
}

/**
 * After closing a menu from an outside pointer-down, swallow the very next
 * click for 500ms so it does not trigger whatever was underneath the menu.
 */
function swallowNextClick() {
  const cleanup = () => {
    document.removeEventListener("click", handler, true);
    window.clearTimeout(timer);
  };
  const handler = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    cleanup();
  };
  document.addEventListener("click", handler, true);
  const timer = window.setTimeout(cleanup, 500);
}

/** Smooth-scroll to an in-page hash target after route navigation settles. */
function scrollToHash(to: string) {
  const hashIndex = to.indexOf("#");
  if (hashIndex === -1) return;
  const id = to.slice(hashIndex + 1);
  window.setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, 0);
}

export function TopPanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // The top panel is marketing chrome only — the signed-in app uses the
  // sidebar shell. Signed-in visitors browsing marketing pages get one
  // extra "Workspace" link back into the app.
  const navItems: NavItem[] = user
    ? [{ kind: "link", label: "Workspace", to: "/", end: true }, ...NAV_ITEMS]
    : NAV_ITEMS;

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [highlight, setHighlight] = useState<HighlightState>({
    x: 0,
    width: 0,
    visible: false,
  });
  const [mobileMenuTop, setMobileMenuTop] = useState(0);

  const headerRef = useRef<HTMLElement | null>(null);
  const navBarRef = useRef<HTMLElement | null>(null);
  const navListRef = useRef<HTMLUListElement | null>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const menuRefs = useRef(new Map<string, HTMLDivElement>());
  const focusFirstItemRef = useRef(false);

  // Track the ≤720px breakpoint.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Navigating to a new route or hash closes any open menu.
  useEffect(() => {
    setOpenMenuId(null);
  }, [location.pathname, location.hash]);

  // Outside pointer-down closes the menu and swallows the next click.
  useEffect(() => {
    if (!openMenuId) return;
    const onPointerDown = (event: PointerEvent) => {
      const nav = navBarRef.current;
      if (nav && event.target instanceof Node && !nav.contains(event.target)) {
        setOpenMenuId(null);
        swallowNextClick();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openMenuId]);

  const moveHighlightTo = useCallback(
    (element: HTMLElement | null | undefined) => {
      const list = navListRef.current;
      if (!list || !element) return;
      const listRect = list.getBoundingClientRect();
      const rect = element.getBoundingClientRect();
      setHighlight({
        x: rect.left - listRect.left + list.scrollLeft,
        width: rect.width,
        visible: true,
      });
    },
    [],
  );

  // While a menu is open the highlight sticks under its trigger. When the
  // menu closes and the pointer is no longer over the nav (e.g. it was
  // dismissed by clicking elsewhere), the highlight hides again.
  useEffect(() => {
    if (isMobile) return;
    if (openMenuId) {
      moveHighlightTo(triggerRefs.current.get(openMenuId));
    } else if (!navListRef.current?.matches(":hover")) {
      setHighlight((h) => ({ ...h, visible: false }));
    }
  }, [openMenuId, isMobile, moveHighlightTo]);

  // Focus the first menu item when a menu was opened via ArrowDown.
  useEffect(() => {
    if (openMenuId && focusFirstItemRef.current) {
      focusFirstItemRef.current = false;
      menuRefs.current
        .get(openMenuId)
        ?.querySelector<HTMLElement>('[role="menuitem"]')
        ?.focus();
    }
  }, [openMenuId]);

  function toggleMenu(id: string) {
    setMobileMenuTop(headerRef.current?.getBoundingClientRect().bottom ?? 0);
    setOpenMenuId((current) => (current === id ? null : id));
  }

  function handleItemMouseEnter(event: { currentTarget: HTMLElement }) {
    if (isMobile) return;
    moveHighlightTo(event.currentTarget);
  }

  function handleNavMouseLeave() {
    if (isMobile) return;
    if (openMenuId) {
      moveHighlightTo(triggerRefs.current.get(openMenuId));
    } else {
      setHighlight((h) => ({ ...h, visible: false }));
    }
  }

  function handleTriggerKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    id: string,
  ) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusFirstItemRef.current = true;
      setMobileMenuTop(headerRef.current?.getBoundingClientRect().bottom ?? 0);
      setOpenMenuId(id);
    } else if (event.key === "Escape" && openMenuId === id) {
      setOpenMenuId(null);
    }
  }

  function handleMenuKeyDown(
    event: ReactKeyboardEvent<HTMLDivElement>,
    id: string,
  ) {
    if (event.key === "Escape") {
      event.stopPropagation();
      setOpenMenuId(null);
      triggerRefs.current.get(id)?.focus();
    }
  }

  function handleEntrySelect(entry: NavMenuEntry) {
    setOpenMenuId(null);
    navigate(entry.to);
    scrollToHash(entry.to);
  }

  return (
    <header className={styles.topPanel} ref={headerRef}>
      {/* Single-row panel: brand flush left | nav + profile flush right.
          Full-width (no .container) so the edges hug the viewport. */}
      <div className={styles.inner}>
        <Link
          to="/"
          className={styles.brand}
          aria-label={site.name}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        >
          {/* Narrow screens get the compact square icon instead of the
              full wordmark (same breakpoint as the nav wrap). */}
          <picture>
            <source media="(max-width: 720px)" srcSet={logoIcon} />
            <img
              src={logoLong}
              alt={`${site.companyName} — ${site.name}`}
              className={styles.brandLogo}
              draggable={false}
            />
          </picture>
        </Link>

        <nav
          className={styles.navBar}
          aria-label="Main navigation"
          ref={navBarRef}
        >
        <ul
          className={styles.navList}
          ref={navListRef}
          onMouseLeave={handleNavMouseLeave}
        >
          {/* Shared floating hover-highlight pill (desktop only). */}
          {!isMobile ? (
            <span
              className={styles.highlight}
              aria-hidden="true"
              style={{
                transform: `translateX(${highlight.x}px)`,
                width: `${highlight.width}px`,
                opacity: highlight.visible ? 1 : 0,
              }}
            />
          ) : null}

          {navItems.map((item) =>
            item.kind === "link" ? (
              <li
                key={item.to}
                className={styles.navItem}
                onMouseEnter={handleItemMouseEnter}
              >
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `${styles.navButton} ${
                      isActive &&
                      !item.to.includes("#") &&
                      !item.to.includes("?")
                        ? styles.navButtonActive
                        : ""
                    }`
                  }
                  onClick={() => scrollToHash(item.to)}
                >
                  {item.label}
                </NavLink>
              </li>
            ) : (
              <li
                key={item.id}
                className={styles.navItem}
                onMouseEnter={handleItemMouseEnter}
              >
                <button
                  type="button"
                  className={`${styles.navButton} ${
                    openMenuId === item.id ? styles.navButtonActive : ""
                  }`}
                  aria-haspopup="menu"
                  aria-expanded={openMenuId === item.id}
                  ref={(el) => {
                    if (el) triggerRefs.current.set(item.id, el);
                    else triggerRefs.current.delete(item.id);
                  }}
                  onClick={() => toggleMenu(item.id)}
                  onKeyDown={(e) => handleTriggerKeyDown(e, item.id)}
                >
                  {item.label}
                  <span
                    className={`${styles.chevron} ${
                      openMenuId === item.id ? styles.chevronOpen : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {openMenuId === item.id ? (
                  <div
                    className={styles.menu}
                    role="menu"
                    aria-label={item.label}
                    style={isMobile ? { top: mobileMenuTop } : undefined}
                    ref={(el) => {
                      if (el) menuRefs.current.set(item.id, el);
                      else menuRefs.current.delete(item.id);
                    }}
                    onKeyDown={(e) => handleMenuKeyDown(e, item.id)}
                  >
                    <ul className={styles.menuList}>
                      {item.items.map((entry) => (
                        <li
                          key={entry.label}
                          className={
                            entry.dividerBelow ? styles.menuEntryDivider : undefined
                          }
                        >
                          <button
                            type="button"
                            role="menuitem"
                            className={styles.menuEntry}
                            onClick={() => handleEntrySelect(entry)}
                          >
                            {entry.icon ? (
                              <span className={styles.menuIcon} aria-hidden="true">
                                <AppIcon
                                  name={entry.icon}
                                  size={entry.iconSize ?? 22}
                                />
                              </span>
                            ) : null}
                            <span>{entry.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            ),
          )}
        </ul>
        </nav>

        <div className={styles.topBarMeta}>
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
