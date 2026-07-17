// Layout for public pages: header with public navigation, content, footer.
import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header/Header";
import { Footer } from "@/components/layout/Footer/Footer";
import { publicNavLinks } from "@/config/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button/Button";
import styles from "./PublicLayout.module.css";

export function PublicLayout() {
  const { user } = useAuth();

  return (
    <div className={styles.layout}>
      <Header
        links={publicNavLinks.filter((link) => !(user && link.to === "/sign-in"))}
        actions={
          user ? (
            <Button to="/portal" variant="secondary">
              Go to portal
            </Button>
          ) : undefined
        }
      />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
