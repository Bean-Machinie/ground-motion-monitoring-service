// Auth-related application types.
import type { Session, User } from "@supabase/supabase-js";
import type { ProfileRow } from "@/types/database";

export type Profile = ProfileRow;

export interface AuthState {
  session: Session | null;
  user: User | null;
  /** True while the initial session is being restored. */
  loading: boolean;
}
