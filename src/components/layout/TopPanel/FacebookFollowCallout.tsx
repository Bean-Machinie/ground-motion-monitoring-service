// Facebook icon link (new tab) with a small text label.
import { site } from "@/config/site";
import styles from "./FacebookFollowCallout.module.css";

export function FacebookFollowCallout() {
  return (
    <a
      className={styles.callout}
      href={site.facebookUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className={styles.icon} aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.1-3.2 3.2V11H9v3h2.3v7h2.2z" />
        </svg>
      </span>
      <span className={styles.label}>Follow us on Facebook</span>
    </a>
  );
}
