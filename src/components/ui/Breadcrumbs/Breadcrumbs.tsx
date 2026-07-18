// Generic breadcrumb trail: "Home / View Services / Screening".
// Every crumb except the last is a link; the last is the current page.
import { Link } from "react-router-dom";
import styles from "./Breadcrumbs.module.css";

export interface Crumb {
  label: string;
  /** Route to link to. Omit (or leave off the last crumb) for current page. */
  to?: string;
}

interface BreadcrumbsProps {
  items: Crumb[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
      <ol className={styles.list}>
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className={styles.item}>
              {isLast || !crumb.to ? (
                <span
                  className={styles.current}
                  aria-current={isLast ? "page" : undefined}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link to={crumb.to} className={styles.link}>
                  {crumb.label}
                </Link>
              )}
              {!isLast ? (
                <span className={styles.separator} aria-hidden="true">
                  /
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
