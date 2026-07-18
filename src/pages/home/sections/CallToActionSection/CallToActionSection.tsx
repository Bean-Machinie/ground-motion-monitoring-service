// Homepage closing call to action: heading and copy on the left, yellow
// arrow CTA button on the right.
import { Link } from "react-router-dom";
import arrowAsset from "@/assets/icons/arrow.svg";
import styles from "./CallToActionSection.module.css";

export function CallToActionSection() {
  return (
    <section className={styles.section} aria-labelledby="cta-heading">
      <div className={`container ${styles.inner}`}>
        <div className={styles.copy}>
          <h2 id="cta-heading" className={styles.heading}>
            Ready to discuss a monitoring need?
          </h2>
          <p className={styles.text}>
            Whether you need a one-off ground motion assessment, continuous
            monitoring, or help defining the right InSAR service, our team can
            help scope the right approach.
          </p>
        </div>
        <Link to="/sign-up" className={styles.ctaButton}>
          <span>Start a Ground Motion Request</span>
          <img src={arrowAsset} alt="" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
