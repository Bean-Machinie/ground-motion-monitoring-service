// Homepage intro section: short pitch with a yellow CTA to the services page.
import { Link } from "react-router-dom";
import arrowAsset from "@/assets/icons/arrow.svg";
import styles from "./ExploreSection.module.css";

export function ExploreSection() {
  return (
    <section className={styles.section} aria-labelledby="explore-heading">
      <div className="container">
        <div className={styles.inner}>
          <h2 id="explore-heading">Explore</h2>
        <p className={styles.text}>
          We deliver monitoring, analysis, and early warning services based on
          satellite radar data. Whether you need continuous tracking of
          infrastructure or focused investigations, we provide clear insight
          into ground movement - so you can detect risk early and act with
          confidence.
        </p>
          <Link to="/services" className={styles.ctaButton}>
            <span>View Services</span>
            <img src={arrowAsset} alt="" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
