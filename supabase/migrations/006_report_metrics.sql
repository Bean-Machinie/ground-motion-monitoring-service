-- 006_report_metrics.sql
-- Per-issue motion summary, so the Overview can draw honest sparklines
-- and headline figures instead of decorative thumbnails.
--
--   cumulative_mm — cumulative LOS displacement at the end of the issue's
--                   observation window. One point per issue gives the
--                   monitoring chart; a screening's single value is its
--                   "total" headline figure.
--   series_mm     — optional downsampled per-epoch series (JSON array of
--                   numbers) for reports that carry their own curve, e.g.
--                   a screening's multi-year baseline.

alter table public.reports
  add column cumulative_mm double precision,
  add column series_mm jsonb;

comment on column public.reports.cumulative_mm is
  'Cumulative LOS displacement (mm) at period_end; chart point + headline source.';
comment on column public.reports.series_mm is
  'Optional downsampled per-epoch cumulative series (JSON number array).';
