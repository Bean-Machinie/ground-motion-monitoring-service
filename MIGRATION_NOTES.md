# Migration notes: projects/results → sites/services/reports

`supabase/migrations/004_sites_services_reports.sql` replaces the old
two-table model with one that separates the physical site, the commercial
engagement, and the deliverable. The old tables are **still in the
database** but no longer referenced by the app, so the backfill can be
verified before they are dropped.

## Why

- `projects` conflated the physical site, the commercial engagement, and
  the processing job in one status enum (`draft → active → processing →
  completed → archived`).
- `results` conflated the deliverable with the file format (`report`,
  `dataset`, `map` as sibling types). A GeoTIFF is an artifact attached to
  a deliverable, not a kind of deliverable.

## Old → new mapping

| Old | New |
| --- | --- |
| `projects` row | one `sites` row **plus** one `services` row |
| `projects.customer_id` | `org_id` (see "org scoping" below) |
| `projects.status` in (`active`, `processing`) | `services.kind = 'monitoring'`, `cadence = 'quarterly'` |
| `projects.status` otherwise | `services.kind = 'screening'` |
| `projects.status` (lifecycle) | `draft→draft`, `active/processing→active`, `completed/archived→completed` |
| `projects.monitoring_type` | superseded by `services.technique` (backfilled as `insar_sbas`) |
| `projects.location_label` | superseded by `sites.country` / `centroid` / `geometry` (not backfilled — no structured source) |
| `results` row | one `reports` row |
| `results.title` | `reports.headline` |
| `results.result_type` | dropped; deliverable kind is `screening`/`periodic`/`alert`, file formats live in `report_artifacts.kind` |
| `results.status` | `published→published`, `draft/processing→pending`, `failed→failed`, `archived→superseded` |
| `results.analysis_period_*` | `reports.period_start` / `period_end` |
| (new) | `report_artifacts`, `alerts`, `processing_runs` — start empty; the UI renders honest empty states |

**Id reuse for auditability:** the backfill sets `sites.id = services.id =
old projects.id` and `reports.id = old results.id`, so old→new rows can be
verified with plain joins, e.g.

```sql
select p.name, s.slug site_slug, sv.kind, sv.status
from projects p
join sites s on s.id = p.id
join services sv on sv.id = p.id;

select r.title, rp.headline, rp.state, rp.issue_number
from results r join reports rp on rp.id = r.id;
```

## Org scoping

There is no organizations table yet; ownership remains per customer
profile. `org_id` therefore references `profiles(id)` and every RLS policy
uses `org_id = auth.uid() or is_admin()`, mirroring the old `customer_id`
pattern exactly. The database filters, not the pages. When a real
organizations table lands, only the FK target and policy predicate change.

Policy summary: customers read their org's rows; only admins write. Two
exceptions: `alerts` allows the owning org to update (acknowledgement),
and `processing_runs` is admin-only in every direction (internal pipeline
state, decoupled from customer-facing report state).

## URL changes (redirects are in place)

| Old | New |
| --- | --- |
| `/portal` | `/` |
| `/?tab=monitoring`, `/?tab=overview`, `/portal?tab=…` | `/` |
| `/?tab=reports` | `/reports` |
| `/portal/projects` | `/sites` |
| `/portal/projects/:slug` | `/sites/:slug` (works because backfilled site slugs equal old project slugs) |
| `/portal/requests/new` | `/requests/new` |
| `/portal/account` | `/account` |

`/services/:param` is shared: marketing slugs (`/services/screening`)
render the marketing page; a UUID renders the engagement detail
(`ServiceRoute` dispatches).

## PDF export

~~`supabase/functions/report-pdf`~~ — removed by migration 008 (see below).
There is no automatic PDF generation: the primary attachment is the
deliverable, whatever format it happens to be.

## To drop in a follow-up migration (after backfill verification)

1. Tables `projects`, `results`, `service_orders` (never used by the app).
2. Enums `project_status`, `result_status`, `result_type`, `order_status`,
   `billing_status`.
3. The legacy-table entries in `src/types/database.ts` (marked
   "pending drop") — or simply regenerate via
   `supabase gen types typescript` after the drop.
4. ~~`supabase/seed.sql` still seeds the old tables~~ — done: the seed now
   targets sites/services/reports, removes the old Riverside example, and
   is safe to re-run.

## 005: Service becomes the primary object (site demoted to reference data)

`supabase/migrations/005_service_first.sql` inverts the hierarchy: nobody
buys a location — they buy a monitoring subscription or a screening that
happens to be performed at one.

- `services` gains `name` (customer-supplied display name, required;
  backfilled from the site name), `requested_at`, `requested_by`, and
  `scope_notes`.
- `service_status` is recreated as `scoping → quoted → active → paused →
  completed → cancelled`. `draft` is gone — a service exists from the
  moment a customer asks for it. Existing `draft` rows became `scoping`.
- There is no `requests` table: submitting `/requests/new` inserts a
  `services` row in `scoping` (plus a `sites` row for a new area of
  interest), enabled by the two new customer-insert RLS policies.
- `sites` is unchanged structurally and remains lifecycle-free; the app
  now treats it purely as reference data. `/sites` (list) is gone and
  `/sites/:slug` is reached only from a service page.

## 008: Generic report payload (rigid envelope, flexible payload)

`supabase/migrations/008_generic_report_payload.sql`. The analysis is
still bespoke and changing, so the payload is not locked: what a report
contains is an arbitrary set of files plus a short, manually entered
summary. The envelope (`service_id`, `kind`, `issue_number`,
`period_start`, `period_end`, `state`, `published_at`) stays strict.

- `report_artifacts` → `report_attachments` (`filename`, `label`,
  `mime_type`, `bytes`, `storage_path`, `is_primary`, `sort_order`). Any
  file type; no kind enum. Exactly one primary per report — what
  "Read report →" opens. Files live in the private `reports` bucket under
  `reports/{service_id}/{report_id}/{uuid}-{filename}` and are served
  only through signed URLs expiring in under an hour.
- `reports` gains nullable `headline_metric` and `chart_series` JSONB,
  entered by hand at publish time; `pdf_url`, `cumulative_mm`, and
  `series_mm` are dropped (the old headline figure is carried into
  `headline_metric`). When the pipeline stabilises, automatic derivation
  replaces the manual inputs — the columns and both consuming surfaces
  do not change.
- `processing_runs` stays but nothing depends on it; a report may be
  published with no associated run.
- The `report-pdf` edge function is deleted along with the viewer's
  "Generate PDF" button.
