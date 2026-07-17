// Result domain types and display labels.
import type { ResultRow, ResultStatus, ResultType } from "@/types/database";

export type AnalysisResult = ResultRow;

export const RESULT_STATUS_LABELS: Record<ResultStatus, string> = {
  draft: "Draft",
  processing: "Processing",
  published: "Published",
  failed: "Failed",
  archived: "Archived",
};

export const RESULT_TYPE_LABELS: Record<ResultType, string> = {
  monitoring_update: "Monitoring update",
  analysis: "Analysis",
  report: "Report",
  dataset: "Dataset",
  map: "Map",
  time_series: "Time series",
  note: "Analyst note",
};
