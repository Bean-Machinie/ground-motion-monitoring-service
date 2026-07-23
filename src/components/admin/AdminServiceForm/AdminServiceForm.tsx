// Create or edit a service on a customer's account. One form for both:
// in create mode it can also spin up a new site inline (a service needs a
// site, and a brand-new customer has none yet). Screening vs monitoring
// drives which schedule fields show; the DB check that screenings carry no
// cadence is mirrored here and in adminServices.
import { useMemo, useState } from "react";
import { getErrorMessage } from "@/lib/errors";
import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";
import { Select } from "@/components/ui/Select/Select";
import {
  SERVICE_KIND_LABELS,
  SERVICE_STATUS_LABELS,
  TECHNIQUE_LABELS,
  type AnalysisTechnique,
  type Service,
  type ServiceKind,
  type ServiceStatus,
  type Site,
} from "@/types/domain";
import {
  createService,
  createSite,
  customerSites,
  updateService,
  type ServiceInput,
} from "@/lib/adminServices";
import styles from "./AdminServiceForm.module.css";

const NEW_SITE = "__new__";

const KIND_OPTIONS = (
  Object.keys(SERVICE_KIND_LABELS) as ServiceKind[]
).map((k) => ({ value: k, label: SERVICE_KIND_LABELS[k] }));

const TECHNIQUE_OPTIONS = (
  Object.keys(TECHNIQUE_LABELS) as AnalysisTechnique[]
).map((t) => ({ value: t, label: TECHNIQUE_LABELS[t] }));

const STATUS_OPTIONS = (
  Object.keys(SERVICE_STATUS_LABELS) as ServiceStatus[]
).map((s) => ({ value: s, label: SERVICE_STATUS_LABELS[s] }));

