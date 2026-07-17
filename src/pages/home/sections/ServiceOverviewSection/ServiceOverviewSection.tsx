// Homepage section describing what the service provides.
import { Card } from "@/components/ui/Card/Card";
import styles from "./ServiceOverviewSection.module.css";

const OVERVIEW_ITEMS = [
  {
    title: "Ongoing monitoring and reporting",
    description:
      "Receive monitoring updates and analysis results for your projects on a structured, ongoing basis.",
  },
  {
    title: "Secure access to project information",
    description:
      "Results are tied to your account and projects. Only you and your organization can view your project data.",
  },
  {
    title: "Clear presentation of technical findings",
    description:
      "Analysis outputs are delivered as organized, readable records so your team can review findings efficiently.",
  },
] as const;

export function ServiceOverviewSection() {
  return (
    <section className={styles.section} aria-labelledby="overview-heading">
      <div className="container">
        <h2 id="overview-heading">What the service provides</h2>
        <p className={styles.intro}>
          A single place for your organization to access ground-motion
          monitoring results, analysis reports, and project updates.
        </p>
        <div className={styles.grid}>
          {OVERVIEW_ITEMS.map((item) => (
            <Card key={item.title} className={styles.card}>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardText}>{item.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
