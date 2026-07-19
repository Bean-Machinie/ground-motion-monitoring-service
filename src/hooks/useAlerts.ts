// Fetches the org's alerts (detected critical changes on monitoring
// services). RLS scopes rows to the current user's org.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import type { Alert } from "@/types/domain";

interface UseAlertsState {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
}

export function useAlerts(): UseAlertsState & { refetch: () => void } {
  const [state, setState] = useState<UseAlertsState>({
    alerts: [],
    loading: true,
    error: null,
  });

  const fetchAlerts = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .order("detected_at", { ascending: false });
      if (error) throw error;
      setState({ alerts: data ?? [], loading: false, error: null });
    } catch (err) {
      setState({ alerts: [], loading: false, error: getErrorMessage(err) });
    }
  }, []);

  useEffect(() => {
    void fetchAlerts();
  }, [fetchAlerts]);

  return { ...state, refetch: fetchAlerts };
}
