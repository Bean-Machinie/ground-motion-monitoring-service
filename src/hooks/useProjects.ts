// Fetches the authenticated customer's projects.
// RLS restricts rows to the current user; no client-side filtering needed.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import type { Project } from "@/types/project";

interface UseProjectsState {
  projects: Project[];
  loading: boolean;
  error: string | null;
}

export function useProjects(): UseProjectsState & { refetch: () => void } {
  const [state, setState] = useState<UseProjectsState>({
    projects: [],
    loading: true,
    error: null,
  });

  const fetchProjects = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setState({ projects: data ?? [], loading: false, error: null });
    } catch (err) {
      setState({ projects: [], loading: false, error: getErrorMessage(err) });
    }
  }, []);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  return { ...state, refetch: fetchProjects };
}
