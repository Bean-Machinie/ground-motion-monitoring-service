// Fetches results for a project (or all accessible results when no
// projectId is given, e.g. for the dashboard count).
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import type { AnalysisResult } from "@/types/result";

interface UseResultsState {
  results: AnalysisResult[];
  loading: boolean;
  error: string | null;
}

export function useResults(
  projectId?: string,
): UseResultsState & { refetch: () => void } {
  const [state, setState] = useState<UseResultsState>({
    results: [],
    loading: true,
    error: null,
  });

  const fetchResults = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      let query = supabase
        .from("results")
        .select("*")
        .order("published_at", { ascending: false, nullsFirst: false });
      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      const { data, error } = await query;
      if (error) throw error;
      setState({ results: data ?? [], loading: false, error: null });
    } catch (err) {
      setState({ results: [], loading: false, error: getErrorMessage(err) });
    }
  }, [projectId]);

  useEffect(() => {
    void fetchResults();
  }, [fetchResults]);

  return { ...state, refetch: fetchResults };
}
