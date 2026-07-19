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
  draft: "Draft",
  scoping: "Scoping",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const TECHNIQUE_LABELS: Record<AnalysisTechnique, string> = {
  insar_sbas: "InSAR (SBAS)",
  insar_ps: "InSAR (PS)",
};

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
