// /admin (Overview) — the admin's landing view: every customer as a card,
// sorted by who is waiting on you most (overdue issues + open alerts).
// Opening a card enters that customer's scoped view. Cross-customer by
// nature; the customer roster comes from AdminCustomersProvider, the
// per-customer aggregates are fetched here.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { customerLabel, useAdminCustomers } from "@/context/AdminCustomersContext";
import { formatDate } from "@/lib/dates";
import styles from "./AdminCustomerIndexPage.module.css";

interface Aggregate {
  monitoring: number;
  screening: number;
  overdue: number;
  openAlerts: number;
  lastPublished: string | null;
}

const EMPTY: Aggregate = {
  monitoring: 0,
  screening: 0,
  overdue: 0,
  openAlerts: 0,
  lastPublished: null,
};

export function AdminCustomerIndexPage() {
  const { customers, loading: customersLoading, error: customersError } =
    useAdminCustomers();
  const [aggregates, setAggregates] = useState<Map<string, Aggregate>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      const today = new Date().toISOString().slice(0, 10);
      try {
        const [services, reports, alerts] = await Promise.all([
          supabase
            .from("services")
            .select("org_id, kind, status, next_issue_due"),
          supabase.from("reports").select("org_id, state, published_at"),
          supabase.from("alerts").select("org_id, acknowledged_at"),
        ]);
        const failed = services.error ?? reports.error ?? alerts.error;
        if (failed) throw failed;
        if (!active) return;

        const map = new Map<string, Aggregate>();
        const get = (orgId: string) => {
          let agg = map.get(orgId);
          if (!agg) {
            agg = { ...EMPTY };
            map.set(orgId, agg);
          }
          return agg;
        };

        for (const s of services.data ?? []) {
          const agg = get(s.org_id);
          if (s.kind === "monitoring") agg.monitoring += 1;
          else agg.screening += 1;
          if (
            s.kind === "monitoring" &&
            s.status === "active" &&
            s.next_issue_due !== null &&
            s.next_issue_due < today
          ) {
            agg.overdue += 1;
          }
        }
        for (const r of reports.data ?? []) {
          if (r.state === "published" && r.published_at) {
            const agg = get(r.org_id);
            if (
              agg.lastPublished === null ||
              r.published_at > agg.lastPublished
            ) {
              agg.lastPublished = r.published_at;
            }
          }
        }
        for (const a of alerts.data ?? []) {
          if (a.acknowledged_at === null) get(a.org_id).openAlerts += 1;
        }

        setAggregates(map);
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

  const rows = useMemo(() => {
    const withAgg = customers.map((profile) => ({
      profile,
      agg: aggregates.get(profile.id) ?? EMPTY,
    }));
    return withAgg.sort((a, b) => {
      const attentionA = a.agg.overdue + a.agg.openAlerts;
      const attentionB = b.agg.overdue + b.agg.openAlerts;
      if (attentionA !== attentionB) return attentionB - attentionA;
      const waitA = a.agg.lastPublished ?? "";
      const waitB = b.agg.lastPublished ?? "";
      if (waitA !== waitB) return waitA.localeCompare(waitB);
      return customerLabel(a.profile).localeCompare(customerLabel(b.profile));
    });
  }, [customers, aggregates]);

  const anyError = error ?? customersError;

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>Customer overview</h1>
        <p className={styles.lede}>
          Every customer account — sorted by who is waiting on you. Open one to
          manage their services and reports.
        </p>
      </header>

      {anyError ? <ErrorMessage message={anyError} /> : null}

      {loading || customersLoading ? (
        <LoadingState label="Loading customers…" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="Customer accounts will appear here as people sign up."
        />
      ) : (
        <ul className={styles.grid}>
          {rows.map(({ profile, agg }) => {
            const attention = agg.overdue + agg.openAlerts;
            const serviceBits: string[] = [];
            if (agg.monitoring > 0)
              serviceBits.push(`${agg.monitoring} monitoring`);
            if (agg.screening > 0)
              serviceBits.push(`${agg.screening} screening`);
            return (
              <li key={profile.id}>
                <Link
                  to={`/admin/c/${profile.id}`}
                  className={styles.card}
                >
                  <div className={styles.cardHead}>
                    <span className={styles.avatar} aria-hidden="true">
                      {customerLabel(profile).charAt(0).toUpperCase()}
                    </span>
                    {attention > 0 ? (
                      <span
                        className={styles.attentionPill}
                        title={`${agg.overdue} overdue · ${agg.openAlerts} open ${
                          agg.openAlerts === 1 ? "alert" : "alerts"
                        }`}
                      >
                        {attention} waiting
                      </span>
                    ) : (
                      <span className={styles.clearPill}>Clear</span>
                    )}
                  </div>

                  <h2 className={styles.name}>{customerLabel(profile)}</h2>
                  <p className={styles.email}>{profile.email}</p>

                  <dl className={styles.stats}>
                    <div className={styles.stat}>
                      <dt>Services</dt>
                      <dd>
                        {serviceBits.length > 0 ? (
                          serviceBits.join(" · ")
                        ) : (
                          <span className={styles.muted}>None</span>
                        )}
                      </dd>
                    </div>
                    <div className={styles.stat}>
                      <dt>Last report</dt>
                      <dd>
                        {agg.lastPublished ? (
                          formatDate(agg.lastPublished)
                        ) : (
                          <span className={styles.muted}>Never</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
