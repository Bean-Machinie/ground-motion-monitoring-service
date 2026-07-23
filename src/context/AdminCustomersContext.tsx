// The customer roster for admin scoped browsing — every customer profile,
// fetched once and shared by the sidebar switcher and the context bar so
// they never each re-query. Cross-customer by nature (RLS returns all
// profiles to an admin), so it lives only inside the admin scoped subtree.
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import type { ProfileRow } from "@/types/database";

interface AdminCustomers {
  customers: ProfileRow[];
  byId: Map<string, ProfileRow>;
  loading: boolean;
  error: string | null;
}

const AdminCustomersContext = createContext<AdminCustomers | null>(null);

/** Display name for a customer: organisation first, then contact name,
    then email — the same order used on the customer index. */
export function customerLabel(profile: ProfileRow | undefined): string {
  if (!profile) return "…";
  return profile.organization_name || profile.full_name || profile.email;
}

export function AdminCustomersProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data, error: queryError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "customer")
        .order("organization_name", { nullsFirst: false })
        .order("email");
      if (!active) return;
      if (queryError) setError(getErrorMessage(queryError));
      else setCustomers(data ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const byId = useMemo(
    () => new Map(customers.map((c) => [c.id, c])),
    [customers],
  );

  const value = useMemo<AdminCustomers>(
    () => ({ customers, byId, loading, error }),
    [customers, byId, loading, error],
  );

  return (
    <AdminCustomersContext.Provider value={value}>
      {children}
    </AdminCustomersContext.Provider>
  );
}

export function useAdminCustomers(): AdminCustomers {
  const ctx = useContext(AdminCustomersContext);
  if (!ctx) {
    throw new Error(
      "useAdminCustomers must be used inside an AdminCustomersProvider",
    );
  }
  return ctx;
}
