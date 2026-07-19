// Redirect components for pre-restructure URLs.
//   /portal            → /            (preserving ?tab=…, which the
//                                      workspace maps to the new routes)
//   /portal/projects/:slug → the service now running at that location.
//     A project became one site + one service; the service is the
//     primary object, so old project links land on the service page.
import { Navigate, useLocation, useParams } from "react-router-dom";
import { usePortalData } from "@/context/PortalDataContext";

export function LegacyPortalRedirect() {
  const location = useLocation();
  return <Navigate to={{ pathname: "/", search: location.search }} replace />;
}

export function LegacyProjectRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const { sites, services, loading } = usePortalData();

  if (loading) return null;

  const site = sites.find((s) => s.slug === slug);
  const siteServices = site
    ? services.filter((s) => s.site_id === site.id)
    : [];
  // Most recent engagement at the location wins; the site page remains
  // reachable from the service page for the full history.
  const target = siteServices[0];

  return <Navigate to={target ? `/services/${target.id}` : "/"} replace />;
}
