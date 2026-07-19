-- 004_sites_services_reports.sql
-- Restructures the data model around HELIOSYN's two product formats.
--
--   sites            — the physical area of interest (stable, no status)
--   services         — a commercial engagement on a site (screening|monitoring)
--   reports          — an immutable delivered issue
--   report_artifacts — files belonging to a report
--   alerts           — detected critical changes on a monitoring service
--   processing_runs  — pipeline execution, decoupled from customer state
--
-- The legacy projects/results tables are left in place but unreferenced so
-- the backfill below can be verified before they are dropped in a follow-up
-- migration (see MIGRATION_NOTES.md).
--
-- Note on org scoping: the current auth model has no organizations table;
-- ownership is per customer profile. org_id therefore references
-- public.profiles (id) and policies use org_id = auth.uid(), mirroring the
-- existing customer_id pattern exactly. When a real organizations table is
-- introduced, only the FK target and the policy predicate change.

-- ---------------------------------------------------------------------------
-- Enumerated types
-- ---------------------------------------------------------------------------

create type public.service_kind as enum ('screening', 'monitoring');

-- Extensible: future non-InSAR techniques are added as new values here
-- without structural change.
create type public.analysis_technique as enum ('insar_sbas', 'insar_ps');

-- Commercial lifecycle only — never processing state.
create type public.service_status as enum (
  'draft',
  'scoping',
  'active',
  'paused',
  'completed',
  'cancelled'
);

create type public.service_cadence as enum ('quarterly');

create type public.report_kind as enum ('screening', 'periodic', 'alert');

create type public.report_state as enum (
  'pending',
  'processing',
  'in_review',
  'published',
  'failed',
  'superseded'
);

create type public.artifact_kind as enum (
  'velocity_map',
  'displacement_timeseries',
  'coherence',
  'netcdf',
  'geotiff',
  'pdf'
);

create type public.alert_severity as enum ('info', 'warning', 'critical');

create type public.run_status as enum (
  'queued',
  'running',
  'succeeded',
  'failed'
);

-- ---------------------------------------------------------------------------
-- sites — the physical area of interest. Stable, long-lived, no status.
-- ---------------------------------------------------------------------------

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null unique,
  country text,
  description text,
  centroid_lat double precision,
  centroid_lon double precision,
  -- GeoJSON geometry (bbox polygon or full AOI geometry).
  geometry jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sites_org_id_idx on public.sites (org_id);

create trigger sites_set_updated_at
  before update on public.sites
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- services — a commercial engagement on a site.
-- ---------------------------------------------------------------------------

create table public.services (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  org_id uuid not null references public.profiles (id) on delete cascade,
  kind public.service_kind not null,
  technique public.analysis_technique not null default 'insar_sbas',
  status public.service_status not null default 'draft',
  started_on date,
  ended_on date,
  cadence public.service_cadence,
  next_issue_due date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Screenings have no cadence and no issue schedule.
  constraint services_cadence_monitoring_only
    check (kind = 'monitoring' or cadence is null),
  constraint services_next_issue_monitoring_only
    check (kind = 'monitoring' or next_issue_due is null)
);

create index services_org_id_idx on public.services (org_id);
create index services_site_id_idx on public.services (site_id);

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- reports — an immutable issue; the deliverable.
-- Once published a report is not edited: corrections create a new report
-- that marks the old one superseded via supersedes_report_id.
-- ---------------------------------------------------------------------------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  org_id uuid not null references public.profiles (id) on delete cascade,
  kind public.report_kind not null,
  -- 1 for screening; monotonic per service for monitoring.
  issue_number integer not null,
  -- The observation window this issue covers.
  period_start date,
  period_end date,
  state public.report_state not null default 'pending',
  published_at timestamptz,
  headline text,
  summary text,
  -- Generated on publish; nullable until then.
  pdf_url text,
  supersedes_report_id uuid references public.reports (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_issue_number_positive check (issue_number >= 1),
  constraint reports_service_issue_unique unique (service_id, issue_number)
);

create index reports_org_id_idx on public.reports (org_id);
create index reports_service_id_idx on public.reports (service_id);
create index reports_published_at_idx on public.reports (published_at desc);

create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- report_artifacts — files belonging to a report.
-- ---------------------------------------------------------------------------

create table public.report_artifacts (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  kind public.artifact_kind not null,
  storage_path text not null,
  bytes bigint,
  checksum text,
  created_at timestamptz not null default now()
);

create index report_artifacts_report_id_idx
  on public.report_artifacts (report_id);

-- ---------------------------------------------------------------------------
-- alerts — a detected critical change on a monitoring service.
-- ---------------------------------------------------------------------------

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  org_id uuid not null references public.profiles (id) on delete cascade,
  detected_at timestamptz not null default now(),
  severity public.alert_severity not null default 'warning',
  summary text,
  triggered_report_id uuid references public.reports (id) on delete set null,
  acknowledged_at timestamptz,
  acknowledged_by uuid references public.profiles (id) on delete set null
);

create index alerts_org_id_idx on public.alerts (org_id);
create index alerts_service_id_idx on public.alerts (service_id);

-- ---------------------------------------------------------------------------
-- processing_runs — pipeline execution, decoupled from customer-facing state.
-- Internal: not exposed to customers at all (admin-only policies below).
-- ---------------------------------------------------------------------------

create table public.processing_runs (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  pipeline_version text,
  params jsonb,
  status public.run_status not null default 'queued',
  started_at timestamptz,
  finished_at timestamptz,
  log_path text,
  error_message text
);

create index processing_runs_report_id_idx
  on public.processing_runs (report_id);

