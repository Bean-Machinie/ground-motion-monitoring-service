// Shared status badge with a tone derived from common status values.
import styles from "./StatusBadge.module.css";

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const STATUS_TONES: Record<string, Tone> = {
  // Service (engagement) statuses
  draft: "neutral",
  scoping: "info",
  active: "success",
  paused: "warning",
  completed: "success",
  cancelled: "danger",
  // Report states
  pending: "neutral",
  processing: "info",
  in_review: "info",
  published: "success",
  failed: "danger",
  superseded: "neutral",
  // Alert severities
  info: "info",
  warning: "warning",
  critical: "danger",
  // Legacy statuses (kept while old records may still surface)
  archived: "neutral",
  requested: "info",
  confirmed: "info",
  in_progress: "info",
};

interface StatusBadgeProps {
  status: string;
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const tone: Tone = STATUS_TONES[status] ?? "neutral";
  return <span className={`${styles.badge} ${styles[tone]}`}>{label}</span>;
}
