// Typed database schema for the Supabase client, in the shape emitted by
// `supabase gen types typescript`. Regenerate with that command as the
// schema evolves; frontend domain types derive from this file (see
// types/domain.ts) rather than being hand-written.
//
// The legacy tables (projects, results, service_orders) are still present
// in the database until the post-backfill cleanup migration drops them, so
// they remain in this schema; the app no longer references them.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          organization_name: string | null;
          role: Database["public"]["Enums"]["user_role"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          organization_name?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          organization_name?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sites: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          slug: string;
          country: string | null;
          description: string | null;
          centroid_lat: number | null;
          centroid_lon: number | null;
          geometry: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          slug: string;
          country?: string | null;
          description?: string | null;
          centroid_lat?: number | null;
          centroid_lon?: number | null;
          geometry?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          slug?: string;
          country?: string | null;
          description?: string | null;
          centroid_lat?: number | null;
          centroid_lon?: number | null;
          geometry?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          site_id: string;
          org_id: string;
          name: string;
          kind: Database["public"]["Enums"]["service_kind"];
          technique: Database["public"]["Enums"]["analysis_technique"];
          status: Database["public"]["Enums"]["service_status"];
          requested_at: string | null;
          requested_by: string | null;
          scope_notes: string | null;
          started_on: string | null;
          ended_on: string | null;
          cadence: Database["public"]["Enums"]["service_cadence"] | null;
          next_issue_due: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          org_id: string;
          name: string;
          kind: Database["public"]["Enums"]["service_kind"];
          technique?: Database["public"]["Enums"]["analysis_technique"];
          status?: Database["public"]["Enums"]["service_status"];
          requested_at?: string | null;
          requested_by?: string | null;
          scope_notes?: string | null;
          started_on?: string | null;
          ended_on?: string | null;
          cadence?: Database["public"]["Enums"]["service_cadence"] | null;
          next_issue_due?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          org_id?: string;
          name?: string;
          kind?: Database["public"]["Enums"]["service_kind"];
          technique?: Database["public"]["Enums"]["analysis_technique"];
          status?: Database["public"]["Enums"]["service_status"];
          requested_at?: string | null;
          requested_by?: string | null;
          scope_notes?: string | null;
          started_on?: string | null;
          ended_on?: string | null;
          cadence?: Database["public"]["Enums"]["service_cadence"] | null;
          next_issue_due?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          service_id: string;
          org_id: string;
          kind: Database["public"]["Enums"]["report_kind"];
          issue_number: number;
          period_start: string | null;
          period_end: string | null;
          state: Database["public"]["Enums"]["report_state"];
          published_at: string | null;
          headline: string | null;
          summary: string | null;
          pdf_url: string | null;
          supersedes_report_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          service_id: string;
          org_id: string;
          kind: Database["public"]["Enums"]["report_kind"];
          issue_number: number;
          period_start?: string | null;
          period_end?: string | null;
          state?: Database["public"]["Enums"]["report_state"];
          published_at?: string | null;
          headline?: string | null;
          summary?: string | null;
          pdf_url?: string | null;
          supersedes_report_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          service_id?: string;
          org_id?: string;
          kind?: Database["public"]["Enums"]["report_kind"];
          issue_number?: number;
          period_start?: string | null;
          period_end?: string | null;
          state?: Database["public"]["Enums"]["report_state"];
          published_at?: string | null;
          headline?: string | null;
          summary?: string | null;
          pdf_url?: string | null;
          supersedes_report_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      report_artifacts: {
        Row: {
          id: string;
          report_id: string;
          kind: Database["public"]["Enums"]["artifact_kind"];
          storage_path: string;
          bytes: number | null;
          checksum: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          kind: Database["public"]["Enums"]["artifact_kind"];
          storage_path: string;
          bytes?: number | null;
          checksum?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          kind?: Database["public"]["Enums"]["artifact_kind"];
          storage_path?: string;
          bytes?: number | null;
          checksum?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      alerts: {
        Row: {
          id: string;
          service_id: string;
          org_id: string;
          detected_at: string;
          severity: Database["public"]["Enums"]["alert_severity"];
          summary: string | null;
          triggered_report_id: string | null;
          acknowledged_at: string | null;
          acknowledged_by: string | null;
        };
        Insert: {
          id?: string;
          service_id: string;
          org_id: string;
          detected_at?: string;
          severity?: Database["public"]["Enums"]["alert_severity"];
          summary?: string | null;
          triggered_report_id?: string | null;
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
        };
        Update: {
          id?: string;
          service_id?: string;
          org_id?: string;
          detected_at?: string;
          severity?: Database["public"]["Enums"]["alert_severity"];
          summary?: string | null;
          triggered_report_id?: string | null;
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
        };
        Relationships: [];
      };
      processing_runs: {
        Row: {
          id: string;
          report_id: string;
          pipeline_version: string | null;
          params: Json | null;
          status: Database["public"]["Enums"]["run_status"];
          started_at: string | null;
          finished_at: string | null;
          log_path: string | null;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          report_id: string;
          pipeline_version?: string | null;
          params?: Json | null;
          status?: Database["public"]["Enums"]["run_status"];
          started_at?: string | null;
          finished_at?: string | null;
          log_path?: string | null;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          report_id?: string;
          pipeline_version?: string | null;
          params?: Json | null;
          status?: Database["public"]["Enums"]["run_status"];
          started_at?: string | null;
          finished_at?: string | null;
          log_path?: string | null;
          error_message?: string | null;
        };
        Relationships: [];
      };
      /* ------------------- legacy tables (pending drop) ------------------ */
      projects: {
        Row: {
          id: string;
          customer_id: string;
          name: string;
          slug: string;
          description: string | null;
          location_label: string | null;
          monitoring_type: string | null;
          status: Database["public"]["Enums"]["project_status"];
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          name: string;
          slug: string;
          description?: string | null;
          location_label?: string | null;
          monitoring_type?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          location_label?: string | null;
          monitoring_type?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      results: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          result_type: Database["public"]["Enums"]["result_type"];
          status: Database["public"]["Enums"]["result_status"];
          summary: string | null;
          analysis_period_start: string | null;
          analysis_period_end: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          result_type?: Database["public"]["Enums"]["result_type"];
          status?: Database["public"]["Enums"]["result_status"];
          summary?: string | null;
          analysis_period_start?: string | null;
          analysis_period_end?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          result_type?: Database["public"]["Enums"]["result_type"];
          status?: Database["public"]["Enums"]["result_status"];
          summary?: string | null;
          analysis_period_start?: string | null;
          analysis_period_end?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      service_orders: {
        Row: {
          id: string;
          customer_id: string;
          project_id: string | null;
          service_name: string;
          status: Database["public"]["Enums"]["order_status"];
          billing_status: Database["public"]["Enums"]["billing_status"];
          external_payment_reference: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          project_id?: string | null;
          service_name: string;
          status?: Database["public"]["Enums"]["order_status"];
          billing_status?: Database["public"]["Enums"]["billing_status"];
          external_payment_reference?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          project_id?: string | null;
          service_name?: string;
          status?: Database["public"]["Enums"]["order_status"];
          billing_status?: Database["public"]["Enums"]["billing_status"];
          external_payment_reference?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: "customer" | "admin";
      service_kind: "screening" | "monitoring";
      analysis_technique: "insar_sbas" | "insar_ps";
      service_status:
        | "scoping"
        | "quoted"
        | "active"
        | "paused"
        | "completed"
        | "cancelled";
      service_cadence: "quarterly";
      report_kind: "screening" | "periodic" | "alert";
      report_state:
        | "pending"
        | "processing"
        | "in_review"
        | "published"
        | "failed"
        | "superseded";
      artifact_kind:
        | "velocity_map"
        | "displacement_timeseries"
        | "coherence"
        | "netcdf"
        | "geotiff"
        | "pdf";
      alert_severity: "info" | "warning" | "critical";
      run_status: "queued" | "running" | "succeeded" | "failed";
      /* Legacy enums (pending drop) */
      project_status:
        | "draft"
        | "active"
        | "processing"
        | "completed"
        | "archived";
      result_status:
        | "draft"
        | "processing"
        | "published"
        | "failed"
        | "archived";
      result_type:
        | "monitoring_update"
        | "analysis"
        | "report"
        | "dataset"
        | "map"
        | "time_series"
        | "note";
      order_status:
        | "requested"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled";
      billing_status:
        | "unpaid"
        | "pending"
        | "paid"
        | "refunded"
        | "not_applicable";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

/** Row type helper, as emitted by supabase gen. */
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

/** Enum type helper, as emitted by supabase gen. */
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

/** Kept for existing imports (types/auth.ts). */
export type ProfileRow = Tables<"profiles">;
export type UserRole = Enums<"user_role">;
