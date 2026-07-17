// Homepage section explaining the three-step service process.
import styles from "./ProcessSection.module.css";

const STEPS = [
  {
    title: "Request a service",
    description:
      "Get in touch to set up a monitoring or analysis engagement for your site or project.",
  },
  {
    title: "We monitor and analyze",
    description:
      "Our team produces ground-motion monitoring updates and analysis results for your project.",
  },
  {
    title: "Review your results",
    description:
      "Sign in to the portal to review results and updates associated with your account.",
  },
] as const;

export function ProcessSection() {
  return (
    <section className={styles.section} aria-labelledby="process-heading">
      <div className="container">
        <h2 id="process-heading">How it works</h2>
        <ol className={styles.steps}>
          {STEPS.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.stepNumber} aria-hidden="true">
                {index + 1}
              </span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepText}>{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
