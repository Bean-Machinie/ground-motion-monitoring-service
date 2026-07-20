-- 008_generic_report_payload.sql
-- Rigid envelope, flexible payload.
--
-- The envelope (service_id, kind, issue_number, period_start, period_end,
-- state, published_at) stays strict — it is what makes monitoring behave
-- like a subscription and screening like a one-off. The payload becomes
-- fully generic: an arbitrary set of attached files plus a short, manually
-- entered summary. No required formats, no filename conventions, no schema
-- validation of report contents.
--
--   report_artifacts  →  report_attachments   (any file type, no kind enum)
--   reports           +  headline_metric      (hand-entered, optional)
--                     +  chart_series         (hand-entered, optional)
--                     −  pdf_url              (no automatic PDF generation;
--                                              the primary attachment is the
--                                              deliverable, whatever it is)
--                     −  cumulative_mm        (the old structured-payload
--                     −  series_mm             columns from 006)
--
-- processing_runs stays as a table for when the pipeline is wired up, but
-- nothing depends on it: a report may be published with no associated run.

-- ---------------------------------------------------------------------------
-- 1. report_attachments — files belonging to a report. Any file type: a
--    PDF, a Word document, a GeoTIFF, a zipped folder of PNGs — all
--    equally valid. No kind enum constraining what an attachment may be.
-- ---------------------------------------------------------------------------

create table public.report_attachments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  -- As uploaded.
  filename text not null,
  -- Admin-supplied display name, e.g. "Full report".
  label text not null,
  mime_type text,
  bytes bigint,
  -- Key within the private "reports" bucket:
  -- {service_id}/{report_id}/{uuid}-{filename}.
  -- Served only through signed URLs expiring in under an hour.
  storage_path text not null,
  -- Exactly one per report: what "Read report →" opens.
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index report_attachments_report_id_idx
  on public.report_attachments (report_id);

-- At most one primary per report; the app ensures exactly one on publish.
create unique index report_attachments_one_primary_per_report
  on public.report_attachments (report_id)
  where is_primary;

-- RLS: scoped through the owning report, exactly like report_artifacts was.
alter table public.report_attachments enable row level security;

create policy "report_attachments_select_own_report"
  on public.report_attachments for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.reports r
      where r.id = report_attachments.report_id
        and r.org_id = auth.uid()
    )
  );

create policy "report_attachments_admin_insert"
  on public.report_attachments for insert with check (public.is_admin());

create policy "report_attachments_admin_update"
  on public.report_attachments for update
  using (public.is_admin()) with check (public.is_admin());

create policy "report_attachments_admin_delete"
  on public.report_attachments for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Backfill from report_artifacts. Filename from the storage path,
--    label from the old kind, mime type guessed from the extension. The
--    first artifact per report (PDF preferred) becomes primary.
-- ---------------------------------------------------------------------------

with ranked as (
  select
    a.*,
    regexp_replace(a.storage_path, '^.*/', '') as fname,
    row_number() over (
      partition by a.report_id
      order by (a.kind <> 'pdf'), a.created_at, a.id
    ) as rn
  from public.report_artifacts a
)
insert into public.report_attachments
  (report_id, filename, label, mime_type, bytes, storage_path,
   is_primary, sort_order, created_at)
select
  r.report_id,
  r.fname,
  case r.kind
    when 'velocity_map' then 'Velocity map'
    when 'displacement_timeseries' then 'Displacement time series'
    when 'coherence' then 'Coherence'
    when 'netcdf' then 'NetCDF dataset'
    when 'geotiff' then 'GeoTIFF'
    when 'pdf' then 'Full report'
  end,
  case
    when r.fname ilike '%.pdf' then 'application/pdf'
    when r.fname ilike '%.tif' or r.fname ilike '%.tiff'
      or r.fname ilike '%.geotiff' then 'image/tiff'
    when r.fname ilike '%.nc' or r.fname ilike '%.netcdf'
      then 'application/x-netcdf'
    else null
  end,
  r.bytes,
  r.storage_path,
  r.rn = 1,
  r.rn - 1,
  r.created_at
from ranked r;

drop table public.report_artifacts;
drop type public.artifact_kind;

-- ---------------------------------------------------------------------------
-- 3. The optional, hand-entered summary numbers. Both exist so the
--    Overview card can show a number and a trend; when the pipeline
--    stabilises, automatic derivation fills them instead — the columns,
--    the card, and the viewer do not change. Only who fills them in does.
-- ---------------------------------------------------------------------------

alter table public.reports
  add column headline_metric jsonb,
  add column chart_series jsonb;

comment on column public.reports.headline_metric is
  'Hand-entered at publish: { "value": -14, "unit": "mm / 5 wks", "tone": "danger" | "warning" | "neutral" }.';
comment on column public.reports.chart_series is
  'Hand-entered at publish: [ { "t": "2025-09-01", "v": -1.2 }, … ] — 5–20 points, any cadence.';

-- Carry the old headline figure over so existing cards do not go blank.
-- Guarded: migration 006 (cumulative_mm / series_mm) may never have been
-- applied to this database, and the column reference must not even parse
-- against a schema that lacks it — hence execute, not a plain update.
-- series_mm carried no dates, so it cannot become a chart_series — dropped.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reports'
      and column_name = 'cumulative_mm'
  ) then
    execute $sql$
      update public.reports
      set headline_metric = jsonb_build_object(
        'value', cumulative_mm,
        'unit', 'mm',
        'tone', 'neutral'
      )
      where cumulative_mm is not null
    $sql$;
  end if;
end $$;

alter table public.reports
  drop column if exists cumulative_mm,
  drop column if exists series_mm,
  drop column if exists pdf_url;
