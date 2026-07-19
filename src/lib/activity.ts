// The activity feed, derived from existing tables — services by
// requested_at/started_on, reports by published_at, alerts by
// detected_at/acknowledged_at, failures by their update time — rather
// than a separate events table. Customer-meaningful events only: no
// data ingestion, no internal pipeline steps.
import {
  REPORT_KIND_LABELS,
  serviceDisplayName,
  type Alert,
  type Report,
  type Service,
  type Site,
} from "@/types/domain";
import { formatQuarter } from "@/lib/dates";

export type ActivityTone = "danger" | "warning" | "neutral";

export interface ActivityEvent {
  key: string;
  /** ISO date/timestamp, used for sorting and display. */
  date: string;
  text: string;
  /** The object the event describes. */
  to: string;
  tone: ActivityTone;
}

/** Short report reference for feed copy — "Q2 2026 report", never the
    full headline. */
function reportShortTitle(report: Report): string {
  if (report.kind === "periodic") {
    const quarter = formatQuarter(
      report.period_end ?? report.published_at ?? report.created_at,
    );
    if (quarter) return `${quarter} report`;
  }
  return `${REPORT_KIND_LABELS[report.kind]} #${report.issue_number}`;
}

export function buildActivity(
  services: Service[],
  reports: Report[],
  alerts: Alert[],
  siteById: Map<string, Site>,
): ActivityEvent[] {
  const serviceById = new Map(services.map((s) => [s.id, s]));
  const nameOf = (serviceId: string): string => {
    const service = serviceById.get(serviceId);
    return service
      ? serviceDisplayName(service, siteById.get(service.site_id))
      : "—";
  };

  const events: ActivityEvent[] = [];

  for (const service of services) {
    const name = serviceDisplayName(service, siteById.get(service.site_id));
    const to = `/services/${service.id}`;

    if (service.requested_at) {
      events.push({
        key: `req-${service.id}`,
        date: service.requested_at,
        text: `${name} ${service.kind} requested`,
        to,
        tone: "warning",
      });
    }
    if (service.status === "quoted") {
      events.push({
        key: `quote-${service.id}`,
        date: service.updated_at,
        text: `Quote issued for ${name}`,
        to,
        tone: "warning",
      });
    }
    if (service.kind === "monitoring" && service.started_on) {
      events.push({
        key: `start-${service.id}`,
        date: service.started_on,
        text: `Monitoring started at ${name}`,
        to,
        tone: "neutral",
      });
    }
  }

  for (const report of reports) {
    const name = nameOf(report.service_id);

    if (report.state === "published" && report.published_at) {
      if (report.kind === "screening") {
        events.push({
          key: `pub-${report.id}`,
          date: report.published_at,
          text: `${name} screening delivered`,
          to: `/reports/${report.id}`,
          tone: "neutral",
        });
      } else if (report.kind === "periodic") {
        events.push({
          key: `pub-${report.id}`,
          date: report.published_at,
          text: `${reportShortTitle(report)} published for ${name}`,
          to: `/reports/${report.id}`,
          tone: "neutral",
        });
      }
      // Alert-kind issues are carried by their "Alert raised" event.
    }

    if (report.state === "failed") {
      events.push({
        key: `fail-${report.id}`,
        date: report.updated_at,
        text: `Processing failed for ${reportShortTitle(report)}`,
        to: `/reports/${report.id}`,
        tone: "danger",
      });
    }
  }

  for (const alert of alerts) {
    const name = nameOf(alert.service_id);
    const to = `/services/${alert.service_id}`;

    events.push({
      key: `alert-${alert.id}`,
      date: alert.detected_at,
      text: `Alert raised on ${name}${alert.summary ? ` — ${alert.summary}` : ""}`,
      to,
      tone: "danger",
    });
    if (alert.acknowledged_at) {
      events.push({
        key: `ack-${alert.id}`,
        date: alert.acknowledged_at,
        text: `Alert acknowledged on ${name}`,
        to,
        tone: "neutral",
      });
    }
  }

  return events.sort((a, b) => b.date.localeCompare(a.date));
}
