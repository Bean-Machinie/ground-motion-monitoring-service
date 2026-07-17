// Shared status badge with a tone derived from common status values.
import styles from "./StatusBadge.module.css";

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const STATUS_TONES: Record<string, Tone> = {
  // Project statuses
  draft: "neutral",
  active: "success",
  processing: "info",
  completed: "success",
  archived: "neutral",
  // Result statuses
  published: "success",
  failed: "danger",
  // Order statuses
  requested: "info",
  confirmed: "info",
  in_progress: "info",
  cancelled: "danger",
};

interface StatusBadgeProps {
  status: string;
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const tone: Tone = STATUS_TONES[status] ?? "neutral";
  return <span className={`${styles.badge} ${styles[tone]}`}>{label}</span>;
}
