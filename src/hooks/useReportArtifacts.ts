// Fetches the artifacts belonging to one report. RLS scopes access
// through the owning report's org.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import type { ReportArtifact } from "@/types/domain";

interface UseReportArtifactsState {
  artifacts: ReportArtifact[];
  loading: boolean;
  error: string | null;
}

export function useReportArtifacts(
  reportId: string | undefined,
): UseReportArtifactsState & { refetch: () => void } {
  const [state, setState] = useState<UseReportArtifactsState>({
    artifacts: [],
    loading: true,
    error: null,
  });

  const fetchArtifacts = useCallback(async () => {
    if (!reportId) {
      setState({ artifacts: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data, error } = await supabase
        .from("report_artifacts")
        .select("*")
        .eq("report_id", reportId)
        .order("created_at");
      if (error) throw error;
      setState({ artifacts: data ?? [], loading: false, error: null });
    } catch (err) {
      setState({ artifacts: [], loading: false, error: getErrorMessage(err) });
    }
  }, [reportId]);

  useEffect(() => {
    void fetchArtifacts();
  }, [fetchArtifacts]);

  return { ...state, refetch: fetchArtifacts };
}
