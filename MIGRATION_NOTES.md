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

`supabase/functions/report-pdf` is the `POST /reports/:id/pdf` equivalent:
it authorises through the caller's RLS, refuses non-published reports,
and owns the storage-upload + `report_artifacts(kind='pdf')` +
`reports.pdf_url` bookkeeping. The actual renderer is deliberately left
as a marked TODO (returns 501) rather than storing a fake PDF — wire a
server-side renderer in and uncomment the final block. The viewer's
"Generate PDF" button already calls this function and surfaces its
response, and both web view and PDF read the same report row: one source
of truth.

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
