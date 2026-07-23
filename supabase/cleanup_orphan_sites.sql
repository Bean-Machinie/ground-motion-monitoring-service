-- One-time cleanup: remove sites that have no services behind them.
-- These are orphans left over from deleting services before the app began
-- cleaning up empty sites automatically. Run once in the Supabase SQL
-- editor (it runs as the service role, bypassing RLS).
--
-- Safe and idempotent: a site with no service is reference data pointing at
-- nothing, so it can never be reached in the customer or admin UI.
--
-- To scope this to a single customer, uncomment the org_id line and paste
-- that customer's profile id.

delete from public.sites s
where not exists (
  select 1 from public.services sv where sv.site_id = s.id
);
--  and s.org_id = 'PASTE-CUSTOMER-UUID-HERE';

-- Verify afterwards — this should return no rows:
--   select s.id, s.name, s.org_id
--   from public.sites s
--   where not exists (select 1 from public.services sv where sv.site_id = s.id);
