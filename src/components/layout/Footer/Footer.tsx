// Shared site footer: brand column, platform links, contact block, legal line.
import { Link } from "react-router-dom";
import { site } from "@/config/site";
import { AppIcon } from "@/components/ui/AppIcon/AppIcon";
import logoIcon from "@/assets/logo/Black/HELIOSYN_Icon_Black.png";
import styles from "./Footer.module.css";

const PLATFORM_LINKS = [
  { label: "Home", to: "/" },
  { label: "Sign in", to: "/sign-in" },
  { label: "Create an account", to: "/sign-up" },
  { label: "Customer portal", to: "/portal" },
] as const;

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.columns}>
          <div className={styles.brandCol}>
            <img
              src={logoIcon}
              alt=""
              className={styles.logo}
              aria-hidden="true"
            />
            <div>
              <p className={styles.name}>{site.companyName}</p>
              <p className={styles.meta}>{site.name}</p>
            </div>
          </div>

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

          <div>
            <h3 className={styles.colHeading}>Contact</h3>
            <p className={styles.meta}>
              <a href={`mailto:${site.contactEmail}`} className={styles.link}>
                {site.contactEmail}
              </a>
            </p>
            <div className={styles.socials}>
              <a
                href={site.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${site.companyName} on LinkedIn`}
                className={styles.socialLink}
              >
                <AppIcon name="linkedin" size={20} />
              </a>
              <a
                href={site.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${site.companyName} on Instagram`}
                className={styles.socialLink}
              >
                <AppIcon name="instagram" size={20} />
              </a>
            </div>
          </div>
        </div>

        <p className={styles.legal}>
          © {new Date().getFullYear()} {site.companyName}. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
