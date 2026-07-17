// Homepage hero: product statement with an abstract CSS terrain visual.
import { site } from "@/config/site";
import { Button } from "@/components/ui/Button/Button";
import styles from "./HeroSection.module.css";

export function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.copy}>
          <h1 className={styles.title}>{site.tagline}</h1>
          <p className={styles.lead}>
            {site.name} gives organizations secure, structured access to
            ground-motion monitoring and analysis results for their sites and
            infrastructure projects.
          </p>
          <div className={styles.ctas}>
            <Button to="/sign-in">Sign in</Button>
            <Button to="/sign-up" variant="secondary">
              Request access
            </Button>
          </div>
        </div>

        {/* Abstract terrain / measurement visual, generated with CSS only. */}
        <div className={styles.visual} aria-hidden="true">
          <div className={styles.gridLines} />
          <div className={`${styles.ridge} ${styles.ridgeBack}`} />
          <div className={`${styles.ridge} ${styles.ridgeMid}`} />
          <div className={`${styles.ridge} ${styles.ridgeFront}`} />
          <div className={styles.marker} style={{ left: "22%", top: "38%" }} />
          <div className={styles.marker} style={{ left: "55%", top: "52%" }} />
          <div className={styles.marker} style={{ left: "78%", top: "30%" }} />
        </div>
      </div>
    </section>
  );
}
