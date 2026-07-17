// Shared site footer with contact details.
import { site } from "@/config/site";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <p className={styles.name}>{site.name}</p>
        <p className={styles.meta}>
          Contact: <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
        </p>
        <p className={styles.meta}>
          © {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  );
}
