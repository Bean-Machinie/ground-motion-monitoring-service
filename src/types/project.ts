// Project domain types and display labels.
import type { ProjectRow, ProjectStatus } from "@/types/database";

export type Project = ProjectRow;

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Draft",
  active: "Active",
  processing: "Processing",
  completed: "Completed",
  archived: "Archived",
};
