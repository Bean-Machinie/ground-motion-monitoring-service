// Redirect components for pre-restructure URLs.
//   /portal            → /            (preserving ?tab=…, which the
//                                      workspace maps to the new routes)
//   /portal/projects/:slug → /sites/:slug
import { Navigate, useLocation, useParams } from "react-router-dom";

export function LegacyPortalRedirect() {
  const location = useLocation();
  return <Navigate to={{ pathname: "/", search: location.search }} replace />;
}

export function LegacyProjectRedirect() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={slug ? `/sites/${slug}` : "/sites"} replace />;
}
