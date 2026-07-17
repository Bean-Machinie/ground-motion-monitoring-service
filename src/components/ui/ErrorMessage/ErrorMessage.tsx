// Shared error display with an optional retry action.
import styles from "./ErrorMessage.module.css";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className={styles.wrapper} role="alert">
      <p className={styles.message}>{message}</p>
      {onRetry ? (
        <button type="button" className={styles.retry} onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
