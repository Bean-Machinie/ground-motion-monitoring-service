// Fetches a single project by slug. Returns notFound when no accessible
// project matches (missing or belonging to another customer).
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import type { Project } from "@/types/project";

interface UseProjectState {
  project: Project | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
}

export function useProject(
  slug: string | undefined,
): UseProjectState & { refetch: () => void } {
  const [state, setState] = useState<UseProjectState>({
    project: null,
    loading: true,
    error: null,
    notFound: false,
  });

  const fetchProject = useCallback(async () => {
    if (!slug) {
      setState({ project: null, loading: false, error: null, notFound: true });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null, notFound: false }));
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      setState({
        project: data,
        loading: false,
        error: null,
        notFound: data === null,
      });
    } catch (err) {
      setState({
        project: null,
        loading: false,
        error: getErrorMessage(err),
        notFound: false,
      });
    }
  }, [slug]);

  useEffect(() => {
    void fetchProject();
  }, [fetchProject]);

  return { ...state, refetch: fetchProject };
}
