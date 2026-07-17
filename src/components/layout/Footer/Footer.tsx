// Shared site footer: brand mark, contact details, and social links.
import { site } from "@/config/site";
import { AppIcon } from "@/components/ui/AppIcon/AppIcon";
import logoIcon from "@/assets/logo/Black/HELIOSYN_Icon_Black.png";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brandRow}>
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

        <p className={styles.meta}>
          Contact: <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
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

        <p className={styles.meta}>
          © {new Date().getFullYear()} {site.companyName}
        </p>
      </div>
    </footer>
  );
}
