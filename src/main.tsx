// Application entry point: mounts the router, auth provider, and app routes.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ScopeProvider } from "@/context/ScopeContext";
import { PortalDataProvider } from "@/context/PortalDataContext";
import { App } from "@/App";
import "@/styles/global.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {/* Default scope: the signed-in customer viewing their own data.
            Admin scoped browsing mounts its own nested ScopeProvider with
            mode="admin" and the viewed customer's id. */}
        <ScopeProvider>
          {/* Portal data lives above routing so signed-in navigation never
              refetches or flashes empty sidebar states. */}
          <PortalDataProvider>
            <App />
          </PortalDataProvider>
        </ScopeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
