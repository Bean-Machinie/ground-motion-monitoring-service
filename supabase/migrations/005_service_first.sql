-- 005_service_first.sql
-- Service becomes the primary object; site is demoted to reference data.
--
--   Request  →  Service  →  Report issues
--                        →  Alerts
--   Site, Customer  —  reference records attached to a service
--
-- A submitted request IS a service row in 'scoping' status — there is no
-- separate requests table. Sites keep their physical identity (name,
-- slug, country, centroid, geometry) and no lifecycle of any kind.

-- ---------------------------------------------------------------------------
-- 1. Service identity: the customer's own name for the work, plus the
--    request-time fields.
-- ---------------------------------------------------------------------------

alter table public.services
  add column name text,
  add column requested_at timestamptz,
  add column requested_by uuid references public.profiles (id) on delete set null,
  add column scope_notes text;

-- Backfill: existing services inherit their site's name as a starting
-- display name (it was the de-facto display name before this migration).
update public.services s
set name = st.name
from public.sites st
where st.id = s.site_id
  and s.name is null;

alter table public.services
  alter column name set not null;

-- ---------------------------------------------------------------------------
-- 2. Lifecycle starts at 'scoping'; 'draft' is dropped, 'quoted' added.
--    A service exists from the moment a customer asks for it.
--    (Postgres cannot remove an enum value in place, so the type is
--    recreated.)
-- ---------------------------------------------------------------------------

update public.services set status = 'scoping' where status = 'draft';

alter type public.service_status rename to service_status_old;

create type public.service_status as enum (
  'scoping',
  'quoted',
  'active',
  'paused',
  'completed',
  'cancelled'
);

alter table public.services
  alter column status drop default,
  alter column status type public.service_status
    using status::text::public.service_status,
  alter column status set default 'scoping';

drop type public.service_status_old;

-- ---------------------------------------------------------------------------
-- 3. Customers can now submit requests: inserting a site (their area of
--    interest) and a service row that must start in 'scoping' and be
--    owned by them. Admin-side transitions (scoping → quoted → active)
--    remain admin-only via the existing update policies.
-- ---------------------------------------------------------------------------

create policy "sites_customer_insert"
  on public.sites for insert
  with check (org_id = auth.uid());

create policy "services_customer_request_insert"
  on public.services for insert
  with check (
    org_id = auth.uid()
    and status = 'scoping'
    and requested_by = auth.uid()
  );
