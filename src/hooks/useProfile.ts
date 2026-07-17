// Fetches the current user's profile row from Supabase.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import { useAuth } from "@/hooks/useAuth";
import type { Profile } from "@/types/auth";

interface UseProfileState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export function useProfile(): UseProfileState & { refetch: () => void } {
  const { user } = useAuth();
  const [state, setState] = useState<UseProfileState>({
    profile: null,
    loading: true,
    error: null,
  });

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setState({ profile: null, loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      setState({ profile: data, loading: false, error: null });
    } catch (err) {
      setState({ profile: null, loading: false, error: getErrorMessage(err) });
    }
  }, [user]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return { ...state, refetch: fetchProfile };
}
