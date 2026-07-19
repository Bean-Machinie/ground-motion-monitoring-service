// Fetches the org's commercial engagements (screenings and monitoring
// subscriptions). RLS scopes rows to the current user's org.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import type { Service } from "@/types/domain";

interface UseServicesState {
  services: Service[];
  loading: boolean;
  error: string | null;
}

export function useServices(): UseServicesState & { refetch: () => void } {
  const [state, setState] = useState<UseServicesState>({
    services: [],
    loading: true,
    error: null,
  });

  const fetchServices = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setState({ services: data ?? [], loading: false, error: null });
    } catch (err) {
      setState({ services: [], loading: false, error: getErrorMessage(err) });
    }
  }, []);

  useEffect(() => {
    void fetchServices();
  }, [fetchServices]);

  return { ...state, refetch: fetchServices };
}
