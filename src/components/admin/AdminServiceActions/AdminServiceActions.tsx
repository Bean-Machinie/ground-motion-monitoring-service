// Admin action bar shown on the scoped service page. Edit the service,
// publish a new issue into it, cancel it (reversible), or delete it
// permanently (guarded). Rendered only in admin scope; the customer never
// sees it.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/Button/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog/ConfirmDialog";
import { AdminServiceForm } from "@/components/admin/AdminServiceForm/AdminServiceForm";
import {
  cancelService,
  deleteServiceDeep,
  describeServiceDeletion,
} from "@/lib/adminServices";
import type { Alert, Report, Service, Site } from "@/types/domain";
import styles from "./AdminServiceActions.module.css";

type Dialog = "cancel" | "delete" | null;

export function AdminServiceActions({
  service,
  sites,
  reports,
  alerts,
  customerId,
  onChanged,
}: {
  service: Service;
  sites: Site[];
  reports: Report[];
  alerts: Alert[];
  customerId: string;
  onChanged: () => void;
}) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const counts = describeServiceDeletion(service, reports, alerts);
  const isCancelled = service.status === "cancelled";

  function closeDialog() {
    if (busy) return;
    setDialog(null);
    setError(null);
  }

  async function doCancel() {
    setBusy(true);
    setError(null);
    try {
      const { error: e } = await cancelService(service.id);
      if (e) throw e;
      setDialog(null);
      onChanged();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function doDelete() {
    setBusy(true);
    setError(null);
    try {
      const { error: e } = await deleteServiceDeep(service.id, service.site_id);
      if (e) throw e;
      setDialog(null);
      onChanged();
      // The service no longer exists — leave its page for the overview.
      navigate(`/admin/c/${customerId}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.bar}>
      <span className={styles.tag}>Admin</span>
      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Edit service
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            navigate(`/admin/c/${customerId}/publish?service=${service.id}`)
          }
        >
          Publish issue
        </Button>
        {!isCancelled ? (
          <Button variant="ghost" onClick={() => setDialog("cancel")}>
            Cancel service
          </Button>
        ) : null}
        <Button variant="ghost" onClick={() => setDialog("delete")}>
          Delete
        </Button>
      </div>

      {editing ? (
        <AdminServiceForm
          mode="edit"
          service={service}
          customerId={customerId}
          sites={sites}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            onChanged();
          }}
        />
      ) : null}

      {dialog === "cancel" ? (
        <ConfirmDialog
          title="Cancel this service?"
          confirmLabel="Cancel service"
          busy={busy}
          error={error}
          message={
            <>
              This marks <strong>{service.name}</strong> as Cancelled and
              removes it from active lists. Nothing is deleted — you can
              reactivate it later by editing its status.
            </>
          }
          onConfirm={() => void doCancel()}
          onClose={closeDialog}
        />
      ) : null}

      {dialog === "delete" ? (
        <ConfirmDialog
          title="Delete service permanently?"
          confirmLabel="Delete permanently"
          tone="danger"
          requireText={service.name}
          busy={busy}
          error={error}
          message={
            <>
              This permanently deletes <strong>{service.name}</strong>
              {counts.reports > 0 || counts.alerts > 0 ? (
                <>
                  {" "}
                  and everything attached to it —{" "}
                  <strong>
                    {counts.reports}{" "}
                    {counts.reports === 1 ? "report" : "reports"}
                  </strong>{" "}
                  and{" "}
                  <strong>
                    {counts.alerts} {counts.alerts === 1 ? "alert" : "alerts"}
                  </strong>
                  , including their uploaded files
                </>
              ) : null}
              . This cannot be undone. To keep the history, use{" "}
              <em>Cancel service</em> instead.
            </>
          }
          onConfirm={() => void doDelete()}
          onClose={closeDialog}
        />
      ) : null}
    </div>
  );
}
