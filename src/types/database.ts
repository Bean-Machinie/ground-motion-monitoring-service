// Typed database schema for the Supabase client.
// Hand-written to match supabase/migrations; can be replaced by output from
// `supabase gen types typescript` as the schema grows.

export type UserRole = "customer" | "admin";

export type ProjectStatus =
  | "draft"
  | "active"
  | "processing"
  | "completed"
  | "archived";

export type ResultStatus =
  | "draft"
  | "processing"
  | "published"
  | "failed"
  | "archived";

export type ResultType =
  | "monitoring_update"
  | "analysis"
  | "report"
  | "dataset"
  | "map"
  | "time_series"
  | "note";

export type OrderStatus =
  | "requested"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export type BillingStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "refunded"
  | "not_applicable";

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  organization_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type ProjectRow = {
  id: string;
  customer_id: string;
  name: string;
  slug: string;
  description: string | null;
  location_label: string | null;
  monitoring_type: string | null;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export type ResultRow = {
  id: string;
  project_id: string;
  title: string;
  result_type: ResultType;
  status: ResultStatus;
  summary: string | null;
  analysis_period_start: string | null;
  analysis_period_end: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ServiceOrderRow = {
  id: string;
  customer_id: string;
  project_id: string | null;
  service_name: string;
  status: OrderStatus;
  billing_status: BillingStatus;
  external_payment_reference: string | null;
  created_at: string;
  updated_at: string;
}

/** Schema definition consumed by the Supabase client generic. */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & Pick<ProfileRow, "id" | "email">;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      projects: {
        Row: ProjectRow;
        Insert: Partial<ProjectRow> &
          Pick<ProjectRow, "customer_id" | "name" | "slug">;
        Update: Partial<ProjectRow>;
        Relationships: [];
      };
      results: {
        Row: ResultRow;
        Insert: Partial<ResultRow> & Pick<ResultRow, "project_id" | "title">;
        Update: Partial<ResultRow>;
        Relationships: [];
      };
      service_orders: {
        Row: ServiceOrderRow;
        Insert: Partial<ServiceOrderRow> &
          Pick<ServiceOrderRow, "customer_id" | "service_name">;
        Update: Partial<ServiceOrderRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      project_status: ProjectStatus;
      result_status: ResultStatus;
      result_type: ResultType;
      order_status: OrderStatus;
      billing_status: BillingStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
