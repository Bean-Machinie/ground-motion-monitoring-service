-- 001_initial_schema.sql
-- Initial database schema for Ground Motion Monitoring Service:
-- profiles, projects, results, and service_orders.

-- ---------------------------------------------------------------------------
-- Enumerated types
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('customer', 'admin');

create type public.project_status as enum (
  'draft',
  'active',
  'processing',
  'completed',
  'archived'
);

create type public.result_status as enum (
  'draft',
  'processing',
  'published',
  'failed',
  'archived'
);

create type public.result_type as enum (
  'monitoring_update',
  'analysis',
  'report',
  'dataset',
  'map',
  'time_series',
  'note'
);

create type public.order_status as enum (
  'requested',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled'
);

create type public.billing_status as enum (
  'unpaid',
  'pending',
  'paid',
  'refunded',
  'not_applicable'
);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- One row per authenticated user; id references auth.users.
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  organization_name text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- projects
-- A monitoring or analysis engagement belonging to one customer.
-- ---------------------------------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  location_label text,
  monitoring_type text,
  status public.project_status not null default 'draft',
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_customer_id_idx on public.projects (customer_id);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- results
-- A structured analysis output or monitoring record attached to a project.
-- ---------------------------------------------------------------------------

create table public.results (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  result_type public.result_type not null default 'monitoring_update',
  status public.result_status not null default 'draft',
  summary text,
  analysis_period_start date,
  analysis_period_end date,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index results_project_id_idx on public.results (project_id);

create trigger results_set_updated_at
  before update on public.results
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- service_orders
-- A service purchased, requested, or assigned to a customer.
-- Prepares for a future payment-provider integration; no payments yet.
-- ---------------------------------------------------------------------------

create table public.service_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  service_name text not null,
  status public.order_status not null default 'requested',
  billing_status public.billing_status not null default 'not_applicable',
  external_payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index service_orders_customer_id_idx on public.service_orders (customer_id);
create index service_orders_project_id_idx on public.service_orders (project_id);

create trigger service_orders_set_updated_at
  before update on public.service_orders
  for each row execute function public.set_updated_at();