function parseCoord(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function AdminServiceForm({
  mode,
  service,
  customerId,
  sites,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  service?: Service;
  customerId: string;
  sites: Site[];
  onClose: () => void;
  onSaved: (service: Service) => void;
}) {
  const ownSites = useMemo(
    () => customerSites(sites, customerId),
    [sites, customerId],
  );

  const [name, setName] = useState(service?.name ?? "");
  const [siteChoice, setSiteChoice] = useState<string>(
    service?.site_id ?? ownSites[0]?.id ?? NEW_SITE,
  );
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteCountry, setNewSiteCountry] = useState("");
  const [newSiteLat, setNewSiteLat] = useState("");
  const [newSiteLon, setNewSiteLon] = useState("");

  const [kind, setKind] = useState<ServiceKind>(service?.kind ?? "monitoring");
  const [technique, setTechnique] = useState<AnalysisTechnique>(
    service?.technique ?? "insar_sbas",
  );
  const [status, setStatus] = useState<ServiceStatus>(
    service?.status ?? "active",
  );
  const [nextIssueDue, setNextIssueDue] = useState(
    service?.next_issue_due ?? "",
  );
  const [startedOn, setStartedOn] = useState(service?.started_on ?? "");
  const [endedOn, setEndedOn] = useState(service?.ended_on ?? "");
  const [scopeNotes, setScopeNotes] = useState(service?.scope_notes ?? "");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creatingSite = siteChoice === NEW_SITE;
  const canSubmit =
    name.trim().length > 0 && (!creatingSite || newSiteName.trim().length > 0);

  const siteOptions = [
    ...ownSites.map((s) => ({ value: s.id, label: s.name })),
    { value: NEW_SITE, label: "+ New site…" },
  ];

  async function submit() {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    try {
      let siteId = siteChoice;
      if (creatingSite) {
        const { data: site, error: siteError } = await createSite({
          orgId: customerId,
          name: newSiteName.trim(),
          country: newSiteCountry.trim() || null,
          lat: parseCoord(newSiteLat),
          lon: parseCoord(newSiteLon),
        });
        if (siteError) throw siteError;
        if (!site) throw new Error("Site was not created.");
        siteId = site.id;
      }

      const input: ServiceInput = {
        orgId: customerId,
        siteId,
        name: name.trim(),
        kind,
        technique,
        status,
        cadence: kind === "monitoring" ? "quarterly" : null,
        nextIssueDue: kind === "monitoring" ? nextIssueDue || null : null,
        startedOn: startedOn || null,
        endedOn: endedOn || null,
        scopeNotes: scopeNotes.trim() || null,
      };

      const { data, error: saveError } =
        mode === "create"
          ? await createService(input)
          : await updateService((service as Service).id, input);
      if (saveError) throw saveError;
      if (!data) throw new Error("The service was not saved.");
      onSaved(data as Service);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={mode === "create" ? "New service" : "Edit service"}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={!canSubmit || busy}>
            {busy
              ? "Saving…"
              : mode === "create"
                ? "Create service"
                : "Save changes"}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <label className={styles.field}>
          <span className={styles.label}>Service name</span>
          <input
            type="text"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Esbjerg quay expansion"
          />
          <span className={styles.hint}>
            The customer's own name for the work — shown everywhere.
          </span>
        </label>

        <Select
          label="Site"
          value={siteChoice}
          options={siteOptions}
          onChange={setSiteChoice}
        />

        {creatingSite ? (
          <div className={styles.subForm}>
            <label className={styles.field}>
              <span className={styles.label}>New site name</span>
              <input
                type="text"
                className={styles.input}
                value={newSiteName}
                onChange={(e) => setNewSiteName(e.target.value)}
                placeholder="e.g. Port of Esbjerg"
              />
            </label>
            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.label}>Country (optional)</span>
                <input
                  type="text"
                  className={styles.input}
                  value={newSiteCountry}
                  onChange={(e) => setNewSiteCountry(e.target.value)}
                  placeholder="Denmark"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Latitude (optional)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className={styles.input}
                  value={newSiteLat}
                  onChange={(e) => setNewSiteLat(e.target.value)}
                  placeholder="55.46"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Longitude (optional)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className={styles.input}
                  value={newSiteLon}
                  onChange={(e) => setNewSiteLon(e.target.value)}
                  placeholder="8.45"
                />
              </label>
            </div>
          </div>
        ) : null}

        <div className={styles.row}>
          <Select
            label="Kind"
            value={kind}
            options={KIND_OPTIONS}
            onChange={(v) => setKind(v as ServiceKind)}
          />
          <Select
            label="Technique"
            value={technique}
            options={TECHNIQUE_OPTIONS}
            onChange={(v) => setTechnique(v as AnalysisTechnique)}
          />
          <Select
            label="Status"
            value={status}
            options={STATUS_OPTIONS}
            onChange={(v) => setStatus(v as ServiceStatus)}
          />
        </div>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Started on</span>
            <input
              type="date"
              className={styles.input}
              value={startedOn}
              onChange={(e) => setStartedOn(e.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Ended on</span>
            <input
              type="date"
              className={styles.input}
              value={endedOn}
              onChange={(e) => setEndedOn(e.target.value)}
            />
          </label>
          {kind === "monitoring" ? (
            <label className={styles.field}>
              <span className={styles.label}>Next issue due</span>
              <input
                type="date"
                className={styles.input}
                value={nextIssueDue}
                onChange={(e) => setNextIssueDue(e.target.value)}
              />
            </label>
          ) : null}
        </div>

        {kind === "monitoring" ? (
          <p className={styles.hint}>
            Monitoring issues are quarterly. Screenings carry no cadence.
          </p>
        ) : null}

        <label className={styles.field}>
          <span className={styles.label}>Scope notes (optional)</span>
          <textarea
            className={styles.textarea}
            rows={3}
            value={scopeNotes}
            onChange={(e) => setScopeNotes(e.target.value)}
            placeholder="Internal notes on the engagement scope."
          />
        </label>

        {error ? <p className={styles.error}>{error}</p> : null}
      </div>
    </Modal>
  );
}
