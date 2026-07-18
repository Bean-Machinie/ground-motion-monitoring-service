// Services overview page (/services): "View Services" — lists all services
// as image cards linking to their detail pages.
import { Link } from "react-router-dom";
import { StandardPage } from "@/components/layout/StandardPage/StandardPage";
import { SERVICES } from "@/config/services";
import styles from "./ServicesPage.module.css";

export function ServicesPage() {
  return (
    <StandardPage
      crumbs={[{ label: "Home", to: "/" }, { label: "View Services" }]}
      title="Our Services"
      lede="From a one-time movement check to continuous monitoring and bespoke research — choose the level of insight your site needs."
    >
      <div className={styles.grid}>
        {SERVICES.map((service) => (
          <Link
            key={service.slug}
            to={`/services/${service.slug}`}
            className={styles.card}
          >
            <img src={service.image} alt="" className={styles.cardImage} />
            <div className={styles.cardOverlay} aria-hidden="true" />
            <div className={styles.cardContent}>
              <span className={styles.cardLabel}>{service.eyebrow}</span>
              <h2 className={styles.cardTitle}>{service.name}</h2>
              <p className={styles.cardText}>{service.summary}</p>
            </div>
          </Link>
        ))}
      </div>
    </StandardPage>
  );
}
