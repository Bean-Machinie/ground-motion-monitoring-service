// New request (/requests/new). Submitting the form creates a real
// `services` row in 'scoping' status, owned by the customer — a request
// IS a service from the moment it is asked for, so it appears in the
// sidebar tree and on the Overview immediately. There is no separate
// requests table and no dead-end contact block.
//
// The form collects: a name for the work, which product (monitoring or
// screening), the area of interest (an existing location or a new one),
// and free-text scope notes. Admin-side transitions (scoping → quoted →
// active) stay in Supabase; the portal only reads them.
import { useMemo, useState, type FormEvent } from "react";
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
  const { sites, refetch } = usePortalData();
  const [searchParams] = useSearchParams();

  const [name, setName] = useState("");
  // The Overview's add tiles preselect the product (?product=screening).
  const [kind, setKind] = useState<ServiceKind>(
    searchParams.get("product") === "screening" ? "screening" : "monitoring",
  );
  // "" = create a new location; otherwise an existing site id.
  const [siteId, setSiteId] = useState("");
  const [locationName, setLocationName] = useState("");
  const [country, setCountry] = useState("");
  const [scopeNotes, setScopeNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedSites = useMemo(
    () => [...sites].sort((a, b) => a.name.localeCompare(b.name)),
    [sites],
  );

  const creatingSite = siteId === "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      // Area of interest: match an existing location or create the
      // reference record for a new one.
      let targetSiteId = siteId;
      if (creatingSite) {
        const { data, error: siteError } = await supabase
          .from("sites")
          .insert({
            org_id: user.id,
            name: locationName.trim(),
            slug: makeSlug(locationName),
            country: country.trim() || null,
          })
          .select("id")
          .single();
        if (siteError) throw siteError;
        targetSiteId = data.id;
      }

      // The request is the service row, in scoping from the start.
      const { data: service, error: serviceError } = await supabase
        .from("services")
        .insert({
          org_id: user.id,
          site_id: targetSiteId,
          name: name.trim(),
          kind,
          status: "scoping",
          requested_at: new Date().toISOString(),
          requested_by: user.id,
          scope_notes: scopeNotes.trim() || null,
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
        lede="Tell us what you want to watch. We'll scope it and come back with a quote — the request appears in your overview right away."
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

        {/* ----------------------- Area of interest ---------------------- */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="request-site">
            Area of interest
          </label>
          <select
            id="request-site"
            className={styles.input}
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
          >
            <option value="">New location…</option>
            {sortedSites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.country ? ` — ${s.country}` : ""}
              </option>
            ))}
          </select>
          {!creatingSite ? (
            <p className={styles.hint}>
              Work at a location you already use connects to everything
              observed there before.
            </p>
          ) : null}
        </div>

        {creatingSite ? (
          <div className={styles.locationRow}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="request-location">
                Location
              </label>
              <input
                id="request-location"
                className={styles.input}
                type="text"
                required
                maxLength={120}
                placeholder="e.g. Port of Esbjerg"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="request-country">
                Country
              </label>
              <input
                id="request-country"
                className={styles.input}
                type="text"
                maxLength={56}
                placeholder="e.g. Denmark"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
          </div>
        ) : null}

        {/* ------------------------- Scope notes ------------------------- */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="request-notes">
            Scope notes
          </label>
          <textarea
            id="request-notes"
            className={`${styles.input} ${styles.textarea}`}
            rows={4}
            maxLength={2000}
            placeholder="What is the structure or area, what movement are you concerned about, and is there a deadline?"
            value={scopeNotes}
            onChange={(e) => setScopeNotes(e.target.value)}
          />
        </div>

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
