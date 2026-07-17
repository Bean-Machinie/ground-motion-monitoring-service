// Application routes. Every page shares one AppLayout (header + footer);
// /portal routes add the auth guard via PortalShell.
import { Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout/AppLayout";
import { PortalShell } from "@/components/layout/PortalShell/PortalShell";
import { AdminRoute } from "@/components/auth/AdminRoute/AdminRoute";
import { RedirectIfAuthenticated } from "@/components/auth/RedirectIfAuthenticated/RedirectIfAuthenticated";
import { HomePage } from "@/pages/home/HomePage";
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
        <Route index element={<HomePage />} />
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
