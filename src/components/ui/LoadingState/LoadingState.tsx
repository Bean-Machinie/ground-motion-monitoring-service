// Shared loading indicator with an accessible status role.
import styles from "./LoadingState.module.css";

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Loading…" }: LoadingStateProps) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
