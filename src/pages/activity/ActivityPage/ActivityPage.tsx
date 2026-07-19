// /activity — the full chronological history behind the Overview's
// capped "Recent activity" feed.
import { useMemo } from "react";
import { usePortalData } from "@/context/PortalDataContext";
import { PortalPageHeader } from "@/components/layout/PortalShell/PortalPageHeader";
import { ActivityFeed } from "@/components/portal/ActivityFeed/ActivityFeed";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { buildActivity } from "@/lib/activity";
import styles from "./ActivityPage.module.css";

export function ActivityPage() {
  const { services, reports, alerts, siteById, loading, error, refetch } =
    usePortalData();

  const events = useMemo(
    () => buildActivity(services, reports, alerts, siteById),
    [services, reports, alerts, siteById],
  );

  if (loading) {
    return <LoadingState label="Loading activity…" />;
  }

  return (
    <div className={styles.page}>
      <PortalPageHeader
        crumbs={[{ label: "Overview", to: "/" }, { label: "Activity" }]}
        title="Activity"
        lede="Everything that has happened across your monitoring and screenings, most recent first."
      />

      {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}

      {events.length === 0 ? (
        <EmptyState
          title="No activity yet"
          description="Requests, reports, and alerts will appear here as they happen."
        />
      ) : (
        <ActivityFeed events={events} />
      )}
    </div>
  );
}
