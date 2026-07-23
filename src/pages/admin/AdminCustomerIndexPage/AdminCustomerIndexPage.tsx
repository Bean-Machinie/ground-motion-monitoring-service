// /admin — the one view a customer can never have: every customer, and
// how much each is waiting on us. Cross-customer by design, so it queries
// directly (RLS returns all rows for an admin) rather than through the
// single-customer PortalDataProvider.
//
// Each row: the customer, their service counts (monitoring vs screening),
// how many things need attention (overdue monitoring issues + open alerts),
// and when they last received a published report. Sorted so whoever is
// waiting most floats to the top.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import type { ProfileRow } from "@/types/database";
import { formatDate } from "@/lib/dates";
import styles from "./AdminCustomerIndexPage.module.css";

interface CustomerRow {
  profile: ProfileRow;
  monitoring: number;
  screening: number;
  overdue: number;
  openAlerts: number;
  /** Newest published_at across the customer's reports, or null. */
  lastPublished: string | null;
}

/** Overdue + open alerts: the single "waiting on me" figure the sort keys on. */
function attentionOf(row: CustomerRow): number {
  return row.overdue + row.openAlerts;
}

export function AdminCustomerIndexPage() {
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      const today = new Date().toISOString().slice(0, 10);
      try {
        const [customers, services, reports, alerts] = await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("role", "customer")
            .order("email"),
          supabase
            .from("services")
            .select("org_id, kind, status, next_issue_due"),
          supabase.from("reports").select("org_id, state, published_at"),
          supabase.from("alerts").select("org_id, acknowledged_at"),
        ]);
        const failed =
          customers.error ?? services.error ?? reports.error ?? alerts.error;
        if (failed) throw failed;
        if (!active) return;

        const byOrg = new Map<string, CustomerRow>();
        for (const profile of customers.data ?? []) {
          byOrg.set(profile.id, {
            profile,
            monitoring: 0,
            screening: 0,
            overdue: 0,
            openAlerts: 0,
            lastPublished: null,
          });
        }

        for (const service of services.data ?? []) {
          const row = byOrg.get(service.org_id);
          if (!row) continue;
          if (service.kind === "monitoring") row.monitoring += 1;
          else row.screening += 1;
          if (
            service.kind === "monitoring" &&
            service.status === "active" &&
            service.next_issue_due !== null &&
            service.next_issue_due < today
          ) {
            row.overdue += 1;
          }
        }

        for (const report of reports.data ?? []) {
          const row = byOrg.get(report.org_id);
          if (!row) continue;
          if (report.state === "published" && report.published_at) {
            if (
              row.lastPublished === null ||
              report.published_at > row.lastPublished
            ) {
              row.lastPublished = report.published_at;
            }
          }
        }

        for (const alert of alerts.data ?? []) {
          const row = byOrg.get(alert.org_id);
          if (!row) continue;
          if (alert.acknowledged_at === null) row.openAlerts += 1;
        }

        setRows([...byOrg.values()]);
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

  // Most overdue first; then longest since a report (missing = waiting
  // longest); then name, for a stable order.
  const sorted = useMemo(() => {
    const nameOf = (row: CustomerRow) =>
      row.profile.organization_name ||
      row.profile.full_name ||
      row.profile.email;
    return [...rows].sort((a, b) => {
      const byAttention = attentionOf(b) - attentionOf(a);
      if (byAttention !== 0) return byAttention;
      const byWait = (a.lastPublished ?? "").localeCompare(
        b.lastPublished ?? "",
      );
      if (byWait !== 0) return byWait;
      return nameOf(a).localeCompare(nameOf(b));
    });
  }, [rows]);

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Customers</h1>
          <p className={styles.lede}>
            Everyone, across every account — sorted by who is waiting on you.
          </p>
        </div>
      </header>

      {error ? <ErrorMessage message={error} /> : null}

      {loading ? (
        <LoadingState label="Loading customers…" />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="Customer accounts will appear here as people sign up."
        />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Customer</th>
                <th scope="col">Services</th>
                <th scope="col">Needs attention</th>
                <th scope="col">Last report</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const attention = attentionOf(row);
                const name =
                  row.profile.organization_name ||
                  row.profile.full_name ||
                  row.profile.email;
                const serviceBits: string[] = [];
                if (row.monitoring > 0) {
                  serviceBits.push(`${row.monitoring} monitoring`);
                }
                if (row.screening > 0) {
                  serviceBits.push(`${row.screening} screening`);
                }
                return (
                  <tr key={row.profile.id}>
                    <td>
                      <Link
                        to={`/admin/c/${row.profile.id}`}
                        className={styles.customerLink}
                      >
                        <span className={styles.customerName}>{name}</span>
                        <span className={styles.customerEmail}>
                          {row.profile.email}
                        </span>
                      </Link>
                    </td>
                    <td className={styles.numeric}>
                      {serviceBits.length > 0 ? (
                        serviceBits.join(" · ")
                      ) : (
                        <span className={styles.muted}>None</span>
                      )}
                    </td>
                    <td className={styles.numeric}>
                      {attention > 0 ? (
                        <span
                          className={styles.attentionPill}
                          title={`${row.overdue} overdue · ${row.openAlerts} open ${
                            row.openAlerts === 1 ? "alert" : "alerts"
                          }`}
                        >
                          {attention}
                        </span>
                      ) : (
                        <span className={styles.muted}>Clear</span>
                      )}
                    </td>
                    <td className={styles.numeric}>
                      {row.lastPublished ? (
                        formatDate(row.lastPublished)
                      ) : (
                        <span className={styles.muted}>Never</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
