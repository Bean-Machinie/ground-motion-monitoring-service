// Admin publish flow — the five steps from the publishing spec, over the
// generic payload:
//
//   1. Pick the target: service, then new issue or existing draft.
//   2. Upload attachments: any files, a label each, exactly one primary.
//      No validation beyond file size and an executable rejection list.
//   3. Write the summary: headline + summary (required), headline_metric
//      and chart_series (optional, hand-entered; CSV or JSON pasted into
//      a textarea, parsed on blur with a live sparkline preview).
//   4. Preview: rendered with the production report viewer.
//   5. Publish: stamp published_at. (Notification email and audit row
//      belong to systems that do not exist yet — marked below.)
//
// The flow is customer-first: pick the customer, then one of the
// services they have created, then the issue.
//
// The envelope stays strict; the payload is whatever was uploaded.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import { usePortalData } from "@/context/PortalDataContext";
import { useScope, useScopedHref } from "@/context/ScopeContext";
import { Button } from "@/components/ui/Button/Button";
import { Select } from "@/components/ui/Select/Select";
import { Sparkline } from "@/components/ui/Sparkline/Sparkline";
import { ReportViewer } from "@/components/reports/ReportViewer/ReportViewer";
import {
  REPORT_KIND_LABELS,
  serviceDisplayName,
  type ChartPoint,
  type Report,
  type ReportAttachment,
  type ReportKind,
} from "@/types/domain";
import { formatShortDate } from "@/lib/dates";
import styles from "./PublishReportPage.module.css";

const BUCKET = "reports";

/** The only upload validation: a size cap and a rejection list for
    executables. Everything else — PDF, Word, GeoTIFF, zipped PNGs — is
    equally valid. */
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;
const REJECTED_EXTENSIONS = new Set([
  "exe", "msi", "bat", "cmd", "com", "scr", "ps1", "sh", "dll", "jar",
  "vbs", "app",
]);

const STEPS = ["Target", "Attachments", "Summary", "Preview", "Publish"];

type MetricTone = "neutral" | "warning" | "danger";

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot + 1).toLowerCase();
}

/** Pasted CSV ("2025-09-01,-1.2" per line) or a JSON array of
    { t, v } objects. Returns points or an error message. */
function parseSeries(
  text: string,
): { points: ChartPoint[] } | { error: string } {
  const trimmed = text.trim();
  if (!trimmed) return { points: [] };

  if (trimmed.startsWith("[")) {
    try {
      const raw: unknown = JSON.parse(trimmed);
      if (!Array.isArray(raw)) return { error: "Expected a JSON array." };
      const points: ChartPoint[] = [];
      for (const item of raw) {
        const t = (item as Record<string, unknown>)?.t;
        const v = (item as Record<string, unknown>)?.v;
        if (typeof t !== "string" || typeof v !== "number") {
          return { error: 'Each entry needs { "t": "date", "v": number }.' };
        }
        points.push({ t, v });
      }
      return { points };
    } catch {
      return { error: "Not valid JSON." };
    }
  }

  const points: ChartPoint[] = [];
  for (const line of trimmed.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const [t, v] = line.split(/[,;\t]/).map((s) => s.trim());
    const value = Number(v);
    if (!t || v === undefined || Number.isNaN(value)) {
      return { error: `Could not read "${line}" as date,value.` };
    }
    points.push({ t, v: value });
  }
  return { points };
}

