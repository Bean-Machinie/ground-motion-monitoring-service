// Confirmation dialog over the Modal primitive. Two registers:
//   - a plain confirm (Cancel service): message + Confirm/Back.
//   - a type-to-confirm (Delete permanently): pass requireText and the
//     confirm button stays disabled until the person types it exactly.
import { useState, type ReactNode } from "react";
import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";
import styles from "./ConfirmDialog.module.css";

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  tone = "default",
  requireText,
  busy = false,
  error,
  onConfirm,
  onClose,
}: {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  tone?: "default" | "danger";
  /** When set, the confirm button unlocks only once this exact string is
      typed — a deliberate friction for destructive actions. */
  requireText?: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [typed, setTyped] = useState("");
  const locked = requireText !== undefined && typed !== requireText;

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Back
          </Button>
          <Button
            variant={tone === "danger" ? "secondary" : "primary"}
            onClick={onConfirm}
            disabled={locked || busy}
            className={tone === "danger" ? styles.dangerButton : undefined}
          >
            {busy ? "Working…" : confirmLabel}
          </Button>
        </>
      }
    >
      <div className={styles.body}>
        <div className={styles.message}>{message}</div>

        {requireText !== undefined ? (
          <label className={styles.confirmField}>
            <span className={styles.confirmLabel}>
              Type <strong>{requireText}</strong> to confirm
            </span>
            <input
              type="text"
              className={styles.input}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
        ) : null}

        {error ? <p className={styles.error}>{error}</p> : null}
      </div>
    </Modal>
  );
}
