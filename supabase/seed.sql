-- seed.sql (development only)
-- Example data for the sites / services / reports model. The application
-- does not depend on it.
--
-- Prerequisite: create a user via the app's sign-up page (or the Supabase
-- dashboard) first, then set customer_id below to that user's auth ID:
--   select id, email from auth.users;
--
-- Runs in the Supabase SQL Editor (plain SQL, no psql meta-commands).
-- Safe to re-run: it deletes its own example rows (and the old Riverside
-- example) before inserting.
--
-- What this demonstrates:
--   Esbjerg quay expansion — active monitoring: three published quarterly
--                      issues, one off-cycle alert issue, an UNACKNOWLEDGED
--                      critical alert, and attachments on the latest issues.
--   Metro C2 baseline — completed screening whose first report was corrected:
--                      issue 1 is superseded by issue 2 (supersedes_report_id).
--   Grimsel dam      — monitoring where issue 1 FAILED in processing and the
--                      next issue is OVERDUE → both surface under
--                      "Needs attention" on the workspace.
--   Thyborøn coastal — a freshly submitted request: a service in 'scoping'
--                      with no reports yet.

do $$
declare
  customer_id uuid := '89f8ade2-1416-477e-a7c5-bfbd5755c534';  -- <-- your auth user id

  -- Sites (reference records: pure locations, no lifecycle)
  site_esbjerg uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  site_metro   uuid := 'bbbbbbbb-0000-4000-8000-000000000001';
  site_dam     uuid := 'cccccccc-0000-4000-8000-000000000001';
  site_coast   uuid := 'dddddddd-0000-4000-8000-000000000001';

  -- Services (the spine: what the customer asked for and pays for)
  svc_esbjerg uuid := 'aaaaaaaa-0000-4000-8000-000000000002';
  svc_metro   uuid := 'bbbbbbbb-0000-4000-8000-000000000002';
  svc_dam     uuid := 'cccccccc-0000-4000-8000-000000000002';
  svc_coast   uuid := 'dddddddd-0000-4000-8000-000000000002';

  -- Reports
  rpt_esbjerg_1 uuid := 'aaaaaaaa-0000-4000-8000-000000000011';
  rpt_esbjerg_2 uuid := 'aaaaaaaa-0000-4000-8000-000000000012';
  rpt_esbjerg_3 uuid := 'aaaaaaaa-0000-4000-8000-000000000013';
  rpt_esbjerg_4 uuid := 'aaaaaaaa-0000-4000-8000-000000000014';  -- alert issue
  rpt_metro_1   uuid := 'bbbbbbbb-0000-4000-8000-000000000011';  -- superseded
  rpt_metro_2   uuid := 'bbbbbbbb-0000-4000-8000-000000000012';  -- correction
  rpt_dam_1     uuid := 'cccccccc-0000-4000-8000-000000000011';  -- failed
  rpt_dam_2     uuid := 'cccccccc-0000-4000-8000-000000000012';  -- processing
