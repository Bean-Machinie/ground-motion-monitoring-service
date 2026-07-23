// Minimal admin chrome — deliberately NOT the customer portal shell.
// No sidebar, no service tree, no customer navigation: a plain bar that
// says where you are and a way back to the app.
import { Link, Outlet } from "react-router-dom";
import styles from "./AdminLayout.module.css";

export function AdminLayout() {
  return (
    <div className={styles.shell}>
      <header className={styles.bar}>
        <span className={styles.badge}>Admin</span>
        <span className={styles.title}>Administration</span>
        <Link to="/" className={styles.back}>
          ← Back to the app
        </Link>
      </header>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
