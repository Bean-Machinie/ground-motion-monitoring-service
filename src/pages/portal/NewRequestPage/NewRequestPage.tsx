// New request start page. For now a single guided option — expert
// guidance via the contact block. Self-service requests come later.
import { Link } from "react-router-dom";
import { site } from "@/config/site";
import { PortalPageHeader } from "@/components/layout/PortalShell/PortalPageHeader";
import { AppIcon } from "@/components/ui/AppIcon/AppIcon";
import styles from "./NewRequestPage.module.css";

export function NewRequestPage() {
  return (
    <div className={styles.page}>
      <PortalPageHeader
        crumbs={[{ label: "Workspace", to: "/" }, { label: "New request" }]}
        title="How would you like to start?"
        lede="Talk to our team to find the right ground motion service for your project."
      />

      <article className={styles.card}>
        <span className={styles.cardIcon} aria-hidden="true">
          <AppIcon name="user-group" size={26} />
        </span>
        <h2 className={styles.cardTitle}>Get Expert Guidance</h2>
        <p className={styles.cardSubtitle}>
          For teams that want help defining the right approach.
        </p>
        <p className={styles.cardBody}>
          Talk to our team if your project is complex, if you are unsure which
          service fits, or if you want specialist input before submitting a
          request.
        </p>
        <ul className={styles.cardList}>
          <li>Clarify your project objective and monitoring needs</li>
          <li>Get help choosing the right service type</li>
          <li>Define suitable outputs, delivery format, and next steps</li>
        </ul>
        <Link
          className={styles.cta}
          to="/home#contact"
          onClick={() => {
            // The contact block lives in the marketing footer; scroll to it
            // once the route has rendered.
            window.setTimeout(() => {
              document
                .getElementById("contact")
                ?.scrollIntoView({ behavior: "smooth" });
            }, 0);
          }}
        >
          Talk to Our Team
        </Link>
        <p className={styles.footnote}>
          Best when you want support before starting the formal request.
        </p>
      </article>

      <p className={styles.comingSoon}>
        Self-service requests will be available here soon. You can also reach
        us directly at{" "}
        <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
      </p>
    </div>
  );
}
