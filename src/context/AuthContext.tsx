// Authentication context: restores the Supabase session, keeps it in sync,
// and exposes email/password auth actions. Structured so additional
// providers (OAuth, magic links) can be added later as new actions.
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthError, Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** True while the initial session is being restored. */
  loading: boolean;
  signInWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ error: AuthError | null }>;
  signUpWithPassword: (
    email: string,
    password: string,
    fullName?: string,
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  requestPasswordReset: (email: string) => Promise<{ error: AuthError | null }>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setLoading(false);
      },
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    },
    [],
  );

  const signUpWithPassword = useCallback(
    async (email: string, password: string, fullName?: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: fullName ? { data: { full_name: fullName } } : undefined,
      });
      return { error };
    },
    [],
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/sign-in`,
    });
    return { error };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      requestPasswordReset,
    }),
    [
      session,
      loading,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      requestPasswordReset,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
