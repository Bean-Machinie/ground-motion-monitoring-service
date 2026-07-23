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
// decides which customerId the portal queries filter on, and (via
// useScopedHref) which URL prefix intra-portal links carry.
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
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

/* ---------------------------------------------------------------------------
 * Scoped links.
 *
 * In customer mode the portal lives at the root ("/", "/services/:id",
 * "/reports", …). In admin mode the very same pages live under
 * "/admin/c/:customerId/…". Rather than fork components, shared components
 * build their hrefs through useScopedHref(), which prefixes portal-absolute
 * paths with the admin base when — and only when — mode is "admin". In
 * customer mode it is the identity function, so nothing changes.
 * ------------------------------------------------------------------------- */

/** Portal path roots that belong to a scoped customer. Marketing/identity
    paths (/account, /sign-in, /home, /requests, /admin) are deliberately
    absent — they are never rewritten. */
const SCOPED_ROOTS = [
  "/services",
  "/reports",
  "/attention",
  "/activity",
  "/map",
  "/sites",
];

/** The scope's URL prefix ("" in customer mode). Also used to strip the
    prefix back off when matching the current pathname. */
export function scopeBasePath(mode: ScopeMode, customerId: string): string {
  return mode === "admin" && customerId ? `/admin/c/${customerId}` : "";
}

/** Pure path mapper. Root ("/") becomes the scope base; a scoped-root path
    is prefixed; everything else (marketing, identity, query-only, external)
    passes through unchanged. */
export function scopedPath(
  path: string,
  mode: ScopeMode,
  customerId: string,
): string {
  if (mode !== "admin" || !customerId) return path;
  const base = scopeBasePath(mode, customerId);
  if (path === "/") return base;
  if (!path.startsWith("/")) return path;
  const isScoped = SCOPED_ROOTS.some(
    (root) => path === root || path.startsWith(`${root}/`),
  );
  return isScoped ? base + path : path;
}

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

/** Returns a path mapper bound to the current scope. Identity in customer
    mode; prefixes portal paths with /admin/c/:customerId in admin mode. */
export function useScopedHref(): (path: string) => string {
  const { mode, customerId } = useScope();
  return useCallback(
    (path: string) => scopedPath(path, mode, customerId),
    [mode, customerId],
  );
}
