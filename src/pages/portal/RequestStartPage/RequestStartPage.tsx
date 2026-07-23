// Request start chooser (/requests/new). Before any form, the customer
// picks how to begin: the self-service flow (bare bones for now — pick a
// product, name it, submit) at /requests/new/self-service, or specialist
// guidance, which leads to the expert-assisted request form at
// /requests/new/expert.
import { Link } from "react-router-dom";
import { usePortalCrumbs } from "@/components/layout/PortalShell/PortalShell";
import { AppIcon } from "@/components/ui/AppIcon/AppIcon";
import styles from "./RequestStartPage.module.css";

const SELF_SERVICE_POINTS = [
  "Choose screening or monitoring",
  "Name the work and submit",
  "The request appears in your overview immediately",
];

const EXPERT_POINTS = [
  "Clarify your project objective and monitoring needs",
  "Get help choosing the right service type",
  "Define suitable outputs, delivery format, and next steps",
];

export function RequestStartPage() {
  usePortalCrumbs([{ label: "Overview", to: "/" }, { label: "New request" }]);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>New request</p>
        <h1 className={styles.title}>How would you like to start?</h1>
        <p className={styles.lede}>
          Start the request yourself, or talk to our team if you want help
          choosing the right ground motion service.
        </p>
      </header>

      <div className={styles.cards}>
        {/* --------------------- Self-service card --------------------- */}
        <section className={`${styles.card} ${styles.cardHighlight}`}>
          <span className={styles.iconChip}>
            <AppIcon name="file" size={20} />
          </span>
          <h2 className={styles.cardTitle}>Start a Self-Service Request</h2>
          <p className={styles.cardKicker}>
            For teams that know what they want to set up.
          </p>
          <p className={styles.cardBody}>
            Use the guided flow to define your area of interest, choose a
            service, and submit the request directly through the platform.
          </p>
          <ul className={styles.points}>
            {SELF_SERVICE_POINTS.map((point) => (
              <li key={point} className={styles.point}>
                {point}
              </li>
            ))}
          </ul>
          <div className={styles.cardFooter}>
            <Link
              to="/requests/new/self-service"
              className={styles.primaryButton}
            >
              Start Self-Service Request
            </Link>
            <p className={styles.footnote}>
              Best when your objective, area, and required outputs are already
              clear.
            </p>
          </div>
        </section>

        {/* ---------------------- Expert guidance ----------------------- */}
        <section className={styles.card}>
          <span className={styles.iconChip}>
            <AppIcon name="user-group" size={20} />
          </span>
          <h2 className={styles.cardTitle}>Get Expert Guidance</h2>
          <p className={styles.cardKicker}>
            For teams that want help defining the right approach.
          </p>
          <p className={styles.cardBody}>
            Talk to our team if your project is complex, if you are unsure
            which service fits, or if you want specialist input before
            submitting a request.
          </p>
          <ul className={styles.points}>
            {EXPERT_POINTS.map((point) => (
              <li key={point} className={styles.point}>
                {point}
              </li>
            ))}
          </ul>
          <div className={styles.cardFooter}>
            <Link to="/requests/new/expert" className={styles.outlineButton}>
              Talk to Our Team
            </Link>
            <p className={styles.footnote}>
              Best when you want support before starting the formal request.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
