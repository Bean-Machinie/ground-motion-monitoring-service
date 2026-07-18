// Homepage services grid: four full-bleed image cards (offerings) with a
// dark overlay, yellow eyebrow label, and top-aligned text.
import deformationImage from "@/assets/images/offering-deformation.jpg";
import riskImage from "@/assets/images/offering-risk.jpg";
import researchImage from "@/assets/images/offering-research.jpg";
import infrastructureThumb from "@/assets/icons/infrastructure_thumb.webp";
import styles from "./ServiceOverviewSection.module.css";

const OFFERINGS = [
  {
    label: "Analysis",
    image: deformationImage,
    title: "Screening",
    description: "One-time check: is your site moving?",
  },
  {
    label: "Operations",
    image: riskImage,
    title: "Monitoring",
    description:
      "Continuous tracking with change alerts. Recurring, and includes early-warning signals.",
  },
  {
    label: "Science",
    image: researchImage,
    title: "Research & Collaboration",
    description:
      "Bespoke studies and scientific partnerships — our premium custom work.",
  },
  {
    label: "Results",
    image: infrastructureThumb,
    title: "Case Studies",
    description:
      "Real-world projects and outcomes — see how our monitoring performs in the field.",
  },
] as const;

export function ServiceOverviewSection() {
  return (
    <section
      id="services"
      className={styles.section}
      aria-labelledby="services-heading"
    >
      <div className="container">
        <h2 id="services-heading" className={styles.srOnly}>
          Our services
        </h2>
        <div className={styles.grid}>
          {OFFERINGS.map((item) => (
            <article key={item.title} className={styles.card}>
              <img src={item.image} alt="" className={styles.cardImage} />
              <div className={styles.cardOverlay} aria-hidden="true" />
              <div className={styles.cardContent}>
                <span className={styles.cardLabel}>{item.label}</span>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardText}>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
