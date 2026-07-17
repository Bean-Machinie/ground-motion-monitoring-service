-- seed.sql (development only)
-- Example data for local development. The application does not depend on it.
--
-- Prerequisite: create a user via the app's sign-up page (or the Supabase
-- dashboard) first, then set customer_id below to that user's auth ID:
--   select id, email from auth.users;
--
-- Runs in the Supabase SQL Editor (plain SQL, no psql meta-commands).

do $$
declare
  customer_id uuid := '89f8ade2-1416-477e-a7c5-bfbd5755c534';  -- <-- your auth user id
  project_id uuid := '11111111-1111-1111-1111-111111111111';
begin
  -- Example customer profile details (the row itself is created by the
  -- profile trigger on sign-up; this just fills in the optional fields).
  update public.profiles
  set full_name = 'Example Customer',
      organization_name = 'Example Infrastructure Ltd'
  where id = customer_id;

  -- One example project.
  insert into public.projects
    (id, customer_id, name, slug, description, location_label, monitoring_type, status, start_date)
  values
    (
      project_id,
      customer_id,
      'Riverside Embankment Monitoring',
      'riverside-embankment-monitoring',
      'Ongoing ground-motion monitoring of the riverside embankment corridor.',
      'Riverside District',
      'InSAR monitoring',
      'active',
      '2026-01-15'
    );

  -- Two example results.
  insert into public.results
    (project_id, title, result_type, status, summary,
     analysis_period_start, analysis_period_end, published_at)
  values
    (
      project_id,
      'Q1 Monitoring Update',
      'monitoring_update',
      'published',
      'Quarterly monitoring update covering January to March.',
      '2026-01-01',
      '2026-03-31',
      '2026-04-10T09:00:00Z'
    ),
    (
      project_id,
      'Baseline Analysis Report',
      'report',
      'published',
      'Initial baseline analysis establishing reference measurements.',
      '2026-01-01',
      '2026-02-28',
      '2026-03-05T09:00:00Z'
    );

  -- One example service order.
  insert into public.service_orders
    (customer_id, project_id, service_name, status, billing_status)
  values
    (
    