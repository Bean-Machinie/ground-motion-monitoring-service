// Application routes. Every page shares one AppLayout (header + footer);
// /portal routes add the auth guard via PortalShell.
import { Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout/AppLayout";
import { PortalShell } from "@/components/layout/PortalShell/PortalShell";
import { AdminRoute } from "@/components/auth/AdminRoute/AdminRoute";
import { RedirectIfAuthenticated } from "@/components/auth/RedirectIfAuthenticated/RedirectIfAuthenticated";
import { RootPage } from "@/pages/home/RootPage";
import { HomePage } from "@/pages/home/HomePage";
import { ServicesPage } from "@/pages/services/ServicesPage/ServicesPage";
import { ServiceDetailPage } from "@/pages/services/ServiceDetailPage/ServiceDetailPage";
import { AboutPage } from "@/pages/about/AboutPage/AboutPage";
import { TechnologyPage } from "@/pages/technology/TechnologyPage/TechnologyPage";
import { IndustriesPage } from "@/pages/industries/IndustriesPage/IndustriesPage";
import { CaseStudiesPage } from "@/pages/case-studies/CaseStudiesPage/CaseStudiesPage";
import { SignInPage } from "@/pages/auth/SignInPage/SignInPage";
import { SignUpPage } from "@/pages/auth/SignUpPage/SignUpPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage/ForgotPasswordPage";
import { DashboardPage } from "@/pages/portal/DashboardPage/DashboardPage";
import { ProjectsPage } from "@/pages/portal/ProjectsPage/ProjectsPage";
import { ProjectDetailPage } from "@/pages/portal/ProjectDetailPage/ProjectDetailPage";
import { AccountPage } from "@/pages/portal/AccountPage/AccountPage";
import { AdminPlaceholderPage } from "@/pages/admin/AdminPlaceholderPage/AdminPlaceholderPage";
import { NotFoundPage } from "@/pages/not-found/NotFoundPage/NotFoundPage";

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<RootPage />} />
        {/* Marketing homepage stays reachable for signed-in users
            (Explore menu -> Home). */}
        <Route path="home" element={<HomePage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="services/:slug" element={<ServiceDetailPage />} />
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

        <Route path="portal" element={<PortalShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:slug" element={<ProjectDetailPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>

        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminPlaceholderPage />
            </AdminRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
