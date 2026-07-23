// Scope: which customer's data the portal UI is currently showing, and
// whether the viewer may write to it.
//
// For a signed-in customer the scope is simply themselves — customerId is
// their own id (identical to what RLS already restricts them to), mode is
// "customer", and they may write. Admin scoped browsing (see /admin) mounts
// a nested ScopeProvider with mode="admin" and the *viewed* customer's id,
// so the same portal components re-render against that customer's rows.
//
// This is not impersonation: the signed-in user never changes, no JWT is
// swapped, and RLS is still the real authorization boundary — is_admin() is
// what actually permits an admin to read another org's rows. Scope only
// decides which customerId the portal queries filter on.
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

export type ScopeMode = "customer" | "admin";

export interface Scope {
  /** The org/customer id every portal query filters on (services.org_id,
      reports.org_id, sites.org_id, alerts.org_id). Equals the customer's
      profile id. */
  customerId: string;
  mode: ScopeMode;
  /** Whether the viewer may create/edit/delete within this scope. */
  canWrite: boolean;
}

const ScopeContext = createContext<Scope | null>(null);

export function ScopeProvider({
  children,
  customerId,
  mode = "customer",
  canWrite,
}: {
  children: ReactNode;
  /** Omit to scope to the signed-in user (the customer default). Admin
      browsing always passes an explicit id (the customer being viewed). */
  customerId?: string;
  mode?: ScopeMode;
  /** Defaults to true in customer mode, false in admin mode (admin write
      actions are a later phase). */
  canWrite?: boolean;
}) {
  const { user } = useAuth();
  const resolvedCustomerId = customerId ?? user?.id ?? "";
  const resolvedCanWrite = canWrite ?? mode === "customer";

  const value = useMemo<Scope>(
    () => ({
      customerId: resolvedCustomerId,
      mode,
      canWrite: resolvedCanWrite,
    }),
    [resolvedCustomerId, mode, resolvedCanWrite],
  );

  return (
    <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>
  );
}

export function useScope(): Scope {
  const ctx = useContext(ScopeContext);
  if (!ctx) {
    throw new Error("useScope must be used inside a ScopeProvider");
  }
  return ctx;
}
