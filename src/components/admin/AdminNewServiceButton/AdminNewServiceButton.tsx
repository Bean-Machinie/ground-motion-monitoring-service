// "New service" affordance for the scoped Overview. Self-contained so the
// customer's WorkspacePage only has to drop it in behind an admin check.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePortalData } from "@/context/PortalDataContext";
import { useScope } from "@/context/ScopeContext";
import { Button } from "@/components/ui/Button/Button";
import { AdminServiceForm } from "@/components/admin/AdminServiceForm/AdminServiceForm";
import styles from "./AdminNewServiceButton.module.css";

export function AdminNewServiceButton() {
  const { customerId } = useScope();
  const { sites, refetch } = usePortalData();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.bar}>
      <span className={styles.tag}>Admin</span>
      <span className={styles.hint}>Managing this customer's account</span>
      <Button onClick={() => setOpen(true)}>+ New service</Button>

      {open ? (
        <AdminServiceForm
          mode="create"
          customerId={customerId}
          sites={sites}
          onClose={() => setOpen(false)}
          onSaved={(service) => {
            setOpen(false);
            refetch();
            navigate(`/admin/c/${customerId}/services/${service.id}`);
          }}
        />
      ) : null}
    </div>
  );
}
