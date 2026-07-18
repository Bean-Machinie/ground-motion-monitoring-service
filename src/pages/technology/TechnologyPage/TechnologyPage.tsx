// InSAR Technology page (/technology): how satellite radar interferometry
// measures ground movement.
import { StandardPage } from "@/components/layout/StandardPage/StandardPage";
import insarImage from "@/assets/images/offering-deformation.jpg";
import satelliteImage from "@/assets/images/offering-research.jpg";
import styles from "./TechnologyPage.module.css";

const TOPICS = [
  {
    heading: "Radar from orbit",
    text:
      "Synthetic Aperture Radar (SAR) satellites image the ground day and " +
      "night, in any weather. Each pass records not just an image but the " +
      "precise distance between the satellite and the surface.",
  },
  {
    heading: "Interferometry",
    text:
      "By comparing radar acquisitions over time (InSAR), we measure how " +
      "that distance changes — revealing ground movement at " +
      "millimetre-per-year precision, across entire regions at once.",
  },
  {
    heading: "From fringes to findings",
    text:
      "Raw interferograms are processed into deformation velocity maps and " +
      "time series, then interpreted by our analysts into findings your " +
      "team can act on — no radar expertise required on your side.",
  },
] as const;

export function TechnologyPage() {
  return (
    <StandardPage
      crumbs={[{ label: "Home", to: "/" }, { label: "InSAR Technology" }]}
      title="InSAR Technology"
      lede="Satellite radar interferometry measures ground movement from space with millimetre-scale sensitivity — no equipment on site, and an archive reaching years into the past."
    >
      <div className={styles.imageRow}>
        <figure className={styles.figure}>
          <img
            src={insarImage}
            alt="Interferogram showing ground deformation fringes"
            className={styles.image}
          />
          <figcaption className={styles.caption}>
            Interferometric fringes revealing ground deformation.
          </figcaption>
        </figure>
        <figure className={styles.figure}>
          <img
            src={satelliteImage}
            alt="Radar satellite in orbit"
            className={styles.image}
          />
          <figcaption className={styles.caption}>
            SAR satellites image the ground in any weather, day or night.
          </figcaption>
        </figure>
      </div>

      {TOPICS.map((topic) => (
        <section key={topic.heading} className={styles.block}>
          <h2 className={styles.blockHeading}>{topic.heading}</h2>
          <p className={styles.blockText}>{topic.text}</p>
        </section>
      ))}
    </StandardPage>
  );
}
