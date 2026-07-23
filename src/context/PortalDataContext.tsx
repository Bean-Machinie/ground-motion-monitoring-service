// App-level portal data: sites, services, reports, and alerts are
// fetched ONCE per scope (as soon as a scope with a customerId is active)
// and shared with the sidebar and every page through context. The provider
// lives ABOVE routing, so navigating between portal pages never remounts
// it, never refetches, and never flashes empty states.
//
// Every query filters explicitly by the active scope's customerId
// (`.eq("org_id", …)`). For a customer this is redundant with RLS — which
// already restricts them to their own org — but harmless. For admin scoped
// browsing it is the mechanism: an admin may read all orgs, so the explicit
// filter is what narrows the portal to the single customer being viewed.
// RLS remains the real authorization boundary either way.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import { useScope } from "@/context/ScopeContext";
import type { Alert, Report, Service, Site } from "@/types/domain";

interface PortalDataState {
  sites: Site[];
  services: Service[];
  reports: Report[];
  alerts: Alert[];
  loading: boolean;
  error: string | null;
}

export interface AttentionItems {
  /** Unacknowledged alerts, newest first. */
  alerts: Alert[];
  /** Reports whose pipeline failed. */
  failedReports: Report[];
  /** Active monitoring services with an overdue next issue. */
  overdueServices: Service[];
  count: number;
}

export interface PortalData extends PortalDataState {
  refetch: () => void;
  siteById: Map<string, Site>;
  serviceById: Map<string, Service>;
  attention: AttentionItems;
}

const PortalDataContext = createContext<PortalData | null>(null);

const INITIAL: PortalDataState = {
  sites: [],
  services: [],
  reports: [],
  alerts: [],
  loading: true,
  error: null,
};

export function PortalDataProvider({ children }: { children: ReactNode }) {
  const { customerId } = useScope();
  const [state, setState] = useState<PortalDataState>(INITIAL);

  const fetchAll = useCallback(async () => {
    if (!customerId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [sites, services, reports, alerts] = await Promise.all([
        supabase
          .from("sites")
          .select("*")
          .eq("org_id", customerId)
          .order("name"),
        supabase
          .from("services")
          .select("*")
          .eq("org_id", customerId)
          .order("created_at", { ascending: false }),
        supabase
          .from("reports")
          .select("*")
          .eq("org_id", customerId)
          .order("published_at", { ascending: false, nullsFirst: false }),
        supabase
          .from("alerts")
          .select("*")
          .eq("org_id", customerId)
          .order("detected_at", { ascending: false }),
      ]);
      const failed =
        sites.error ?? services.error ?? reports.error ?? alerts.error;
      if (failed) throw failed;
      setState({
        sites: sites.data ?? [],
        services: services.data ?? [],
        reports: reports.data ?? [],
        alerts: alerts.data ?? [],
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({ ...INITIAL, loading: false, error: getErrorMessage(err) });
    }
  }, [customerId]);

  // Fetch when a scope with a customerId is active; reset when there is
  // none (signed out). Keyed on customerId so switching the scoped customer
  // — signing into a different account, or an admin switching customers —
  // refetches.
  useEffect(() => {
    if (customerId) {
      void fetchAll();
    } else {
      setState({ ...INITIAL, loading: false });
    }
  }, [customerId, fetchAll]);

  const value = useMemo<PortalData>(() => {
    const siteById = new Map(state.sites.map((s) => [s.id, s]));
    const serviceById = new Map(state.services.map((s) => [s.id, s]));

    const today = new Date().toISOString().slice(0, 10);
    const attentionAlerts = state.alerts.filter((a) => !a.acknowledged_at);
    const failedReports = state.reports.filter((r) => r.state === "failed");
    const overdueServices = state.services.filter(
      (s) =>
        s.kind === "monitoring" &&
        s.status === "active" &&
        s.next_issue_due !== null &&
        s.next_issue_due < today,
    );

    return {
      ...state,
      refetch: fetchAll,
      siteById,
      serviceById,
      attention: {
        alerts: attentionAlerts,
        failedReports,
        overdueServices,
        count:
          attentionAlerts.length +
          failedReports.length +
          overdueServices.length,
      },
    };
  }, [state, fetchAll]);

  return (
    <PortalDataContext.Provider value={value}>
      {children}
    </PortalDataContext.Provider>
  );
}

export function usePortalData(): PortalData {
  const ctx = useContext(PortalDataContext);
  if (!ctx) {
    throw new Error("usePortalData must be used inside PortalDataProvider");
  }
  return ctx;
}
