// Self-service request (/requests/new/self-service). Deliberately bare
// bones: pick the product — monitoring or screening — give it a name,
// submit. Submitting creates a real `services` row in 'scoping' status,
// owned by the customer (plus a minimal `sites` reference row behind the
// scenes, since every service is performed somewhere), so the request
// appears in the sidebar tree and on the Overview immediately and the
// admin side can pick it up from there.
//
// Area-of-interest definition, scope notes, and output configuration
// come later; the point right now is a working end-to-end path:
// customer requests → admin publishes.
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import { useAuth } from "@/hooks/useAuth";
import { usePortalData } from "@/context/PortalDataContext";
import { PortalPageHeader } from "@/components/layout/PortalShell/PortalPageHeader";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { site as siteConfig } from "@/config/site";
import type { ServiceKind } from "@/types/domain";
import styles from "./NewRequestPage.module.css";

/** URL-safe slug plus a short random suffix — site slugs are globally
    unique, so the suffix avoids cross-org collisions. */
function makeSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const suffix = Math.random().toString(36).slice(2, 6);
  return base ? `${base}-${suffix}` : `location-${suffix}`;
}

export function NewRequestPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refetch } = usePortalData();
  const [searchParams] = useSearchParams();

  const [name, setName] = useState("");
  // The Overview's add tiles preselect the product (?product=screening).
  const [kind, setKind] = useState<ServiceKind>(
    searchParams.get("product") === "screening" ? "screening" : "monitoring",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      // Minimal reference site behind the scenes: every service is
      // performed somewhere, and the real AOI definition comes later.
      const { data: siteRow, error: siteError } = await supabase
        .from("sites")
        .insert({
          org_id: user.id,
          name: name.trim(),
          slug: makeSlug(name),
        })
        .select("id")
        .single();
      if (siteError) throw siteError;

      // The request is the service row, in scoping from the start.
      const { data: service, error: serviceError } = await supabase
        .from("services")
        .insert({
          org_id: user.id,
          site_id: siteRow.id,
          name: name.trim(),
          kind,
          status: "scoping",
          requested_at: new Date().toISOString(),
          requested_by: user.id,
        })
        .select("id")
        .single();
      if (serviceError) throw serviceError;

      // The new service must be visible the moment the customer lands on
      // its page — never an empty portal while waiting.
      refetch();
      navigate(`/services/${service.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <PortalPageHeader
        crumbs={[{ label: "Overview", to: "/" }, { label: "New request" }]}
        title="New request"
        lede="Pick the product and name the work. We'll scope it and come back with a quote — the request appears in your overview right away."
      />

      <form className={styles.form} onSubmit={handleSubmit}>
        {error ? <ErrorMessage message={error} /> : null}

        {/* ------------------------ Name the work ----------------------- */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="request-name">
            Name for the work
          </label>
          <input
            id="request-name"
            className={styles.input}
            type="text"
            required
            maxLength={120}
            placeholder="e.g. Esbjerg quay expansion"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className={styles.hint}>
            Your own name for it — this is how it will appear everywhere.
          </p>
        </div>

        {/* -------------------------- Product ---------------------------- */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.label}>What do you need?</legend>
          <div className={styles.kindGrid}>
            <label
              className={`${styles.kindCard} ${
                kind === "monitoring" ? styles.kindCardActive : ""
              }`}
            >
              <input
                type="radio"
                name="kind"
                value="monitoring"
                checked={kind === "monitoring"}
                onChange={() => setKind("monitoring")}
                className={styles.kindRadio}
              />
              <span className={styles.kindTitle}>Monitoring</span>
              <span className={styles.kindBody}>
                An ongoing subscription: recurring issues that track ground
                motion over time, with alerts on critical change.
              </span>
            </label>
            <label
              className={`${styles.kindCard} ${
                kind === "screening" ? styles.kindCardActive : ""
              }`}
            >
              <input
                type="radio"
                name="kind"
                value="screening"
                checked={kind === "screening"}
                onChange={() => setKind("screening")}
                className={styles.kindRadio}
              />
              <span className={styles.kindTitle}>Screening</span>
              <span className={styles.kindBody}>
                A one-off report: the historical deformation baseline of an
                area, delivered once.
              </span>
            </label>
          </div>
        </fieldset>

        <div className={styles.actions}>
          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit request"}
          </button>
          <p className={styles.footnote}>
            We'll review it and come back with a scope and quote.
          </p>
        </div>
      </form>

      <p className={styles.comingSoon}>
        Not sure what fits? Talk to us first:{" "}
        <Link to="/home#contact">contact the team</Link> or write to{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>
          {siteConfig.contactEmail}
        </a>
        .
      </p>
    </div>
  );
}
