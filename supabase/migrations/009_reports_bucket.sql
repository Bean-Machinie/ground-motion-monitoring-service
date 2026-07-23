-- 009_reports_bucket.sql
-- Private storage bucket for report attachments.
--
-- Object keys follow {service_id}/{report_id}/{uuid}-{filename} (the
-- bucket name itself provides the "reports/" prefix). Files are served
-- only through signed URLs expiring in under an hour; nothing here is
-- public.

insert into storage.buckets (id, name, public)
values ('reports', 'reports', false)
on conflict (id) do nothing;

-- Admins read and write everything in the bucket (the publish flow
-- uploads from the browser with the admin's own session).
create policy "reports_bucket_admin_all"
  on storage.objects for all
  using (bucket_id = 'reports' and public.is_admin())
  with check (bucket_id = 'reports' and public.is_admin());

-- Customers read files under their own services: the first path segment
-- is the service id, and the service row carries the org. Signed-URL
-- creation authorises through this select policy.
--
-- objects.name must be qualified: inside the exists subquery an
-- unqualified `name` binds to services.name, silently breaking the
-- policy (it would parse the service's display name as a path).
create policy "reports_bucket_customer_read"
  on storage.objects for select
  using (
    bucket_id = 'reports'
    and exists (
      select 1
      from public.services s
      where s.id::text = (storage.foldername(objects.name))[1]
        and s.org_id = auth.uid()
    )
  );
