// Application routes.
// Public/marketing pages share AppLayout (top panel + footer); every
// signed-in page lives inside PortalShell (sidebar + content column) and
// renders content only — pages never carry their own navigation.
// "/" and "/services/:slug" are auth-aware dispatchers between the two
// worlds. Legacy /portal* and ?tab=… URLs redirect to the new structure.
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout/AppLayout";
import { PortalShell } from "@/components/layout/PortalShell/PortalShell";
import { AdminRoute } from "@/components/auth/AdminRoute/AdminRoute";
import { RedirectIfAuthenticated } from "@/components/auth/RedirectIfAuthenticated/RedirectIfAuthenticated";
import {
  LegacyPortalRedirect,
  LegacyProjectRedirect,
} from "@/components/routing/LegacyRedirects";
import { RootPage } from "@/pages/home/RootPage";
import { HomePage } from "@/pages/home/HomePage";
import { ServicesPage } from "@/pages/services/ServicesPage/ServicesPage";
import { ServiceRoute } from "@/pages/services/ServiceRoute";
import { AboutPage } from "@/pages/about/AboutPage/AboutPage";
import { TechnologyPage } from "@/pages/technology/TechnologyPage/TechnologyPage";
import { IndustriesPage } from "@/pages/industries/IndustriesPage/IndustriesPage";
import { CaseStudiesPage } from "@/pages/case-studies/CaseStudiesPage/CaseStudiesPage";
import { SignInPage } from "@/pages/auth/SignInPage/SignInPage";
import { SignUpPage } from "@/pages/auth/SignUpPage/SignUpPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage/ForgotPasswordPage";
import { AttentionPage } from "@/pages/attention/AttentionPage/AttentionPage";
import { SiteDetailPage } from "@/pages/sites/SiteDetailPage/SiteDetailPage";
import { MapPage } from "@/pages/map/MapPage/MapPage";
import { ReportsLibraryPage } from "@/pages/reports/ReportsLibraryPage/ReportsLibraryPage";
import { ReportViewerPage } from "@/pages/reports/ReportViewerPage/ReportViewerPage";
import { NewRequestPage } from "@/pages/portal/NewRequestPage/NewRequestPage";
import { AccountPage } from "@/pages/portal/AccountPage/AccountPage";
import { AdminPlaceholderPage } from "@/pages/admin/AdminPlaceholderPage/AdminPlaceholderPage";
import { NotFoundPage } from "@/pages/not-found/NotFoundPage/NotFoundPage";

export function App() {
  return (
    <Routes>
      {/* Auth-aware dispatchers between the marketing and app shells. */}
      <Route path="/" element={<RootPage />} />
      <Route path="services/:slug" element={<ServiceRoute />} />

      {/* Public/marketing pages: top-bar layout. */}
      <Route element={<AppLayout />}>
        {/* Marketing homepage stays reachable for signed-in users
            (account menu -> Explore -> Home). */}
        <Route path="home" element={<HomePage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="technology" element={<TechnologyPage />} />
        <Route path="industries" element={<IndustriesPage />} />
        <Route path="case-studies" element={<CaseStudiesPage />} />
        <Route
          path="sign-in"
          element={
            <RedirectIfAuthenticated>
              <SignInPage />
            </RedirectIfAuthenticated>
          }
        />
        <Route
          path="sign-up"
          element={
            <RedirectIfAuthenticated>
              <SignUpPage />
            </RedirectIfAuthenticated>
          }
        />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Signed-in app: sidebar shell. Real places, not tabs. */}
      <Route element={<PortalShell />}>
        <Route path="attention" element={<AttentionPage />} />
        {/* No sites index page — the workspace is the overview. Individual
            sites keep their detail pages. */}
        <Route path="sites" element={<Navigate to="/" replace />} />
        <Route path="sites/:slug" element={<SiteDetailPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="reports" element={<ReportsLibraryPage />} />
        <Route path="reports/:id" element={<ReportViewerPage />} />
        <Route path="requests/new" element={<NewRequestPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminPlaceholderPage />
            </AdminRoute>
          }
        />
      </Route>

      {/* Legacy URLs from the projects/results era. */}
      <Route path="portal" element={<LegacyPortalRedirect />} />
      <Route path="portal/projects" element={<Navigate to="/" replace />} />
      <Route path="portal/projects/:slug" element={<LegacyProjectRedirect />} />
      <Route
        path="portal/requests/new"
        element={<Navigate to="/requests/new" replace />}
      />
      <Route
        path="portal/account"
        element={<Navigate to="/account" replace />}
      />
    </Routes>
  );
}
