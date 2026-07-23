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
  // Keyed on the id, not the user object: token refreshes (e.g. on tab
  // refocus) produce a new session/user object for the same account, and
  // must not trigger a refetch.
  const userId = user?.id;
  const [state, setState] = useState<UseProfileState>({
    profile: null,
    loading: true,
    error: null,
  });

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setState({ profile: null, loading: false, error: null });
      return;
    }
    // Revalidate quietly: loading blocks rendering only while there is
    // no profile at all. Route guards unmount their page on loading, so
    // flipping it on a background refresh would destroy page state.
    setState((s) => ({ ...s, loading: s.profile === null, error: null }));
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      setState({ profile: data, loading: false, error: null });
    } catch (err) {
      setState({ profile: null, loading: false, error: getErrorMessage(err) });
    }
  }, [userId]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return { ...state, refetch: fetchProfile };
}
