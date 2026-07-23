// Persistent banner across the top of every /admin/c/:customerId/* page,
// in a distinct accent so a customer's view can never be mistaken for the
// admin's own. Names the customer being viewed and offers a way back to
// the customer index.
import { Link } from "react-router-dom";
import { useScope } from "@/context/ScopeContext";
import {
  customerLabel,
  useAdminCustomers,
} from "@/context/AdminCustomersContext";
import styles from "./AdminContextBar.module.css";

export function AdminContextBar() {
  const { customerId } = useScope();
  const { byId } = useAdminCustomers();
  const name = customerLabel(byId.get(customerId));

  return (
    <div className={styles.bar} role="status">
      <span className={styles.badge}>Admin</span>
      <span className={styles.text}>
        Viewing <strong className={styles.name}>{name}</strong>
      </span>
      <Link to="/admin" className={styles.exit}>
        All customers →
      </Link>
    </div>
  );
}
