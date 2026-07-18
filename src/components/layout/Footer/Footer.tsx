// Shared site footer: large brand mark, Services / Platform / Contact
// columns between hairline dividers, and a legal line.
import { Link } from "react-router-dom";
import { site } from "@/config/site";
import logoIcon from "@/assets/logo/Black/HELIOSYN_Icon_Black.png";
import styles from "./Footer.module.css";

const SERVICE_LINKS = [
  { label: "View Services", to: "/services" },
  { label: "Screening", to: "/services/screening" },
  { label: "Monitoring", to: "/services/monitoring" },
  { label: "Research & Collaboration", to: "/services/research-collaboration" },
] as const;

const PLATFORM_LINKS = [
  { label: "Dashboard", to: "/portal" },
  { label: "Projects", to: "/portal/projects" },
  { label: "Account", to: "/portal/account" },
  { label: "Sign in", to: "/sign-in" },
] as const;

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.columns}>
          <div className={styles.brandCol}>
            <img
              src={logoIcon}
              alt={site.companyName}
              className={styles.logo}
            />
          </div>

          <nav aria-label="Services">
            <h3 className={styles.colHeading}>Services</h3>
            <ul className={styles.linkList}>
              {SERVICE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Platform">
            <h3 className={styles.colHeading}>Platform</h3>
            <ul className={styles.linkList}>
              {PLATFORM_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div id="contact">
            <h3 className={styles.colHeading}>Contact</h3>
            <p className={styles.contactLine}>
              Email:{" "}
              <a href={`mailto:${site.contactEmail}`} className={styles.link}>
                {site.contactEmail}
              </a>
            </p>
            <p className={styles.contactLine}>
              Phone:{" "}
              <a
                href={`tel:${site.contactPhone.replace(/\s/g, "")}`}
                className={styles.link}
              >
                {site.contactPhone}
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className={styles.legalBar}>
        <div className="container">
          <p className={styles.legal}>
            © {new Date().getFullYear()} {site.companyName}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
