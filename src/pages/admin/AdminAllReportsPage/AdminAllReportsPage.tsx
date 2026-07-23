// /admin/reports — every report ever, across every customer. Admin-only
// (the whole /admin subtree is guarded, and RLS returns all rows to an
// admin). Each row opens in that customer's scoped report viewer, so the
// full context — sidebar, siblings, attachments — comes along.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import { customerLabel, useAdminCustomers } from "@/context/AdminCustomersContext";
import {
  REPORT_KIND_LABELS,
  REPORT_STATE_LABELS,
  type Report,
} from "@/types/domain";
import { formatDate } from "@/lib/dates";
import styles from "./AdminAllReportsPage.module.css";

interface ServiceLite {
  id: string;
  name: string;
}

export function AdminAllReportsPage() {
  const { byId, loading: customersLoading } = useAdminCustomers();
  const [reports, setReports] = useState<Report[]>([]);
  const [serviceById, setServiceById] = useState<Map<string, ServiceLite>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [reportRes, serviceRes] = await Promise.all([
          supabase
            .from("reports")
            .select("*")
            .order("published_at", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false }),
          supabase.from("services").select("id, name"),
        ]);
        const failed = reportRes.error ?? serviceRes.error;
        if (failed) throw failed;
        if (!active) return;
        setReports(reportRes.data ?? []);
        setServiceById(
          new Map((serviceRes.data ?? []).map((s) => [s.id, s as ServiceLite])),
        );
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const reportTitle = (r: Report) =>
    r.headline ?? `${REPORT_KIND_LABELS[r.kind]} #${r.issue_number}`;

  const publishedCount = useMemo(
    () => reports.filter((r) => r.state === "published").length,
    [reports],
  );

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>All reports</h1>
        <p className={styles.lede}>
          Every issue across every customer — {reports.length} total,{" "}
          {publishedCount} published.
        </p>
      </header>

      {error ? <ErrorMessage message={error} /> : null}

      {loading || customersLoading ? (
        <LoadingState label="Loading every report…" />
      ) : reports.length === 0 ? (
        <EmptyState
          title="No reports yet"
          description="Published and in-progress reports across all customers will appear here."
        />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Report</th>
                <th scope="col">Customer</th>
                <th scope="col">Service</th>
                <th scope="col">State</th>
                <th scope="col">Published</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link
                      to={`/admin/c/${r.org_id}/reports/${r.id}`}
                      className={styles.reportLink}
                    >
                      <span className={styles.reportTitle}>
                        {reportTitle(r)}
                      </span>
                      <span className={styles.reportKicker}>
                        {REPORT_KIND_LABELS[r.kind]} · Issue {r.issue_number}
                      </span>
                    </Link>
                  </td>
                  <td>{customerLabel(byId.get(r.org_id))}</td>
                  <td className={styles.muted}>
                    {serviceById.get(r.service_id)?.name ?? "—"}
                  </td>
                  <td>
                    <StatusBadge
                      status={r.state}
                      label={REPORT_STATE_LABELS[r.state]}
                    />
                  </td>
                  <td className={styles.muted}>
                    {r.published_at ? formatDate(r.published_at) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