export function PublishReportPage() {
  const {
    services,
    reports,
    siteById,
    refetch,
  } = usePortalData();
  const { customerId } = useScope();
  const href = useScopedHref();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /* Step 1 — the customer is fixed by the scoped route; pick one of
     their services (optionally preselected via ?service=). */
  const [serviceId, setServiceId] = useState("");

  useEffect(() => {
    const preset = searchParams.get("service");
    if (preset) setServiceId(preset);
  }, [searchParams]);
  const [target, setTarget] = useState<"new" | string>("new"); // draft id
  const [newKind, setNewKind] = useState<ReportKind>("periodic");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  /** The draft being worked on, once step 1 completes. */
  const [report, setReport] = useState<Report | null>(null);
  const [attachments, setAttachments] = useState<ReportAttachment[]>([]);

  /* Step 3 — summary. */
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [metricValue, setMetricValue] = useState("");
  const [metricUnit, setMetricUnit] = useState("");
  const [metricTone, setMetricTone] = useState<MetricTone>("neutral");
  const [seriesText, setSeriesText] = useState("");
  const [seriesPoints, setSeriesPoints] = useState<ChartPoint[]>([]);
  const [seriesError, setSeriesError] = useState<string | null>(null);

  const [published, setPublished] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const service = services.find((s) => s.id === serviceId);
  const site = service ? siteById.get(service.site_id) : undefined;
  const serviceReports = useMemo(
    () => reports.filter((r) => r.service_id === serviceId),
    [reports, serviceId],
  );
  const drafts = serviceReports.filter(
    (r) => r.state === "pending" || r.state === "in_review",
  );

  /** Only the services the chosen customer has created. */
  const customerServices = services.filter(
    (s) => s.org_id === customerId && s.status !== "cancelled",
  );
  const serviceOptions = [
    {
      value: "",
      label:
        customerServices.length > 0
          ? "Choose a service…"
          : "This customer has no services",
    },
    ...customerServices.map((s) => ({
      value: s.id,
      label: `${serviceDisplayName(s, siteById.get(s.site_id))} — ${
        s.kind === "monitoring" ? "monitoring" : "screening"
      }`,
    })),
  ];

  /* ------------------------------ Step 1 ------------------------------ */

  async function completeTarget() {
    if (!service) return;
    setBusy(true);
    setError(null);
    try {
      if (target !== "new") {
        const draft = drafts.find((r) => r.id === target);
        if (!draft) throw new Error("Draft not found.");
        setReport(draft);
        setHeadline(draft.headline ?? "");
        setSummary(draft.summary ?? "");
        const { data } = await supabase
          .from("report_attachments")
          .select("*")
          .eq("report_id", draft.id)
          .order("is_primary", { ascending: false })
          .order("sort_order");
        setAttachments(data ?? []);
      } else {
        const nextIssue =
          serviceReports.reduce((m, r) => Math.max(m, r.issue_number), 0) + 1;
        const kind: ReportKind =
          service.kind === "screening" ? "screening" : newKind;
        const { data, error: insertError } = await supabase
          .from("reports")
          .insert({
            service_id: service.id,
            org_id: service.org_id,
            kind,
            issue_number: nextIssue,
            period_start: periodStart || null,
            period_end: periodEnd || null,
            state: "pending",
          })
          .select()
          .single();
        if (insertError) throw insertError;
        setReport(data);
        setAttachments([]);
      }
      setStep(1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  /* ------------------------------ Step 2 ------------------------------ */

  async function addFiles(files: FileList | File[]) {
    if (!report || !service) return;
    setError(null);
    for (const file of Array.from(files)) {
      const ext = extensionOf(file.name);
      if (REJECTED_EXTENSIONS.has(ext)) {
        setError(`"${file.name}" is an executable file type — not accepted.`);
        continue;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        setError(`"${file.name}" is larger than 200 MB.`);
        continue;
      }
      setBusy(true);
      try {
        const key = `${service.id}/${report.id}/${crypto.randomUUID()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(key, file, { contentType: file.type || undefined });
        if (uploadError) throw uploadError;

        const label = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
        const { data, error: insertError } = await supabase
          .from("report_attachments")
          .insert({
            report_id: report.id,
            filename: file.name,
            label,
            mime_type: file.type || null,
            bytes: file.size,
            storage_path: key,
            // First upload becomes primary; the radio moves it after.
            is_primary: attachments.length === 0,
            sort_order: attachments.length,
          })
          .select()
          .single();
        if (insertError) throw insertError;
        setAttachments((list) => [...list, data]);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setBusy(false);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function setLabel(attachment: ReportAttachment, label: string) {
    setAttachments((list) =>
      list.map((a) => (a.id === attachment.id ? { ...a, label } : a)),
    );
    await supabase
      .from("report_attachments")
      .update({ label })
      .eq("id", attachment.id);
  }

  async function setPrimary(attachment: ReportAttachment) {
    if (!report) return;
    setError(null);
    // Unset first: the partial unique index allows at most one primary.
    const { error: clearError } = await supabase
      .from("report_attachments")
      .update({ is_primary: false })
      .eq("report_id", report.id);
    if (clearError) {
      setError(getErrorMessage(clearError));
      return;
    }
    const { error: setErrorRes } = await supabase
      .from("report_attachments")
      .update({ is_primary: true })
      .eq("id", attachment.id);
    if (setErrorRes) {
      setError(getErrorMessage(setErrorRes));
      return;
    }
    setAttachments((list) =>
      list.map((a) => ({ ...a, is_primary: a.id === attachment.id })),
    );
  }

  async function removeAttachment(attachment: ReportAttachment) {
    setError(null);
    await supabase.storage.from(BUCKET).remove([attachment.storage_path]);
    const { error: deleteError } = await supabase
      .from("report_attachments")
      .delete()
      .eq("id", attachment.id);
    if (deleteError) {
      setError(getErrorMessage(deleteError));
      return;
    }
    const rest = attachments.filter((a) => a.id !== attachment.id);
    // Keep an existing file primary if the primary was removed.
    if (attachment.is_primary && rest[0]) {
      await supabase
        .from("report_attachments")
        .update({ is_primary: true })
        .eq("id", rest[0].id);
      rest[0] = { ...rest[0], is_primary: true };
    }
    setAttachments([...rest]);
  }

  /* ------------------------------ Step 3 ------------------------------ */

  function blurSeries() {
    const result = parseSeries(seriesText);
    if ("error" in result) {
      setSeriesError(result.error);
      setSeriesPoints([]);
    } else {
      setSeriesError(null);
      setSeriesPoints(result.points);
    }
  }

  const metric = useMemo(() => {
    const value = Number(metricValue);
    if (metricValue.trim() === "" || Number.isNaN(value)) return null;
    if (!metricUnit.trim()) return null;
    return { value, unit: metricUnit.trim(), tone: metricTone };
  }, [metricValue, metricUnit, metricTone]);

  async function completeSummary() {
    if (!report) return;
    setBusy(true);
    setError(null);
    try {
      // Interfaces lack the Json index signature; the shapes are plain
      // JSON by construction.
      const patch = {
        headline: headline.trim(),
        summary: summary.trim(),
        headline_metric: metric ? { ...metric } : null,
        chart_series:
          seriesPoints.length > 0
            ? seriesPoints.map((p) => ({ t: p.t, v: p.v }))
            : null,
      };
      const { data, error: updateError } = await supabase
        .from("reports")
        .update(patch)
        .eq("id", report.id)
        .select()
        .single();
      if (updateError) throw updateError;
      setReport(data);
      setStep(3);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  /* ------------------------------ Step 5 ------------------------------ */

  async function publish() {
    if (!report) return;
    setBusy(true);
    setError(null);
    try {
      const { data, error: publishError } = await supabase
        .from("reports")
        .update({ state: "published", published_at: new Date().toISOString() })
        .eq("id", report.id)
        .select()
        .single();
      if (publishError) throw publishError;
      setReport(data);

      // The engagement follows the deliverable. A screening is delivered
      // once: publishing completes it. A monitoring subscription becomes
      // active on its first published issue and gets a next-issue date a
      // quarter out.
      if (service) {
        const today = new Date().toISOString().slice(0, 10);
        if (
          service.kind === "screening" &&
          service.status !== "completed" &&
          service.status !== "cancelled"
        ) {
          await supabase
            .from("services")
            .update({
              status: "completed",
              started_on: service.started_on ?? today,
              ended_on: today,
            })
            .eq("id", service.id);
        } else if (service.kind === "monitoring") {
          const next = new Date();
          next.setMonth(next.getMonth() + 3);
          await supabase
            .from("services")
            .update({
              ...(service.status === "scoping" || service.status === "quoted"
                ? {
                    status: "active",
                    started_on: service.started_on ?? today,
                  }
                : {}),
              cadence: service.cadence ?? "quarterly",
              next_issue_due: next.toISOString().slice(0, 10),
            })
            .eq("id", service.id);
        }
      }

      setPublished(true);
      // The activity feed derives from the published report itself.
      // TODO: notification email + audit row, once those systems exist.
      refetch();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setStep(0);
    setServiceId("");
    setTarget("new");
    setPeriodStart("");
    setPeriodEnd("");
    setReport(null);
    setAttachments([]);
    setHeadline("");
    setSummary("");
    setMetricValue("");
    setMetricUnit("");
    setMetricTone("neutral");
    setSeriesText("");
    setSeriesPoints([]);
    setSeriesError(null);
    setPublished(false);
    setError(null);
  }

  /* ------------------------------ Render ------------------------------ */

  const siblings = useMemo(() => {
    if (!report) return [];
    const others = serviceReports.filter((r) => r.id !== report.id);
    return [...others, report].sort((a, b) => a.issue_number - b.issue_number);
  }, [serviceReports, report]);

  const primaryCount = attachments.filter((a) => a.is_primary).length;

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>Publish a report</h1>
        <ol className={styles.stepper}>
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={
                i === step
                  ? styles.stepCurrent
                  : i < step
                    ? styles.stepDone
                    : styles.step
              }
            >
              {label}
            </li>
          ))}
        </ol>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      {/* -------------------- 1. Pick the target -------------------- */}
      {step === 0 ? (
        <section className={styles.panel}>
          <Select
            label="Service"
            value={serviceId}
            options={serviceOptions}
            onChange={(v) => {
              setServiceId(v);
              setTarget("new");
            }}
          />

          {service ? (
            <>
              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Target</legend>
                <label className={styles.radio}>
                  <input
                    type="radio"
                    checked={target === "new"}
                    onChange={() => setTarget("new")}
                  />
                  New issue{" "}
                  <span className={styles.hint}>
                    (issue{" "}
                    {serviceReports.reduce(
                      (m, r) => Math.max(m, r.issue_number),
                      0,
                    ) + 1}
                    )
                  </span>
                </label>
                {drafts.map((d) => (
                  <label key={d.id} className={styles.radio}>
                    <input
                      type="radio"
                      checked={target === d.id}
                      onChange={() => setTarget(d.id)}
                    />
                    Draft: {REPORT_KIND_LABELS[d.kind]} #{d.issue_number}
                    {d.headline ? ` — ${d.headline}` : ""}
                  </label>
                ))}
              </fieldset>

              {target === "new" ? (
                <>
                  {service.kind === "monitoring" ? (
                    <Select
                      label="Issue kind"
                      value={newKind}
                      options={[
                        { value: "periodic", label: "Periodic issue" },
                        { value: "alert", label: "Alert issue" },
                      ]}
                      onChange={(v) => setNewKind(v as ReportKind)}
                    />
                  ) : null}
                  <div className={styles.dates}>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>
                        Observation window — start
                      </span>
                      <input
                        type="date"
                        value={periodStart}
                        onChange={(e) => setPeriodStart(e.target.value)}
                        className={styles.input}
                      />
                    </label>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>
                        Observation window — end
                      </span>
                      <input
                        type="date"
                        value={periodEnd}
                        onChange={(e) => setPeriodEnd(e.target.value)}
                        className={styles.input}
                      />
                    </label>
                  </div>
                </>
              ) : null}
            </>
          ) : null}

          <div className={styles.actions}>
            <Button
              onClick={() => void completeTarget()}
              disabled={!service || busy}
            >
              {busy ? "Working…" : "Continue"}
            </Button>
          </div>
        </section>
      ) : null}

      {/* ------------------- 2. Upload attachments ------------------- */}
      {step === 1 && report ? (
        <section className={styles.panel}>
          <div
            className={styles.dropzone}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void addFiles(e.dataTransfer.files);
            }}
          >
            <p className={styles.dropText}>
              Drag and drop any files — a PDF, a Word document, a GeoTIFF,
              a zipped folder of PNGs.
            </p>
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
            >
              {busy ? "Uploading…" : "Choose files"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) void addFiles(e.target.files);
              }}
            />
          </div>

          {attachments.length > 0 ? (
            <ul className={styles.uploadList}>
              {attachments.map((a) => (
                <li key={a.id} className={styles.uploadItem}>
                  <input
                    type="text"
                    defaultValue={a.label}
                    onBlur={(e) => void setLabel(a, e.target.value)}
                    className={styles.input}
                    aria-label={`Display label for ${a.filename}`}
                  />
                  <span className={styles.uploadFilename}>{a.filename}</span>
                  <label className={styles.radio}>
                    <input
                      type="radio"
                      name="primary"
                      checked={a.is_primary}
                      onChange={() => void setPrimary(a)}
                    />
                    Primary
                  </label>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => void removeAttachment(a)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.hint}>No files yet.</p>
          )}

          <div className={styles.actions}>
            <Button variant="ghost" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button
              onClick={() => setStep(2)}
              disabled={attachments.length === 0 || primaryCount !== 1 || busy}
            >
              Continue
            </Button>
          </div>
        </section>
      ) : null}

      {/* --------------------- 3. Write the summary ------------------- */}
      {step === 2 && report ? (
        <section className={styles.panel}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              Headline — one line; the Overview card and the notification
              email carry it
            </span>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className={styles.input}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              Summary — two or three sentences on what the data shows and
              whether it warrants action
            </span>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              className={styles.textarea}
            />
          </label>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>
              Headline metric (optional)
            </legend>
            <div className={styles.metricRow}>
              <input
                type="number"
                step="any"
                placeholder="−14"
                value={metricValue}
                onChange={(e) => setMetricValue(e.target.value)}
                className={styles.input}
                aria-label="Metric value"
              />
              <input
                type="text"
                placeholder="mm / 5 wks"
                value={metricUnit}
                onChange={(e) => setMetricUnit(e.target.value)}
                className={styles.input}
                aria-label="Metric unit"
              />
              <Select
                label="Tone"
                value={metricTone}
                options={[
                  { value: "neutral", label: "Neutral" },
                  { value: "warning", label: "Warning" },
                  { value: "danger", label: "Danger" },
                ]}
                onChange={(v) => setMetricTone(v as MetricTone)}
              />
            </div>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Chart series (optional)</legend>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>
                Paste CSV (date,value per line) or JSON — 5–20 points, any
                cadence
              </span>
              <textarea
                value={seriesText}
                onChange={(e) => setSeriesText(e.target.value)}
                onBlur={blurSeries}
                rows={5}
                className={styles.textarea}
                placeholder={'2026-03-01,-2.1\n2026-04-12,-3.2\n2026-05-31,-5.4'}
              />
            </label>
            {seriesError ? (
              <p className={styles.error}>{seriesError}</p>
            ) : seriesPoints.length >= 2 ? (
              <div className={styles.seriesPreview}>
                <Sparkline
                  points={seriesPoints}
                  stroke={
                    metricTone === "danger"
                      ? "var(--color-danger)"
                      : metricTone === "warning"
                        ? "var(--color-warning)"
                        : "var(--color-text-subtle)"
                  }
                />
                <span className={styles.hint}>
                  {seriesPoints.length} points
                </span>
              </div>
            ) : null}
          </fieldset>

          <div className={styles.actions}>
            <Button variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              onClick={() => void completeSummary()}
              disabled={!headline.trim() || !summary.trim() || busy}
            >
              {busy ? "Saving…" : "Continue"}
            </Button>
          </div>
        </section>
      ) : null}

      {/* ------------------------- 4. Preview ------------------------- */}
      {step === 3 && report ? (
        <section className={styles.panel}>
          <p className={styles.hint}>
            Rendered with the production report viewer, exactly as the
            customer will see it.
          </p>
          <div className={styles.previewFrame}>
            <ReportViewer
              report={report}
              service={service}
              site={site}
              siblings={siblings}
              attachments={attachments}
            />
          </div>
          <div className={styles.actions}>
            <Button variant="ghost" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button onClick={() => setStep(4)}>Looks right — continue</Button>
          </div>
        </section>
      ) : null}

      {/* ------------------------- 5. Publish ------------------------- */}
      {step === 4 && report ? (
        <section className={styles.panel}>
          {published ? (
            <>
              <p className={styles.publishedNote}>
                Published {formatShortDate(report.published_at)} —{" "}
                {REPORT_KIND_LABELS[report.kind]} #{report.issue_number} for{" "}
                {service ? serviceDisplayName(service, site) : "the service"}.
              </p>
              <div className={styles.actions}>
                <Button to={href(`/reports/${report.id}`)}>View report</Button>
                <Button variant="secondary" onClick={reset}>
                  Publish another
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className={styles.hint}>
                Publishing stamps published_at and makes this issue visible
                to the customer immediately.
              </p>
              <div className={styles.actions}>
                <Button variant="ghost" onClick={() => setStep(3)}>
                  Back
                </Button>
                <Button onClick={() => void publish()} disabled={busy}>
                  {busy ? "Publishing…" : "Publish"}
                </Button>
              </div>
            </>
          )}
        </section>
      ) : null}

      {!published && report && step > 0 ? (
        <p className={styles.draftNote}>
          Working on {REPORT_KIND_LABELS[report.kind]} #{report.issue_number}
          {" — saved as a draft; nothing is customer-visible until step 5. "}
          <Link to={href("/reports")}>Reports library</Link>
        </p>
      ) : null}
    </div>
  );
}
