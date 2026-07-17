// Homepage closing call to action directing users to sign in or request access.
import { site } from "@/config/site";
import { Button } from "@/components/ui/Button/Button";
import styles from "./CallToActionSection.module.css";

export function CallToActionSection() {
  return (
    <section className={styles.section} aria-labelledby="cta-heading">
      <div className={`container ${styles.inner}`}>
        <h2 id="cta-heading">Access your monitoring results</h2>
        <p className={styles.text}>
          Already a customer? Sign in to view your projects. New to{" "}
          {site.shortName}? Create an account or contact us at{" "}
          <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> to
          discuss a monitoring engagement.
        </p>
        <div className={styles.ctas}>
          <Button to="/sign-in">Sign in</Button>
          <Button to="/sign-up" variant="secondary">
            Create an account
          </Button>
        </div>
      </div>
    </section>
  );
}
