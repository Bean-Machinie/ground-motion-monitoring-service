// POST /functions/v1/report-pdf  { report_id: string }
//
// Server-side PDF export for a published report. Renders the PDF from the
// same underlying report data as the web view — one source of truth, not a
// parallel document pipeline — stores the output in the `reports` storage
// bucket, records it as a report_artifacts row of kind 'pdf', and writes
// the public URL back to reports.pdf_url.
//
// Invoked from the app via supabase.functions.invoke("report-pdf").
// Deploy with: supabase functions deploy report-pdf
//
// deno-lint-ignore-file no-explicit-any
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const { report_id } = await req.json().catch(() => ({}));
  if (typeof report_id !== "string") {
    return json({ error: "report_id is required" }, 400);
  }

  // User-scoped client: RLS decides whether this caller may see the report.
  const authed = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization") ?? "" },
      },
    },
  );

  const { data: report, error: reportError } = await authed
    .from("reports")
    .select("*")
    .eq("id", report_id)
    .maybeSingle();

  if (reportError) return json({ error: reportError.message }, 500);
  if (!report) return json({ error: "Report not found" }, 404);
  if (report.state !== "published") {
    return json({ error: "Only published reports can be exported" }, 409);
  }
  if (report.pdf_url) {
    return json({ ok: true, pdf_url: report.pdf_url, cached: true });
  }

  // Service-role client for the write side (artifact row + pdf_url), which
  // is admin-only under RLS by design.
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: artifacts } = await admin
    .from("report_artifacts")
    .select("*")
    .eq("report_id", report.id);

  // ------------------------------------------------------------------
  // TODO(pdf-rendering): render `report` + `artifacts` to an actual PDF.
  // The intended implementation renders the same data the ReportViewer
  // component shows (headline, period, summary, maps, time series) via a
  // headless renderer, then uploads the bytes below. Until that renderer
  // is wired up, this endpoint returns 501 rather than storing a file
  // that is not a real PDF.
  // ------------------------------------------------------------------
  void artifacts;
  return json(
    {
      error:
        "PDF rendering is not configured yet. The endpoint, storage, and " +
        "artifact bookkeeping are in place; wire a renderer into " +
        "supabase/functions/report-pdf to enable export.",
    },
    501,
  );

  /* Once a renderer produces `pdfBytes: Uint8Array`:
  const path = `reports/${report.id}/report-issue-${report.issue_number}.pdf`;
  await admin.storage.from("reports").upload(path, pdfBytes, {
    contentType: "application/pdf",
    upsert: true,
  });
  const { data: pub } = admin.storage.from("reports").getPublicUrl(path);
  await admin.from("report_artifacts").insert({
    report_id: report.id,
    kind: "pdf",
    storage_path: path,
    bytes: pdfBytes.byteLength,
  });
  await admin
    .from("reports")
    .update({ pdf_url: pub.publicUrl })
    .eq("id", report.id);
  return json({ ok: true, pdf_url: pub.publicUrl });
  */
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
