// Report viewer page: resolves the report, its service/site context, its
// sibling issues, and its artifacts, then renders the unified viewer.
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { useSites } from "@/hooks/useSites";
import { useServices } from "@/hooks/useServices";
import { useReports } from "@/hooks/useReports";
import { useReportArtifacts } from "@/hooks/useReportArtifacts";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { ReportViewer } from "@/components/reports/ReportViewer/ReportViewer";
import { SERVICE_KIND_LABELS } from "@/types/domain";
import styles from "./ReportViewerPage.module.css";

export function ReportViewerPage() {
  const { id } = useParams<{ id: string }>();
  const { sites, loading: sitesLoading } = useSites();
  const { services, loading: servicesLoading } = useServices();
  const { reports, loading, error, refetch } = useReports();
  const report = reports.find((r) => r.id === id);
  const {
    artifacts,
    loading: artifactsLoading,
  } = useReportArtifacts(report?.id);

  if (loading || sitesLoading || servicesLoading || artifactsLoading) {
    return <LoadingState label="Loading report…" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />;
  }

  if (!report) {
    return (
      <EmptyState
        title="Report not found"
        description="This report does not exist or you do not have access to it."
        action={<Link to="/reports">Back to reports</Link>}
      />
    );
  }

  const service = services.find((s) => s.id === report.service_id);
  const site = service
    ? sites.find((s) => s.id === service.site_id)
    : undefined;
  const siblings = reports
    .filter((r) => r.service_id === report.service_id)
    .sort((a, b) => a.issue_number - b.issue_number);

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: "Workspace", to: "/" },
          ...(site ? [{ label: site.name, to: `/sites/${site.slug}` }] : []),
          ...(service
            ? [
                {
                  label: SERVICE_KIND_LABELS[service.kind],
                  to: `/services/${service.id}`,
                },
              ]
            : []),
          { label: `Issue ${report.issue_number}` },
        ]}
      />
      <ReportViewer
        report={report}
        service={service}
        site={site}
        siblings={siblings}
        artifacts={artifacts}
      />
    </div>
  );
}
