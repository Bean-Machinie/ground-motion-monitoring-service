// Service detail page (/services/:slug).
// Services with rich design content (screening, monitoring,
// research-collaboration) render the full HELIOSYN service page: hero,
// what-you-get, a sample-result proof, methodology for technical
// evaluators, and a closing CTA. Any other slug falls back to the generic
// catalogue-driven template so future services still render.
import { Link, useParams } from "react-router-dom";
import { StandardPage } from "@/components/layout/StandardPage/StandardPage";
import { getService } from "@/config/services";
import {
  getServiceDetailContent,
  type ServiceDetailContent,
  type TableRow,
} from "@/pages/services/ServiceDetailPage/serviceDetailContent";
import { NotFoundPage } from "@/pages/not-found/NotFoundPage/NotFoundPage";
import arrowAsset from "@/assets/icons/arrow.svg";
import styles from "./ServiceDetailPage.module.css";

const PROOF_ID = "svc-sample-result";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12h15M13 6l7 6-7 6"
        stroke="#111"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12l5 5L20 6"
        stroke="#111"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Placeholder time-series chart used by the monitoring sample result. */
function MonitoringChart() {
  return (
    <div className={styles.chartCard}>
      <div className={styles.chartTop}>
        <div className={styles.ttl}>
          Pier 7 — vertical displacement{" "}
          <span>· monitored point P-0428</span>
        </div>
        <div className={styles.alertChip}>
          <span className={styles.dot} />
          Change alert · 12 Sep 2025
        </div>
      </div>
      <svg
        className={styles.chartSvg}
        viewBox="0 0 1200 460"
        role="img"
        aria-label="Displacement time-series chart with a change alert firing in September"
      >
        <g stroke="#e7e9eb" strokeWidth="1">
          <line x1="70" y1="80" x2="1130" y2="80" />
          <line x1="70" y1="160" x2="1130" y2="160" />
          <line x1="70" y1="240" x2="1130" y2="240" />
          <line x1="70" y1="320" x2="1130" y2="320" />
          <line x1="70" y1="380" x2="1130" y2="380" />
        </g>
        <g
          fill="#9aa0a6"
          fontFamily="inherit"
          fontSize="13"
          textAnchor="end"
        >
          <text x="58" y="84">+5</text>
          <text x="58" y="164">−3</text>
          <text x="58" y="244">−12</text>
          <text x="58" y="324">−20</text>
          <text x="58" y="384">−26</text>
        </g>
        <text
          x="20"
          y="240"
          fill="#9aa0a6"
          fontFamily="inherit"
          fontSize="12"
          transform="rotate(-90 20 240)"
          textAnchor="middle"
        >
          Displacement (mm)
        </text>
        <line
          x1="70"
          y1="245"
          x2="1130"
          y2="245"
          stroke="#9aa0a6"
          strokeWidth="2"
          strokeDasharray="7 6"
        />
        <text
          x="1124"
          y="237"
          fill="#9aa0a6"
          fontFamily="inherit"
          fontSize="12"
          textAnchor="end"
        >
          Alert threshold −12 mm
        </text>
        <rect x="785" y="80" width="345" height="300" fill="rgba(252,217,0,0.10)" />
        <polyline
          fill="none"
          stroke="#035397"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          points="90,128 183,138 275,128 368,148 461,157 554,177 646,196 739,235 832,283 924,322 1017,351 1110,380"
        />
        <g fill="#035397">
          <circle cx="90" cy="128" r="4" />
          <circle cx="183" cy="138" r="4" />
          <circle cx="275" cy="128" r="4" />
          <circle cx="368" cy="148" r="4" />
          <circle cx="461" cy="157" r="4" />
          <circle cx="554" cy="177" r="4" />
          <circle cx="646" cy="196" r="4" />
          <circle cx="739" cy="235" r="4" />
          <circle cx="924" cy="322" r="4" />
          <circle cx="1017" cy="351" r="4" />
          <circle cx="1110" cy="380" r="4" />
        </g>
        <circle cx="832" cy="283" r="9" fill="#fcd900" stroke="#111" strokeWidth="2" />
        <line
          x1="832"
          y1="283"
          x2="832"
          y2="120"
          stroke="#caa700"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <g transform="translate(832,98)">
          <rect x="-66" y="-18" width="132" height="30" rx="4" fill="#111" />
          <text
            x="0"
            y="2"
            fill="#fcd900"
            fontFamily="inherit"
            fontSize="13"
            fontWeight="700"
            textAnchor="middle"
          >
            ALERT · −16 mm
          </text>
        </g>
        <g fill="#9aa0a6" fontFamily="inherit" fontSize="13" textAnchor="middle">
          <text x="90" y="404">Jan</text>
          <text x="183" y="404">Feb</text>
          <text x="275" y="404">Mar</text>
          <text x="368" y="404">Apr</text>
          <text x="461" y="404">May</text>
          <text x="554" y="404">Jun</text>
          <text x="646" y="404">Jul</text>
          <text x="739" y="404">Aug</text>
          <text x="832" y="404">Sep</text>
          <text x="924" y="404">Oct</text>
          <text x="1017" y="404">Nov</text>
          <text x="1110" y="404">Dec</text>
        </g>
      </svg>
      <div className={styles.chartLegend}>
        <span className={styles.lDisp}>
          <i />
          Measured displacement
        </span>
        <span className={styles.lThr}>
          <i />
          Alert threshold
        </span>
        <span className={styles.lAl}>
          <i />
          Change alert fired
        </span>
      </div>
    </div>
  );
}

function ValidationTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: TableRow[];
}) {
  return (
    <table className={styles.vtable}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <th>{row.label}</th>
            {row.values.length === 1 ? (
              <td colSpan={2}>{row.values[0]}</td>
            ) : (
              row.values.map((value, index) => (
                <td key={`${row.label}-${index}`}>{value}</td>
              ))
            )}
            <td className={styles.agree}>{row.agree}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RichServicePage({ content }: { content: ServiceDetailContent }) {
  const { hero, whatYouGet, aside, proof, methodology, endCTA } = content;

  const scrollToProof = () => {
    document
      .getElementById(PROOF_ID)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={styles.page}>
      {/* HERO */}
      <section className={styles.svcHero}>
        <img className={styles.photo} src={hero.image} alt={hero.imageAlt} />
        <div className={styles.ov} />
        <div className={styles.svcHeroInner}>
          <nav className={styles.crumb} aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className={styles.sep}>/</span>
            <Link to="/services">Services</Link>
            <span className={styles.sep}>/</span>
            <b>{hero.crumbLabel}</b>
          </nav>
          <span className={styles.heroKicker}>{hero.kicker}</span>
          <h1 className={styles.heroTitle}>{hero.title}</h1>
          <p className={styles.lede}>{hero.lede}</p>
          <div className={styles.heroActions}>
            <Link className={styles.cta} to="/sign-up">
              {hero.primaryLabel}
              <span className={styles.arrow}>
                <ArrowIcon />
              </span>
            </Link>
            <button
              type="button"
              className={`${styles.cta} ${styles.ctaGhostDark}`}
              onClick={scrollToProof}
            >
              {hero.sampleLabel}
            </button>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className={styles.svcSection}>
        <div className={styles.getGrid}>
          <div>
            <p className={`${styles.eyebrow} ${styles.eyebrowGold}`}>
              What you get
            </p>
            <h2 className={styles.blockHead}>{whatYouGet.heading}</h2>
            <p className={styles.lead}>{whatYouGet.lead}</p>
            <ul className={styles.deliver}>
              {whatYouGet.deliverables.map((item) => (
                <li key={item.title}>
                  <span className={styles.ck}>
                    <CheckIcon />
                  </span>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <aside className={styles.aside}>
            <h3>Who it's for</h3>
            <ul>
              {aside.whoFor.map((who) => (
                <li key={who}>{who}</li>
              ))}
            </ul>
            <div className={styles.metaRow}>
              {aside.meta.map((meta) => (
                <div key={meta.k}>
                  <span className={styles.k}>{meta.k}</span>
                  <span className={styles.v}>{meta.v}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* PROOF / SAMPLE RESULT */}
      <section
        id={PROOF_ID}
        className={`${styles.svcSection} ${styles.svcSectionTint}`}
      >
        <p className={`${styles.eyebrow} ${styles.eyebrowGold}`}>
          {proof.eyebrow}
        </p>
        <h2 className={styles.blockHead} style={{ maxWidth: "24ch" }}>
          {proof.heading}
        </h2>
        <figure className={styles.proofFig}>
          {proof.kind === "image" ? (
            <>
              <div className={styles.proofImgWrap}>
                <img src={proof.image} alt={proof.imageAlt} />
                <span className={styles.tagPill}>{proof.tagPill}</span>
              </div>
              <div className={styles.legend} aria-hidden="true">
                <span className={styles.cap}>{proof.legend.cap}</span>
                <div>
                  <div className={styles.bar} />
                  <div className={styles.ends}>
                    <span>{proof.legend.left}</span>
                    <span>{proof.legend.mid}</span>
                    <span>{proof.legend.right}</span>
                  </div>
                </div>
              </div>
            </>
          ) : proof.kind === "chart" ? (
            <MonitoringChart />
          ) : (
            <div className={styles.studyFrame}>
              <div className={styles.ph}>
                <div className={styles.phInner}>
                  <b>{proof.phTitle}</b>
                  <span>{proof.phText}</span>
                </div>
              </div>
              <span className={styles.tagPill}>{proof.tagPill}</span>
            </div>
          )}
          <figcaption className={styles.proofCap}>
            <b>{proof.captionLead}</b> {proof.caption}
          </figcaption>
        </figure>
      </section>

      {/* METHODOLOGY */}
      <section className={`${styles.svcSection} ${styles.svcSectionInk}`}>
        <span className={styles.evalTag}>For the technical evaluator</span>
        <h2 className={styles.blockHead} style={{ maxWidth: "24ch" }}>
          {methodology.heading}
        </h2>
        <p className={styles.methodIntro}>{methodology.intro}</p>

        <div className={styles.statRow}>
          {methodology.stats.map((stat) => (
            <div key={stat.lbl} className={styles.stat}>
              <div className={styles.num}>{stat.num}</div>
              <div className={styles.lbl}>{stat.lbl}</div>
            </div>
          ))}
        </div>

        <h3 className={styles.methodSubHead}>{methodology.chainHeading}</h3>
        <div className={styles.chain}>
          {methodology.chain.map((step) => (
            <div key={step.n} className={styles.step}>
              <div className={styles.n}>{step.n}</div>
              <h5>{step.title}</h5>
              <p>{step.text}</p>
            </div>
          ))}
        </div>

        <h3 className={styles.methodSubHead}>{methodology.tableHeading}</h3>
        <p className={styles.tableCaption}>{methodology.tableCaption}</p>
        <ValidationTable
          columns={methodology.tableColumns}
          rows={methodology.tableRows}
        />

        <h3 className={styles.methodSubHead}>{methodology.refsHeading}</h3>
        <ol className={styles.refs}>
          {methodology.refs.map((ref) => (
            <li key={ref.authors + ref.title}>
              <b>{ref.authors}</b> {ref.title} <i>{ref.source}</i>,{" "}
              {ref.detail}
            </li>
          ))}
        </ol>
      </section>

      {/* END CTA */}
      <section className={styles.endCTA}>
        <div className={styles.endInner}>
          <div>
            <h2 className={styles.endHead}>{endCTA.heading}</h2>
            <p className={styles.endText}>{endCTA.text}</p>
          </div>
          <div className={styles.endActions}>
            {endCTA.price ? (
              <div className={styles.priceTag}>
                <span className={styles.from}>{endCTA.price.from}</span>
                <span className={styles.amt}>{endCTA.price.amt}</span>
                <span className={styles.unit}>{endCTA.price.unit}</span>
              </div>
            ) : null}
            <Link className={styles.cta} to="/sign-up">
              {endCTA.primaryLabel}
              <span className={styles.arrow}>
                <ArrowIcon />
              </span>
            </Link>
            <Link
              className={`${styles.cta} ${styles.ctaGhostDark}`}
              to="/#contact"
            >
              {endCTA.secondaryLabel}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const content = slug ? getServiceDetailContent(slug) : undefined;

  if (content) {
    return <RichServicePage content={content} />;
  }

  // Fallback: generic catalogue-driven template for any service that does
  // not yet have rich detail content.
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
      <div className={styles.fallbackLayout}>
        <div className={styles.fallbackBody}>
          {service.sections.map((section) => (
            <section key={section.heading} className={styles.fallbackBlock}>
              <h2 className={styles.fallbackBlockHeading}>{section.heading}</h2>
              <p className={styles.fallbackBlockText}>{section.text}</p>
            </section>
          ))}
          <Link to="/sign-up" className={styles.fallbackCta}>
            <span>Start a Ground Motion Request</span>
            <img src={arrowAsset} alt="" aria-hidden="true" />
          </Link>
        </div>
        <div className={styles.fallbackImageWrap}>
          <img
            src={service.image}
            alt={`${service.name} illustration`}
            className={styles.fallbackImage}
          />
        </div>
      </div>
    </StandardPage>
  );
}
