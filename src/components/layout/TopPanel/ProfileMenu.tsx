// Profile area in the top-right of the top panel.
// Signed out: sign-in / create-account actions.
// Signed in: avatar button opening an accessible account dropdown.
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { site } from "@/config/site";
import { AppIcon } from "@/components/ui/AppIcon/AppIcon";
import styles from "./ProfileMenu.module.css";

/** LinkedIn + Instagram links shown left of the log-in button / avatar. */
function SocialLinks() {
  return (
    <>
      <a
        href={site.linkedinUrl}
        target="_blank"
        rel="noreferrer"
        className={styles.socialLink}
        aria-label="HELIOSYN on LinkedIn"
      >
        <AppIcon name="linkedin" size={22} />
      </a>
      <a
        href={site.instagramUrl}
        target="_blank"
        rel="noreferrer"
        className={styles.socialLink}
        aria-label="HELIOSYN on Instagram"
      >
        <AppIcon name="instagram" size={22} />
      </a>
    </>
  );
}

/** Initials for the avatar, derived from the profile name or email. */
function getInitials(name: string | null | undefined, email: string): string {
  const source = name?.trim();
  if (source) {
    const parts = source.split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
    return (first + last).toUpperCase();
  }
  return (email[0] ?? "?").toUpperCase();
}

export function ProfileMenu() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const focusFirstRef = useRef(false);

  // Close when the route changes.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  // Close on outside pointer-down.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (root && event.target instanceof Node && !root.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Focus the first item when opened via ArrowDown.
  useEffect(() => {
    if (open && focusFirstRef.current) {
      focusFirstRef.current = false;
      menuRef.current
        ?.querySelector<HTMLElement>('[role="menuitem"]')
        ?.focus();
    }
  }, [open]);

  if (!user) {
    return (
      <div className={styles.metaRow}>
        <SocialLinks />
        <Link to="/sign-in" className={styles.loginButton}>
          Log in
        </Link>
      </div>
    );
  }

  const email = profile?.email ?? user.email ?? "";
  const displayName = profile?.full_name || email;
  const initials = getInitials(profile?.full_name, email);

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusFirstRef.current = true;
      setOpen(true);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  function handleMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    }
  }

  function handleSignOut() {
    setOpen(false);
    void signOut().then(() => navigate("/", { replace: true }));
  }

  return (
    <div className={styles.metaRow}>
      <SocialLinks />
      <div className={styles.root} ref={rootRef}>
        <button
        type="button"
        className={`${styles.trigger}${open ? ` ${styles.triggerOpen}` : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        title={displayName}
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={styles.avatar} aria-hidden="true">
          {initials}
        </span>
      </button>

      {open ? (
        <div
          className={styles.menu}
          role="menu"
          aria-label="Account"
          ref={menuRef}
          onKeyDown={handleMenuKeyDown}
        >
          <div className={styles.menuHeader}>
            <span className={styles.menuName}>{displayName}</span>
            <span className={styles.menuEmail}>{email}</span>
          </div>

          <button
            type="button"
            role="menuitem"
            className={styles.menuEntry}
            onClick={() => {
              setOpen(false);
              navigate("/account");
            }}
          >
            <span className={styles.menuIcon}>
              <AppIcon name="settings" size={22} />
            </span>
            Account settings
          </button>

          {profile?.role === "admin" ? (
            <button
              type="button"
              role="menuitem"
              className={styles.menuEntry}
              onClick={() => {
                setOpen(false);
                navigate("/admin");
              }}
            >
              <span className={styles.menuIcon}>
                <AppIcon name="shield-lock" size={22} />
              </span>
              Administration
            </button>
          ) : null}

          <div className={styles.menuDivider} role="separator" />

          <button
            type="button"
            role="menuitem"
            className={`${styles.menuEntry} ${styles.menuEntryDanger}`}
            onClick={handleSignOut}
          >
            <span className={`${styles.menuIcon} ${styles.menuIconDanger}`}>
              <AppIcon name="logout" size={22} />
            </span>
            Sign out
          </button>
        </div>
      ) : null}
      </div>
    </div>
  );
}