-- ---------------------------------------------------------------------------
-- Row-level security.
-- Same pattern as 002: the database filters, not the pages.
-- Customers read rows owned by their org; only admins write.
-- ---------------------------------------------------------------------------

alter table public.sites enable row level security;

create policy "sites_select_own"
  on public.sites for select
  using (org_id = auth.uid() or public.is_admin());

create policy "sites_admin_insert"
  on public.sites for insert with check (public.is_admin());

create policy "sites_admin_update"
  on public.sites for update
  using (public.is_admin()) with check (public.is_admin());

create policy "sites_admin_delete"
  on public.sites for delete using (public.is_admin());

alter table public.services enable row level security;

create policy "services_select_own"
  on public.services for select
  using (org_id = auth.uid() or public.is_admin());

create policy "services_admin_insert"
  on public.services for insert with check (public.is_admin());

create policy "services_admin_update"
  on public.services for update
  using (public.is_admin()) with check (public.is_admin());

create policy "services_admin_delete"
  on public.services for delete using (public.is_admin());

alter table public.reports enable row level security;

create policy "reports_select_own"
  on public.reports for select
  using (org_id = auth.uid() or public.is_admin());

create policy "reports_admin_insert"
  on public.reports for insert with check (public.is_admin());

create policy "reports_admin_update"
  on public.reports for update
  using (public.is_admin()) with check (public.is_admin());

create policy "reports_admin_delete"
  on public.reports for delete using (public.is_admin());

alter table public.report_artifacts enable row level security;

-- Scoped through the owning report, like results were through projects.
create policy "report_artifacts_select_own_report"
  on public.report_artifacts for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.reports r
      where r.id = report_artifacts.report_id
        and r.org_id = auth.uid()
    )
  );

create policy "report_artifacts_admin_insert"
  on public.report_artifacts for insert with check (public.is_admin());

create policy "report_artifacts_admin_update"
  on public.report_artifacts for update
  using (public.is_admin()) with check (public.is_admin());

create policy "report_artifacts_admin_delete"
  on public.report_artifacts for delete using (public.is_admin());

alter table public.alerts enable row level security;

create policy "alerts_select_own"
  on public.alerts for select
  using (org_id = auth.uid() or public.is_admin());

-- Customers may acknowledge their own alerts; everything else is admin-only.
-- (The row must remain theirs; column-level discipline is enforced by the
-- app writing only acknowledged_at/acknowledged_by.)
create policy "alerts_ack_own"
  on public.alerts for update
  using (org_id = auth.uid() or public.is_admin())
  with check (org_id = auth.uid() or public.is_admin());

create policy "alerts_admin_insert"
  on public.alerts for insert with check (public.is_admin());

create policy "alerts_admin_delete"
  on public.alerts for delete using (public.is_admin());

-- processing_runs: internal — admins only, in every direction.
alter table public.processing_runs enable row level security;

create policy "processing_runs_admin_select"
  on public.processing_runs for select using (public.is_admin());

create policy "processing_runs_admin_insert"
  on public.processing_runs for insert with check (public.is_admin());

create policy "processing_runs_admin_update"
  on public.processing_runs for update
  using (public.is_admin()) with check (public.is_admin());

create policy "processing_runs_admin_delete"
  on public.processing_runs for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Backfill from the legacy model.
--
-- Deliberate id reuse for auditability:
--   site.id = service.id = old project.id      (1 project → 1 site + 1 service)
--   report.id            = old result.id       (1 result  → 1 report)
-- This makes the old → new mapping verifiable with simple joins before the
-- legacy tables are dropped.
-- ---------------------------------------------------------------------------

-- Each project becomes one site…
insert into public.sites
  (id, org_id, name, slug, description, created_at, updated_at)
select
  p.id,
  p.customer_id,
  p.name,
  p.slug,
  p.description,
  p.created_at,
  p.updated_at
from public.projects p;

-- …plus one service on that site.
insert into public.services
  (id, site_id, org_id, kind, technique, status,
   started_on, ended_on, cadence, created_at, updated_at)
select
  p.id,
  p.id,
  p.customer_id,
  case
    when p.status in ('active', 'processing') then 'monitoring'
    else 'screening'
  end::public.service_kind,
  'insar_sbas'::public.analysis_technique,
  case p.status
    when 'draft' then 'draft'
    when 'active' then 'active'
    when 'processing' then 'active'
    when 'completed' then 'completed'
    when 'archived' then 'completed'
  end::public.service_status,
  p.start_date,
  p.end_date,
  case
    when p.status in ('active', 'processing')
      then 'quarterly'::public.service_cadence
    else null
  end,
  p.created_at,
  p.updated_at
from public.projects p;

-- Each result becomes one report under the corresponding service.
insert into public.reports
  (id, service_id, org_id, kind, issue_number, period_start, period_end,
   state, published_at, headline, summary, created_at, updated_at)
select
  r.id,
  r.project_id,
  p.customer_id,
  case
    when s.kind = 'screening' then 'screening'
    else 'periodic'
  end::public.report_kind,
  row_number() over (
    partition by r.project_id
    order by r.created_at, r.id
  )::integer,
  r.analysis_period_start,
  r.analysis_period_end,
  case r.status
    when 'published' then 'published'
    when 'draft' then 'pending'
    when 'processing' then 'pending'
    when 'failed' then 'failed'
    when 'archived' then 'superseded'
  end::public.report_state,
  r.published_at,
  r.title,
  r.summary,
  r.created_at,
  r.updated_at
from public.results r
join public.projects p on p.id = r.project_id
join public.services s on s.id = r.project_id;
