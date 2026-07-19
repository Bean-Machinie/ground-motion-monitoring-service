// /attention — everything that needs the customer's eyes right now:
// unacknowledged alerts, failed reports, and overdue monitoring issues.
// The sidebar badge counts the same three groups.
import { usePortalData } from "@/context/PortalDataContext";
import { PortalPageHeader } from "@/components/layout/PortalShell/PortalPageHeader";
import { AttentionList } from "@/components/portal/AttentionList/AttentionList";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";

export function AttentionPage() {
  const { loading, error, refetch, attention } = usePortalData();

  if (loading) {
    return <LoadingState label="Checking what needs attention…" />;
  }

  return (
    <div>
      <PortalPageHeader
        crumbs={[{ label: "Overview", to: "/" }, { label: "Needs attention" }]}
        title="Needs attention"
        lede={
          attention.count === 0
            ? "Unacknowledged alerts, failed reports, and overdue issues appear here."
            : `${attention.count} item${attention.count === 1 ? "" : "s"} waiting: unacknowledged alerts, failed reports, and overdue issues.`
        }
      />
      {error ? <ErrorMessage message={error} onRetry={refetch} /> : null}
      <AttentionList />
    </div>
  );
}
