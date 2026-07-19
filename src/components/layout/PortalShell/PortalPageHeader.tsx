// Contextual header for portal pages: breadcrumb reflecting the real
// hierarchy, page title with an optional status pill, and page-level
// actions on the right. This replaces per-page ad-hoc headers — the top
// of the content column is no longer navigation.
import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import styles from "./PortalPageHeader.module.css";

interface PortalPageHeaderProps {
  /** Trail INCLUDING the current page as the last entry. */
  crumbs?: Crumb[];
  title: string;
  /** Status pill next to the title, when the entity has one. */
  pill?: { status: string; label: string };
  lede?: string;
  /** Page-level actions, right-aligned. Only the page's primary action —
      the global New request lives in the sidebar footer. */
  actions?: ReactNode;
}

export function PortalPageHeader({
  crumbs,
  title,
  pill,
  lede,
  actions,
}: PortalPageHeaderProps) {
  return (
    <header className={styles.header}>
      {crumbs && crumbs.length > 0 ? <Breadcrumbs items={crumbs} /> : null}
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{title}</h1>
        {pill ? <StatusBadge status={pill.status} label={pill.label} /> : null}
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
      {lede ? <p className={styles.lede}>{lede}</p> : null}
    </header>
  );
}
