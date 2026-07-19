// Contextual header for portal pages: page title with an optional status
// pill and page-level actions on the right. The breadcrumb trail is NOT
// rendered here — it goes into the shell's fixed context bar under the
// top panel (via usePortalCrumbs), so it stays put while content scrolls.
import type { ReactNode } from "react";
import { usePortalCrumbs } from "@/components/layout/PortalShell/PortalShell";
import type { Crumb } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import styles from "./PortalPageHeader.module.css";

interface PortalPageHeaderProps {
  /** Trail INCLUDING the current page as the last entry. Shown in the
      shell's fixed context bar, not inside the scrolling content. */
  crumbs?: Crumb[];
  title: string;
  /** Status pill next to the title, when the entity has one. */
  pill?: { status: string; label: string };
  lede?: string;
  /** Page-level actions, right-aligned. Only the page's primary action —
      the global New request lives in the sidebar. */
  actions?: ReactNode;
}

export function PortalPageHeader({
  crumbs,
  title,
  pill,
  lede,
  actions,
}: PortalPageHeaderProps) {
  usePortalCrumbs(crumbs ?? []);

  return (
    <header className={styles.header}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{title}</h1>
        {pill ? <StatusBadge status={pill.status} label={pill.label} /> : null}
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
      {lede ? <p className={styles.lede}>{lede}</p> : null}
    </header>
  );
}
