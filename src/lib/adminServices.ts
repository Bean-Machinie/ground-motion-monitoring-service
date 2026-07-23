// Admin-only mutations for services (and the sites they hang off). RLS
// already permits an admin to insert/update/delete these rows; the UI just
// has to send well-formed writes. Every function returns the raw Supabase
// result so callers can surface { error } consistently.
import { supabase } from "@/lib/supabase";
import type {
  AnalysisTechnique,
  Service,
  ServiceCadence,
  ServiceKind,
  ServiceStatus,
  Site,
} from "@/types/domain";

/** A URL-safe, collision-resistant slug from a display name. sites.slug is
    globally unique, so a short random suffix keeps two "Harbour" sites
    apart. */
export function slugify(name: string): string {
  const base =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "site";
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export interface NewSiteInput {
  orgId: string;
  name: string;
  country: string | null;
  lat: number | null;
  lon: number | null;
}

export async function createSite(input: NewSiteInput) {
  return supabase
    .from("sites")
    .insert({
      org_id: input.orgId,
      name: input.name,
      slug: slugify(input.name),
      country: input.country,
      centroid_lat: input.lat,
      centroid_lon: input.lon,
    })
    .select()
    .single();
}

export interface ServiceInput {
  orgId: string;
  siteId: string;
  name: string;
  kind: ServiceKind;
  technique: AnalysisTechnique;
  status: ServiceStatus;
  cadence: ServiceCadence | null;
  nextIssueDue: string | null;
  startedOn: string | null;
  endedOn: string | null;
  scopeNotes: string | null;
}

/** Screenings carry no cadence or issue schedule (a DB check enforces it);
    normalise here so the form never has to remember. */
function scheduleFor(input: ServiceInput): {
  cadence: ServiceCadence | null;
  next_issue_due: string | null;
} {
  if (input.kind !== "monitoring") {
    return { cadence: null, next_issue_due: null };
  }
  return { cadence: input.cadence, next_issue_due: input.nextIssueDue };
}

export async function createService(input: ServiceInput) {
  const schedule = scheduleFor(input);
  return supabase
    .from("services")
    .insert({
      org_id: input.orgId,
      site_id: input.siteId,
      name: input.name,
      kind: input.kind,
      technique: input.technique,
      status: input.status,
      started_on: input.startedOn,
      ended_on: input.endedOn,
      scope_notes: input.scopeNotes,
      ...schedule,
    })
    .select()
    .single();
}

export async function updateService(id: string, input: ServiceInput) {
  const schedule = scheduleFor(input);
  return supabase
    .from("services")
    .update({
      site_id: input.siteId,
      name: input.name,
      kind: input.kind,
      technique: input.technique,
      status: input.status,
      started_on: input.startedOn,
      ended_on: input.endedOn,
      scope_notes: input.scopeNotes,
      ...schedule,
    })
    .eq("id", id)
    .select()
    .single();
}

/** Soft stop: reversible, keeps every report and alert. The everyday
    "remove from active" action. */
export async function cancelService(id: string) {
  return supabase
    .from("services")
    .update({ status: "cancelled" })
    .eq("id", id)
    .select()
    .single();
}

/** Hard delete. The row's FKs cascade to reports, alerts, attachment rows
    and processing runs, but storage objects are NOT cascaded — so gather
    the attachment paths and remove the files first, then drop the row.
    Finally clean up the site if this was its last service: a site is
    reference data with no life of its own, so an emptied one should not
    linger (e.g. on the Map view) with nothing behind it. */
export async function deleteServiceDeep(serviceId: string, siteId: string) {
  const { data: reportRows } = await supabase
    .from("reports")
    .select("id")
    .eq("service_id", serviceId);
  const reportIds = (reportRows ?? []).map((r) => r.id);

  if (reportIds.length > 0) {
    const { data: attachments } = await supabase
      .from("report_attachments")
      .select("storage_path")
      .in("report_id", reportIds);
    const paths = (attachments ?? []).map((a) => a.storage_path);
    if (paths.length > 0) {
      // Best-effort: a storage failure must not block removing the row.
      await supabase.storage.from("reports").remove(paths);
    }
  }

  const result = await supabase.from("services").delete().eq("id", serviceId);
  if (result.error) return result;

  // Orphan-site cleanup. Best-effort — the service is already gone, so a
  // failure here is not fatal; the site just remains until next time.
  const { data: siblings } = await supabase
    .from("services")
    .select("id")
    .eq("site_id", siteId)
    .limit(1);
  if (!siblings || siblings.length === 0) {
    await supabase.from("sites").delete().eq("id", siteId);
  }

  return result;
}

/** Counts used by the delete dialog to state exactly what will be lost. */
export function describeServiceDeletion(
  service: Service,
  reports: { service_id: string }[],
  alerts: { service_id: string }[],
): { reports: number; alerts: number } {
  return {
    reports: reports.filter((r) => r.service_id === service.id).length,
    alerts: alerts.filter((a) => a.service_id === service.id).length,
  };
}

/** Sites belonging to a customer, for the "attach to" picker. */
export function customerSites(sites: Site[], orgId: string): Site[] {
  return sites.filter((s) => s.org_id === orgId);
}
