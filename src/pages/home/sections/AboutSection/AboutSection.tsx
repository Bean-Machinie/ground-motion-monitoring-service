// Homepage About Us story: two-column image + company mission with contact CTA.
import { site } from "@/config/site";
import aboutImage from "@/assets/images/hero_2.png";
import styles from "./AboutSection.module.css";

export function AboutSection() {
  return (
    <section className={styles.section} aria-labelledby="about-heading">
      <div className={`container ${styles.grid}`}>
        <div className={styles.imageWrap}>
          <img
            src={aboutImage}
            alt="Satellite view of monitored infrastructure"
            className={styles.image}
          />
        </div>
        <div className={styles.body}>
          <h2 id="about-heading">About Us</h2>
          <p className={styles.text}>
            {site.companyName} was founded to make satellite-based ground
            deformation insight practical for the people responsible for
            critical sites and infrastructure. We combine radar remote sensing
            with careful analysis to turn subtle ground movement into clear,
            reviewable findings.
          </p>
          <p className={styles.text}>
            Our mission is simple: help organizations detect risk early and
            act with confidence, through monitoring results they can actually
            read and use.
          </p>
          <a href={`mailto:${site.contactEmail}`} className={styles.cta}>
            Get in Touch
          </a>
        </div>
      </div>
    </section>
  );
}
