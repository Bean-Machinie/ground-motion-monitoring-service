// Shared site header: brand, navigation links, and optional actions.
// Includes a keyboard-accessible menu toggle for small screens.
import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { site } from "@/config/site";
import type { NavLinkItem } from "@/config/navigation";
import styles from "./Header.module.css";

interface HeaderProps {
  links: NavLinkItem[];
  /** Optional actions rendered at the end of the navigation (e.g. sign out). */
  actions?: ReactNode;
  /** Where the brand links to. */
  homeTo?: string;
}

export function Header({ links, actions, homeTo = "/" }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link to={homeTo} className={styles.brand} onClick={() => setMenuOpen(false)}>
          <span className={styles.brandMark} aria-hidden="true" />
          <span className={styles.brandName}>{site.name}</span>
        </Link>

        <button
          type="button"
          className={styles.menuToggle}
          aria-expanded={menuOpen}
          aria-controls="site-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? "Close menu" : "Menu"}
        </button>

        <nav
          id="site-navigation"
          className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`}
          aria-label="Main navigation"
        >
          <ul className={styles.navList}>
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </nav>
      </div>
    </header>
  );
}
