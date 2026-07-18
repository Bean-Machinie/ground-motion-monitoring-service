// Service detail page (/services/:slug), driven by the service catalogue.
// Breadcrumb: Home / View Services / <Service>.
import { Link, useParams } from "react-router-dom";
import { StandardPage } from "@/components/layout/StandardPage/StandardPage";
import { getService } from "@/config/services";
import { NotFoundPage } from "@/pages/not-found/NotFoundPage/NotFoundPage";
import arrowAsset from "@/assets/icons/arrow.svg";
import styles from "./ServiceDetailPage.module.css";

export function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const service = slug ? getService(slug) : undefined;

  if (!service) {
    return <NotFoundPage />;
  }

  return (
    <StandardPage
      crumbs={[
        { label: "Home", to: "/" },
        { label: "View Services", to: "/services" },
        { label: service.name },
      ]}
      title={service.name}
      lede={service.lede}
    >
      <div className={styles.layout}>
        <div className={styles.body}>
          {service.sections.map((section) => (
            <section key={section.heading} className={styles.block}>
              <h2 className={styles.blockHeading}>{section.heading}</h2>
              <p className={styles.blockText}>{section.text}</p>
            </section>
          ))}
          <Link to="/sign-up" className={styles.ctaButton}>
            <span>Start a Ground Motion Request</span>
            <img src={arrowAsset} alt="" aria-hidden="true" />
          </Link>
        </div>
        <div className={styles.imageWrap}>
          <img
            src={service.image}
            alt={`${service.name} illustration`}
            className={styles.image}
          />
        </div>
      </div>
    </StandardPage>
  );
}
