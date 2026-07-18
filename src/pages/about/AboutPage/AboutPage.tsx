// About page (/about): company story and mission.
import { site } from "@/config/site";
import { StandardPage } from "@/components/layout/StandardPage/StandardPage";
import aboutImage from "@/assets/images/hero_2.png";
import styles from "./AboutPage.module.css";

export function AboutPage() {
  return (
    <StandardPage
      crumbs={[{ label: "Home", to: "/" }, { label: "About" }]}
      title="About Us"
      lede={`${site.companyName} was founded to make satellite-based ground deformation insight practical for the people responsible for critical sites and infrastructure.`}
    >
      <div className={styles.layout}>
        <div>
          <p className={styles.text}>
            We combine radar remote sensing with careful analysis to turn
            subtle ground movement into clear, reviewable findings. Our team
            brings together InSAR specialists, geoscientists, and engineers
            who have spent years translating research-grade methods into
            operational tools.
          </p>
          <p className={styles.text}>
            Our mission is simple: help organizations detect risk early and
            act with confidence, through monitoring results they can actually
            read and use. Every engagement is delivered through our secure
            portal, structured around your projects.
          </p>
          <a href={`mailto:${site.contactEmail}`} className={styles.cta}>
            Get in Touch
          </a>
        </div>
        <div className={styles.imageWrap}>
          <img
            src={aboutImage}
            alt="Satellite view of monitored infrastructure"
            className={styles.image}
          />
        </div>
      </div>
    </StandardPage>
  );
}
