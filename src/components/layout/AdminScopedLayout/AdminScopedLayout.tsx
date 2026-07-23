// Admin scoped browsing layout for /admin/c/:customerId/*.
//
// The customer id lives in the URL (so refresh, back, and bookmarks are
// unambiguous). This thin layout reads it and mounts, around the ordinary
// portal shell:
//   - a nested ScopeProvider in admin mode, scoped to that customer and
//     writable (admins may create/edit/delete the customer's objects),
//   - AdminCustomersProvider, so the sidebar switcher and context bar share
//     one customer roster, and
//   - a nested PortalDataProvider, which therefore fetches that customer's
//     rows (RLS permits it because the signed-in user is an admin).
// PortalShell then renders the same sidebar, top panel, and page components
// the customer sees — never copies. Switching customers changes the URL
// param, which re-keys the data provider and refetches.
import { useParams } from "react-router-dom";
import { ScopeProvider } from "@/context/ScopeContext";
import { AdminCustomersProvider } from "@/context/AdminCustomersContext";
import { PortalDataProvider } from "@/context/PortalDataContext";
import { PortalShell } from "@/components/layout/PortalShell/PortalShell";

export function AdminScopedLayout() {
  const { customerId } = useParams<{ customerId: string }>();

  return (
    <ScopeProvider customerId={customerId} mode="admin" canWrite>
      <AdminCustomersProvider>
        <PortalDataProvider>
          {/* No children → PortalShell renders its <Outlet />, i.e. the
              scoped portal page for the current sub-route. */}
          <PortalShell />
        </PortalDataProvider>
      </AdminCustomersProvider>
    </ScopeProvider>
  );
}
