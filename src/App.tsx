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
import { ActivityPage } from "@/pages/activity/ActivityPage/ActivityPage";
import { SiteDetailPage } from "@/pages/sites/SiteDetailPage/SiteDetailPage";
import { MapPage } from "@/pages/map/MapPage/MapPage";
import { ReportsLibraryPage } from "@/pages/reports/ReportsLibraryPage/ReportsLibraryPage";
import { ReportViewerPage } from "@/pages/reports/ReportViewerPage/ReportViewerPage";
import { RequestFlowLayout } from "@/pages/portal/RequestFlowLayout/RequestFlowLayout";
import { RequestStartPage } from "@/pages/portal/RequestStartPage/RequestStartPage";
import { ExpertRequestPage } from "@/pages/portal/ExpertRequestPage/ExpertRequestPage";
import { NewRequestPage } from "@/pages/portal/NewRequestPage/NewRequestPage";
import { AccountPage } from "@/pages/portal/AccountPage/AccountPage";
import { AdminLayout } from "@/components/layout/AdminLayout/AdminLayout";
import { AdminScopedLayout } from "@/components/layout/AdminScopedLayout/AdminScopedLayout";
import { AdminCustomerIndexPage } from "@/pages/admin/AdminCustomerIndexPage/AdminCustomerIndexPage";
import { WorkspacePage } from "@/pages/workspace/WorkspacePage/WorkspacePage";
import { ServiceEngagementPage } from "@/pages/services/ServiceEngagementPage/ServiceEngagementPage";
import { PublishReportPage } from "@/pages/admin/PublishReportPage/PublishReportPage";
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
        <Route path="activity" element={<ActivityPage />} />
        {/* No sites index page — the workspace is the overview. Individual
            sites keep their detail pages. */}
        <Route path="sites" element={<Navigate to="/" replace />} />
        <Route path="sites/:slug" element={<SiteDetailPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="reports" element={<ReportsLibraryPage />} />
        <Route path="reports/:id" element={<ReportViewerPage />} />
        {/* New request: chooser first, then the chosen path. Both live
            inside RequestFlowLayout so the decorative globe stays mounted
            and can slide between corners on navigation. The self-service
            form stays routed but unlinked until its card's button is
            switched on. */}
        <Route element={<RequestFlowLayout />}>
          <Route path="requests/new" element={<RequestStartPage />} />
          <Route path="requests/new/expert" element={<ExpertRequestPage />} />
        </Route>
        <Route path="requests/new/self-service" element={<NewRequestPage />} />
        <Route path="account" element={<AccountPage />} />
      </Route>

      {/* Admin: its own minimal chrome, outside the customer portal
          shell — no sidebar, no customer navigation. */}
      <Route
        path="admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminCustomerIndexPage />} />
      </Route>

      {/* Admin scoped browsing: the customer id lives in the URL, and the
          existing portal components render inside an admin-mode scope. */}
      <Route
        path="admin/c/:customerId"
        element={
          <AdminRoute>
            <AdminScopedLayout />
          </AdminRoute>
        }
      >
        <Route index element={<WorkspacePage />} />
        <Route path="services/:id" element={<ServiceEngagementPage />} />
        <Route path="reports" element={<ReportsLibraryPage />} />
        <Route path="reports/:id" element={<ReportViewerPage />} />
        <Route path="attention" element={<AttentionPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="sites/:slug" element={<SiteDetailPage />} />
        <Route path="publish" element={<PublishReportPage />} />
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