begin
  -- -------------------------------------------------------------------
  -- Cleanup: old Riverside example (legacy tables + its backfilled rows)
  -- and any previous run of this seed. Deletes cascade downward.
  -- -------------------------------------------------------------------
  delete from public.sites
  where slug in (
    'riverside-embankment-monitoring',
    'port-of-esbjerg-quay-expansion',
    'port-of-esbjerg',
    'copenhagen-metro-extension',
    'copenhagen-metro-section-c2',
    'grimsel-reservoir-dam',
    'grimsel-reservoir',
    'thyboron-coast'
  );
  delete from public.projects
  where slug = 'riverside-embankment-monitoring';

  -- Example customer profile details (the row itself is created by the
  -- profile trigger on sign-up; this just fills in the optional fields).
  update public.profiles
  set full_name = 'Example Customer',
      organization_name = 'Example Infrastructure Ltd'
  where id = customer_id;

  -- -------------------------------------------------------------------
  -- Sites: reference records — pure locations, no lifecycle.
  -- -------------------------------------------------------------------
  insert into public.sites
    (id, org_id, name, slug, country, description,
     centroid_lat, centroid_lon, geometry)
  values
    (
      site_esbjerg, customer_id,
      'Port of Esbjerg',
      'port-of-esbjerg',
      'Denmark',
      'Reclaimed quay area and heavy-lift terminal under staged expansion.',
      55.46410, 8.42214,
      '{"type":"Polygon","coordinates":[[[8.410,55.458],[8.435,55.458],[8.435,55.470],[8.410,55.470],[8.410,55.458]]]}'::jsonb
    ),
    (
      site_metro, customer_id,
      'Copenhagen Metro Section C2',
      'copenhagen-metro-section-c2',
      'Denmark',
      'Twin-bore tunnel alignment beneath mixed residential blocks.',
      55.66910, 12.55280,
      '{"type":"Polygon","coordinates":[[[12.540,55.663],[12.566,55.663],[12.566,55.676],[12.540,55.676],[12.540,55.663]]]}'::jsonb
    ),
    (
      site_dam, customer_id,
      'Grimsel Reservoir',
      'grimsel-reservoir',
      'Switzerland',
      'Concrete gravity dam and abutment slopes above the reservoir.',
      46.57180, 8.33320,
      null  -- no AOI polygon captured yet: the location page shows this honestly
    ),
    (
      site_coast, customer_id,
      'Thyborøn Coast',
      'thyboron-coast',
      'Denmark',
      'Harbour town and coastal defence works on the Limfjord inlet.',
      56.69860, 8.21170,
      null
    );

  -- -------------------------------------------------------------------
  -- Services: the spine. `name` is the customer's own name for the work
  -- and the display name everywhere.
  -- -------------------------------------------------------------------
  insert into public.services
    (id, site_id, org_id, name, kind, technique, status,
     requested_at, requested_by, scope_notes,
     started_on, ended_on, cadence, next_issue_due)
  values
    -- Ongoing quarterly monitoring subscription.
    (svc_esbjerg, site_esbjerg, customer_id,
     'Esbjerg quay expansion', 'monitoring', 'insar_sbas', 'active',
     '2025-08-14T09:20:00Z', customer_id,
     'Staged quay expansion on reclaimed ground; settlement is the design risk.',
     '2025-09-01', null, 'quarterly', '2026-09-10'),
    -- One-off screening, delivered and closed.
    (svc_metro, site_metro, customer_id,
     'Metro C2 baseline', 'screening', 'insar_ps', 'completed',
     '2025-12-18T11:05:00Z', customer_id,
     'Pre-construction deformation baseline along the C2 alignment.',
     '2026-01-12', '2026-03-02', null, null),
    -- Monitoring subscription with a failed first issue and an OVERDUE
    -- next issue (due before today) → workspace "Needs attention".
    (svc_dam, site_dam, customer_id,
     'Grimsel dam', 'monitoring', 'insar_sbas', 'active',
     '2025-11-30T15:40:00Z', customer_id,
     'Dam crest and abutment slopes; interest in seasonal reservoir loading.',
     '2026-01-01', null, 'quarterly', '2026-07-01'),
    -- Freshly submitted request: exists from the moment it was asked for.
    (svc_coast, site_coast, customer_id,
     'Thyborøn coastal defence', 'monitoring', 'insar_sbas', 'scoping',
     '2026-07-16T08:12:00Z', customer_id,
     'Coastal defence works and harbour quarter; storm-season movement is the concern.',
     null, null, null, null);

  -- -------------------------------------------------------------------
  -- Reports: immutable issues.
  -- -------------------------------------------------------------------
  insert into public.reports
    (id, service_id, org_id, kind, issue_number, period_start, period_end,
     state, published_at, headline, summary, supersedes_report_id,
     headline_metric, chart_series)
  values
    -- Esbjerg: three quarterly issues plus one off-cycle alert issue.
    -- The hand-entered payload deliberately covers all four combinations:
    -- metric only (issue 1), series only (issue 2), both (issues 3–4),
    -- and neither (the Grimsel reports below).
    (rpt_esbjerg_1, svc_esbjerg, customer_id, 'periodic', 1,
     '2025-09-01', '2025-11-30', 'published', '2025-12-10T09:00:00Z',
     'Q4 2025 — Settlement within design envelope',
     'Average LOS velocities across the reclaimed quay remain below 4 mm/yr. Localized settlement at the eastern caisson matches the consolidation model.',
     null,
     '{"value": -1.2, "unit": "mm total", "tone": "neutral"}'::jsonb,
     null),
    (rpt_esbjerg_2, svc_esbjerg, customer_id, 'periodic', 2,
     '2025-12-01', '2026-02-28', 'published', '2026-03-10T09:00:00Z',
     'Q1 2026 — Stable, minor seasonal signal',
     'Winter observations show a coherent seasonal signal of ±2 mm. No trend change at the terminal apron.',
     null,
     null,
     '[{"t": "2025-12-01", "v": -1.2}, {"t": "2025-12-22", "v": -1.5},
       {"t": "2026-01-12", "v": -1.9}, {"t": "2026-02-02", "v": -1.7},
       {"t": "2026-02-28", "v": -2.1}]'::jsonb),
    (rpt_esbjerg_3, svc_esbjerg, customer_id, 'periodic', 3,
     '2026-03-01', '2026-05-31', 'published', '2026-06-10T09:00:00Z',
     'Q2 2026 — Accelerating subsidence at berth 7',
     'A 120 m section at berth 7 shows acceleration from 3 to 9 mm/yr LOS. Recommended: continue observation at increased attention level.',
     null,
     '{"value": -5.4, "unit": "mm total", "tone": "warning"}'::jsonb,
     '[{"t": "2026-03-01", "v": -2.1}, {"t": "2026-03-22", "v": -2.6},
       {"t": "2026-04-12", "v": -3.2}, {"t": "2026-05-03", "v": -4.1},
       {"t": "2026-05-31", "v": -5.4}]'::jsonb),
    (rpt_esbjerg_4, svc_esbjerg, customer_id, 'alert', 4,
     '2026-06-01', '2026-07-05', 'published', '2026-07-08T14:30:00Z',
     'Alert — Rapid movement at berth 7 crane rail',
     'Off-cycle issue triggered by automatic change detection: 14 mm displacement over five weeks along the berth 7 crane rail. Site inspection advised.',
     null,
     '{"value": -14, "unit": "mm / 5 wks", "tone": "danger"}'::jsonb,
     '[{"t": "2026-06-01", "v": -5.4}, {"t": "2026-06-08", "v": -6.8},
       {"t": "2026-06-15", "v": -8.9}, {"t": "2026-06-22", "v": -11.6},
       {"t": "2026-06-29", "v": -15.2}, {"t": "2026-07-05", "v": -19.4}]'::jsonb),

    -- Metro screening: issue 1 was corrected; issue 2 supersedes it and
    -- carries the downsampled three-year baseline curve.
    (rpt_metro_1, svc_metro, customer_id, 'screening', 1,
     '2023-01-01', '2026-01-31', 'superseded', '2026-02-20T10:00:00Z',
     'Baseline screening — Section C2 (superseded)',
     'Historical PS-InSAR screening over the alignment. Superseded by a corrected issue after a georeferencing fix in block 14.',
     null,
     '{"value": -6.0, "unit": "mm / 3 yrs", "tone": "neutral"}'::jsonb,
     null),
    (rpt_metro_2, svc_metro, customer_id, 'screening', 2,
     '2023-01-01', '2026-01-31', 'published', '2026-03-02T10:00:00Z',
     'Baseline screening — Section C2 (corrected)',
     'Corrected issue: three-year deformation baseline along the tunnel alignment. Two blocks show pre-existing settlement above 5 mm/yr and are flagged for the construction-phase monitoring scope.',
     rpt_metro_1,
     '{"value": -6.2, "unit": "mm / 3 yrs", "tone": "neutral"}'::jsonb,
     '[{"t": "2023-04-30", "v": 0},    {"t": "2023-07-31", "v": -0.4},
       {"t": "2023-10-31", "v": -0.9}, {"t": "2024-01-31", "v": -1.6},
       {"t": "2024-04-30", "v": -2.2}, {"t": "2024-07-31", "v": -2.7},
       {"t": "2024-10-31", "v": -3.4}, {"t": "2025-01-31", "v": -4.1},
       {"t": "2025-04-30", "v": -4.6}, {"t": "2025-07-31", "v": -5.2},
       {"t": "2025-10-31", "v": -5.7}, {"t": "2026-01-31", "v": -6.2}]'::jsonb),

    -- Grimsel: first issue failed in processing; second is under way.
    -- No metric, no series → the card and the viewer must still look
    -- deliberate (graceful-degradation case).
    (rpt_dam_1, svc_dam, customer_id, 'periodic', 1,
     '2026-01-01', '2026-03-31', 'failed', null,
     'Q1 2026 — Processing failed',
     'Coherence over the abutment slopes was insufficient in the winter scenes; the run did not meet quality thresholds.',
     null, null, null),
    (rpt_dam_2, svc_dam, customer_id, 'periodic', 2,
     '2026-04-01', '2026-06-30', 'processing', null,
     null,
     null,
     null, null, null);

  -- -------------------------------------------------------------------
  -- Attachments: any file type, no kind enum. Exactly one primary per
  -- report — the deliverable "Read report →" opens. The metro report's
  -- primary is deliberately a Word document: a headline, a summary, and
  -- one .docx is a complete, valid report.
  -- Paths follow reports/{service_id}/{report_id}/{uuid}-{filename}.
  -- -------------------------------------------------------------------
  insert into public.report_attachments
    (report_id, filename, label, mime_type, bytes, storage_path,
     is_primary, sort_order)
  values
    (rpt_esbjerg_3, 'q2_2026_monitoring_report.pdf', 'Full report',
     'application/pdf', 1834211,
     svc_esbjerg || '/' || rpt_esbjerg_3 || '/'
       || gen_random_uuid() || '-q2_2026_monitoring_report.pdf',
     true, 0),
    (rpt_esbjerg_3, 'los_velocity_2026q2.geotiff', 'Velocity map',
     'image/tiff', 48234511,
     svc_esbjerg || '/' || rpt_esbjerg_3 || '/'
       || gen_random_uuid() || '-los_velocity_2026q2.geotiff',
     false, 1),
    (rpt_esbjerg_3, 'timeseries_berth7.nc', 'Displacement time series',
     'application/x-netcdf', 9822190,
     svc_esbjerg || '/' || rpt_esbjerg_3 || '/'
       || gen_random_uuid() || '-timeseries_berth7.nc',
     false, 2),
    (rpt_esbjerg_4, 'alert_note_berth7.pdf', 'Alert note',
     'application/pdf', 412009,
     svc_esbjerg || '/' || rpt_esbjerg_4 || '/'
       || gen_random_uuid() || '-alert_note_berth7.pdf',
     true, 0),
    (rpt_esbjerg_4, 'alert_displacement_map.geotiff', 'Displacement map',
     'image/tiff', 17332880,
     svc_esbjerg || '/' || rpt_esbjerg_4 || '/'
       || gen_random_uuid() || '-alert_displacement_map.geotiff',
     false, 1),
    (rpt_metro_2, 'baseline_screening_c2.docx', 'Full report',
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
     2381550,
     svc_metro || '/' || rpt_metro_2 || '/'
       || gen_random_uuid() || '-baseline_screening_c2.docx',
     true, 0),
    (rpt_metro_2, 'ps_velocity_c2.geotiff', 'PS velocity map',
     'image/tiff', 60112340,
     svc_metro || '/' || rpt_metro_2 || '/'
       || gen_random_uuid() || '-ps_velocity_c2.geotiff',
     false, 1),
    (rpt_metro_2, 'flagged_blocks_mask.geotiff', 'Flagged blocks mask',
     'image/tiff', 2214009,
     svc_metro || '/' || rpt_metro_2 || '/'
       || gen_random_uuid() || '-flagged_blocks_mask.geotiff',
     false, 2);

  -- -------------------------------------------------------------------
  -- Alerts: one acknowledged historical info alert, one UNACKNOWLEDGED
  -- critical alert that triggered the off-cycle issue.
  -- -------------------------------------------------------------------
  insert into public.alerts
    (service_id, org_id, detected_at, severity, summary,
     triggered_report_id, acknowledged_at, acknowledged_by)
  values
    (svc_esbjerg, customer_id, '2026-02-14T06:10:00Z', 'info',
     'Seasonal signal exceeded soft threshold at the terminal apron; within expected range.',
     null, '2026-02-15T08:00:00Z', customer_id),
    (svc_esbjerg, customer_id, '2026-07-05T05:42:00Z', 'critical',
     'Rapid displacement detected at berth 7 crane rail: 14 mm over five weeks.',
     rpt_esbjerg_4, null, null);

  -- -------------------------------------------------------------------
  -- Processing runs: internal pipeline state (admin-only via RLS).
  -- -------------------------------------------------------------------
  insert into public.processing_runs
    (report_id, pipeline_version, params, status,
     started_at, finished_at, log_path, error_message)
  values
    (rpt_esbjerg_3, 'sbas-2.4.1',
     '{"stack":"S1A_IW_129_DSC","ref_point":[55.4652,8.4189]}'::jsonb,
     'succeeded', '2026-06-08T22:00:00Z', '2026-06-09T03:41:00Z',
     'logs/sbas/' || rpt_esbjerg_3 || '.log', null),
    (rpt_dam_1, 'sbas-2.4.0',
     '{"stack":"S1A_IW_066_ASC","ref_point":[46.5731,8.3318]}'::jsonb,
     'failed', '2026-04-02T22:00:00Z', '2026-04-03T01:12:00Z',
     'logs/sbas/' || rpt_dam_1 || '.log',
     'Mean coherence 0.18 below threshold 0.35 for 61% of interferograms.'),
    (rpt_dam_2, 'sbas-2.4.1',
     '{"stack":"S1A_IW_066_ASC","ref_point":[46.5731,8.3318]}'::jsonb,
     'running', '2026-07-18T22:00:00Z', null,
     'logs/sbas/' || rpt_dam_2 || '.log', null);
end $$;
