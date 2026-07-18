// Industries page (/industries): where ground movement matters.
import { StandardPage } from "@/components/layout/StandardPage/StandardPage";
import miningThumb from "@/assets/icons/mining_thumb.webp";
import urbanThumb from "@/assets/icons/urban_thumb.webp";
import infrastructureThumb from "@/assets/icons/infrastructure_thumb.webp";
import coastThumb from "@/assets/icons/coast_thumb.webp";
import styles from "./IndustriesPage.module.css";

const INDUSTRIES = [
  {
    name: "Mining",
    image: miningThumb,
    text:
      "Open pits, tailings storage facilities, and surrounding terrain " +
      "deform as operations progress. Monitoring supports safer operations, " +
      "regulatory reporting, and closure planning.",
  },
  {
    name: "Urban & Construction",
    image: urbanThumb,
    text:
      "Excavation, dewatering, and tunnelling can move neighbouring " +
      "buildings. Monitoring provides evidence for planning, protects " +
      "against claims, and confirms long-term stability.",
  },
  {
    name: "Infrastructure",
    image: infrastructureThumb,
    text:
      "Railways, roads, bridges, dams, and pipelines depend on stable " +
      "ground. Early detection of settlement supports maintenance planning " +
      "and reduces disruption.",
  },
  {
    name: "Coastal & Environment",
    image: coastThumb,
    text:
      "Subsidence compounds sea-level rise in coastal zones. Regional " +
      "monitoring informs adaptation planning, flood defence design, and " +
      "environmental assessment.",
  },
] as const;

export function IndustriesPage() {
  return (
    <StandardPage
      crumbs={[{ label: "Home", to: "/" }, { label: "Industries" }]}
      title="Industries"
      lede="Where ground movement matters — sectors where satellite monitoring pays for itself in avoided risk and better decisions."
    >
      <div className={styles.grid}>
        {INDUSTRIES.map((industry) => (
          <article key={industry.name} className={styles.card}>
            <img src={industry.image} alt="" className={styles.cardImage} />
            <div className={styles.cardBody}>
              <h2 className={styles.cardTitle}>{industry.name}</h2>
              <p className={styles.cardText}>{industry.text}</p>
            </div>
          </article>
        ))}
      </div>
    </StandardPage>
  );
}
