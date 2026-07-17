// Labelled placeholder panel for features planned in later phases
// (maps, time-series charts, downloadable reports).
import styles from "./PlaceholderPanel.module.css";

interface PlaceholderPanelProps {
  title: string;
  description: string;
}

export function PlaceholderPanel({ title, description }: PlaceholderPanelProps) {
  return (
    <div className={styles.panel}>
      <span className={styles.tag}>Planned</span>
      <h4 className={styles.title}>{title}</h4>
      <p className={styles.description}>{description}</p>
    </div>
  );
}
