// Fetches the org's sites. RLS restricts rows to the current user's org;
// no client-side filtering needed.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import type { Site } from "@/types/domain";

interface UseSitesState {
  sites: Site[];
  loading: boolean;
  error: string | null;
}

export function useSites(): UseSitesState & { refetch: () => void } {
  const [state, setState] = useState<UseSitesState>({
    sites: [],
    loading: true,
    error: null,
  });

  const fetchSites = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data, error } = await supabase
        .from("sites")
        .select("*")
        .order("name");
      if (error) throw error;
      setState({ sites: data ?? [], loading: false, error: null });
    } catch (err) {
      setState({ sites: [], loading: false, error: getErrorMessage(err) });
    }
  }, []);

  useEffect(() => {
    void fetchSites();
  }, [fetchSites]);

  return { ...state, refetch: fetchSites };
}
