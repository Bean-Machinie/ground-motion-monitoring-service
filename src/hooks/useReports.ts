// Fetches the org's report issues. RLS scopes rows to the current user's
// org; pages combine these with services/sites for filtering.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import type { Report } from "@/types/domain";

interface UseReportsState {
  reports: Report[];
  loading: boolean;
  error: string | null;
}

export function useReports(): UseReportsState & { refetch: () => void } {
  const [state, setState] = useState<UseReportsState>({
    reports: [],
    loading: true,
    error: null,
  });

  const fetchReports = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("published_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      setState({ reports: data ?? [], loading: false, error: null });
    } catch (err) {
      setState({ reports: [], loading: false, error: getErrorMessage(err) });
    }
  }, []);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  return { ...state, refetch: fetchReports };
}
