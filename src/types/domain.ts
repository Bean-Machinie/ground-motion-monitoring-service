// Frontend domain types, derived from the generated Supabase types —
// never hand-written interfaces. Display labels live here too.
import type { Enums, Tables } from "@/types/database";

export type Site = Tables<"sites">;
export type Service = Tables<"services">;
export type Report = Tables<"reports">;
export type ReportArtifact = Tables<"report_artifacts">;
export type Alert = Tables<"alerts">;

export type ServiceKind = Enums<"service_kind">;
export type ServiceStatus = Enums<"service_status">;
export type AnalysisTechnique = Enums<"analysis_technique">;
export type ReportKind = Enums<"report_kind">;
export type ReportState = Enums<"report_state">;
export type ArtifactKind = Enums<"artifact_kind">;
export type AlertSeverity = Enums<"alert_severity">;

export const SERVICE_KIND_LABELS: Record<ServiceKind, string> = {
  screening: "Screening",
  monitoring: "Monitoring",
};

export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  scoping: "Scoping",
  quoted: "Quoted",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const TECHNIQUE_LABELS: Record<AnalysisTechnique, string> = {
  insar_sbas: "InSAR (SBAS)",
  insar_ps: "InSAR (PS)",
};

/** The customer's own name for the work — the display name everywhere.
    Rows created before migration 005 ran may not have one yet, so fall
    back to the location name rather than rendering an empty row. */
export function serviceDisplayName(
  service: Service,
  site: Site | undefined,
): string {
  return service.name || site?.name || SERVICE_KIND_LABELS[service.kind];
}

/** Country display codes for tight card lines ("Port of Esbjerg, DK").
    Unknown countries fall back to their full name. */
const COUNTRY_CODES: Record<string, string> = {
  Denmark: "DK",
  Switzerland: "CH",
  Germany: "DE",
  Norway: "NO",
  Sweden: "SE",
  Netherlands: "NL",
  "United Kingdom": "GB",
  France: "FR",
};

/** "Port of Esbjerg, DK" — the location line on a card. */
export function shortLocation(site: Site | undefined): string {
  if (!site) return "";
  if (!site.country) return site.name;
  return `${site.name}, ${COUNTRY_CODES[site.country] ?? site.country}`;
}

/** The one-line context under a service name, everywhere a service is
    displayed: "{cadence} {kind} · {location}, {country}" — e.g.
    "Quarterly monitoring · Port of Esbjerg, Denmark". Never leads with
    the location, never mentions the technique. */
export function serviceKindLine(
  service: Service,
  site: Site | undefined,
): string {
  const kind =
    service.kind === "monitoring"
      ? service.cadence === "quarterly"
        ? "Quarterly monitoring"
        : "Monitoring"
      : "Screening";
  if (!site) return kind;
  const where = site.country ? `${site.name}, ${site.country}` : site.name;
  return `${kind} · ${where}`;
}

export const REPORT_KIND_LABELS: Record<ReportKind, string> = {
  screening: "Screening report",
  periodic: "Periodic issue",
  alert: "Alert issue",
};

export const REPORT_STATE_LABELS: Record<ReportState, string> = {
  pending: "Pending",
  processing: "Processing",
  in_review: "In review",
  published: "Published",
  failed: "Failed",
  superseded: "Superseded",
};

export const ARTIFACT_KIND_LABELS: Record<ArtifactKind, string> = {
  velocity_map: "Velocity map",
  displacement_timeseries: "Displacement time series",
  coherence: "Coherence",
  netcdf: "NetCDF",
  geotiff: "GeoTIFF",
  pdf: "PDF",
};

export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  info: "Info",
  warning: "Warning",
  critical: "Critical",
};
