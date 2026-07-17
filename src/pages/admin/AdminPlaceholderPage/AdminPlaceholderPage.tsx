// Administrator placeholder page, reachable only via AdminRoute.
// A full administration interface will be added in a later phase.
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import styles from "./AdminPlaceholderPage.module.css";

export function AdminPlaceholderPage() {
  return (
    <div className={`container ${styles.page}`}>
      <h1>Administration</h1>
      <EmptyState
        title="Administrator area"
        description="Administration tools for managing customers, projects, and results will be built here in a later phase."
        action={<Link to="/portal">Back to portal</Link>}
      />
    </div>
  );
}
