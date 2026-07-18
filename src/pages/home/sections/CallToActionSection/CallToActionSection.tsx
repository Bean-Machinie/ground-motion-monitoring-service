// Homepage closing call to action: full-width banner directing users to
// sign in or request access.
import { Link } from "react-router-dom";
import { site } from "@/config/site";
import styles from "./CallToActionSection.module.css";

export function CallToActionSection() {
  return (
    <section className={styles.section} aria-labelledby="cta-heading">
      <div className="container">
        <div className={styles.banner}>
          <h2 id="cta-heading" className={styles.heading}>
            Ready to discuss a monitoring need?
          </h2>
          <p className={styles.text}>
            Already a customer? Sign in to view your projects. New to{" "}
            {site.shortName}? Create an account or contact us at{" "}
            <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> to
            discuss a monitoring engagement.
          </p>
          <div className={styles.ctas}>
            <Link to="/sign-in" className={`${styles.btn} ${styles.btnAmber}`}>
              Sign in
            </Link>
            <Link to="/sign-up" className={`${styles.btn} ${styles.btnGhost}`}>
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
