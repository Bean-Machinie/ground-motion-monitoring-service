// Shared shell for content pages: breadcrumb trail, page title, optional
// lede paragraph, then arbitrary page content. Keeps every non-portal page
// consistent (breadcrumbs work the same everywhere).
import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import styles from "./StandardPage.module.css";

interface StandardPageProps {
  /** Trail INCLUDING the current page as the last entry. */
  crumbs: Crumb[];
  title: string;
  lede?: string;
  children?: ReactNode;
}

export function StandardPage({
  crumbs,
  title,
  lede,
  children,
}: StandardPageProps) {
  return (
    <div className={styles.page}>
      <div className="container">
        <Breadcrumbs items={crumbs} />
        <h1 className={styles.title}>{title}</h1>
        {lede ? <p className={styles.lede}>{lede}</p> : null}
        {children}
      </div>
    </div>
  );
}
