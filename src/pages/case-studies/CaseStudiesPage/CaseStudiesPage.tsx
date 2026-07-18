// Case Studies page (/case-studies): representative project examples.
import { StandardPage } from "@/components/layout/StandardPage/StandardPage";
import constructionThumb from "@/assets/icons/construction_thumb.webp";
import infrastructureThumb from "@/assets/icons/infrastructure_thumb.webp";
import miningThumb from "@/assets/icons/mining_thumb.webp";
import styles from "./CaseStudiesPage.module.css";

const CASE_STUDIES = [
  {
    title: "Rail corridor settlement",
    sector: "Infrastructure",
    image: infrastructureThumb,
    text:
      "Multi-year monitoring of a rail corridor identified localized " +
      "settlement near a culvert crossing, allowing targeted maintenance " +
      "before speed restrictions became necessary.",
  },
  {
    title: "Tailings facility surveillance",
    sector: "Mining",
    image: miningThumb,
    text:
      "Quarterly InSAR updates over a tailings storage facility provided an " +
      "independent line of evidence for dam safety reviews and regulatory " +
      "reporting.",
  },
  {
    title: "Deep excavation in a city centre",
    sector: "Urban & Construction",
    image: constructionThumb,
    text:
      "Screening plus construction-phase monitoring documented that " +
      "neighbouring buildings remained stable during excavation — evidence " +
      "that resolved a third-party claim quickly.",
  },
] as const;

export function CaseStudiesPage() {
  return (
    <StandardPage
      crumbs={[{ label: "Home", to: "/" }, { label: "Case Studies" }]}
      title="Case Studies"
      lede="Real-world projects and outcomes — see how our monitoring performs in the field."
    >
      <div className={styles.grid}>
        {CASE_STUDIES.map((study) => (
          <article key={study.title} className={styles.card}>
            <img src={study.image} alt="" className={styles.cardImage} />
            <div className={styles.cardBody}>
              <span className={styles.cardLabel}>{study.sector}</span>
              <h2 className={styles.cardTitle}>{study.title}</h2>
              <p className={styles.cardText}>{study.text}</p>
            </div>
          </article>
        ))}
      </div>
    </StandardPage>
  );
}
