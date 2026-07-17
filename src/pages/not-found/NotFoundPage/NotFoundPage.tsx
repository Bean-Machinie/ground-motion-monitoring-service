// 404 page for unmatched routes.
import { Button } from "@/components/ui/Button/Button";
import styles from "./NotFoundPage.module.css";

export function NotFoundPage() {
  return (
    <div className={`container ${styles.page}`}>
      <p className={styles.code}>404</p>
      <h1>Page not found</h1>
      <p className={styles.text}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Button to="/">Back to homepage</Button>
    </div>
  );
}
