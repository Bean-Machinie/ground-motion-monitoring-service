// Vertical timeline rail: a 1px guide line down the left with a 7px dot
// per entry — danger for alerts and failures, amber for requests and
// overdue events, neutral otherwise. Two lines per entry: event text,
// then the date. Shared by the Overview (capped) and /activity (full).
import { Link } from "react-router-dom";
import { useScopedHref } from "@/context/ScopeContext";
import type { ActivityEvent } from "@/lib/activity";
import { formatShortDate } from "@/lib/dates";
import styles from "./ActivityFeed.module.css";

/** "14 Jul", with the year added once the event is from another year. */
function feedDate(iso: string): string {
  const year = new Date(iso).getFullYear();
  const short = formatShortDate(iso);
  return year === new Date().getFullYear() ? short : `${short} ${year}`;
}

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  const href = useScopedHref();
  if (events.length === 0) return null;

  return (
    <ol className={styles.feed}>
      {events.map((event) => (
        <li key={event.key} className={styles.entry}>
          <span
            className={`${styles.dot} ${styles[`dot_${event.tone}`]}`}
            aria-hidden="true"
          />
          <Link to={href(event.to)} className={styles.entryLink}>
            <span className={styles.text}>{event.text}</span>
            <span className={styles.date}>{feedDate(event.date)}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
