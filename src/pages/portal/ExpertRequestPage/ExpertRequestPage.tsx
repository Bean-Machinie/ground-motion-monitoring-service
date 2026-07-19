// Expert-assisted request (/requests/new/expert), reached from the
// "Get Expert Guidance" card on the request start chooser. A short,
// contact-style form: plain useState + controlled inputs, no form
// library. The support-topic field is a custom dropdown (same
// pointerdown/Escape close pattern as menus elsewhere), and the phone
// field uses react-phone-number-input, restyled to match our inputs.
import { useEffect, useRef, useState, type FormEvent } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { usePortalCrumbs } from "@/components/layout/PortalShell/PortalShell";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { getErrorMessage } from "@/lib/errors";
import { submitExpertAssistedRequest } from "@/lib/expertRequests";
import styles from "./ExpertRequestPage.module.css";

const EXPERT_SUPPORT_TOPICS = [
  "Selecting the right monitoring service",
  "Defining an area of interest",
  "Understanding displacement data",
  "Planning reporting or alerts",
  "Custom project or partnership",
] as const;

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  supportTopic: string;
  phone: string;
  message: string;
}

const INITIAL_VALUES: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  organization: "",
  supportTopic: "",
  phone: "",
  message: "",
};

type Status = "idle" | "submitting" | "submitted";

export function ExpertRequestPage() {
  usePortalCrumbs([
    { label: "Overview", to: "/" },
    { label: "New request", to: "/requests/new" },
    { label: "Specialist support" },
  ]);

  const [formValues, setFormValues] = useState<FormValues>(INITIAL_VALUES);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isSupportTopicMenuOpen, setIsSupportTopicMenuOpen] = useState(false);
  const supportTopicMenuRef = useRef<HTMLDivElement | null>(null);

  function updateField<K extends keyof FormValues>(
    field: K,
    value: FormValues[K],
  ) {
    setFormValues((previous) => ({ ...previous, [field]: value }));
  }

  // Close the topic menu on outside pointerdown or Escape — listeners are
  // only attached while the menu is open, removed on cleanup.
  useEffect(() => {
    if (!isSupportTopicMenuOpen) return;

    function onPointerDown(event: PointerEvent) {
      const root = supportTopicMenuRef.current;
      if (root && !root.contains(event.target as Node)) {
        setIsSupportTopicMenuOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsSupportTopicMenuOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isSupportTopicMenuOpen]);

  function selectSupportTopic(topic: string) {
    updateField("supportTopic", topic);
    setIsSupportTopicMenuOpen(false);
  }

  async function submitExpertRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status !== "idle") return;
    setError(null);
    setStatus("submitting");

    try {
      // The UI's field names don't map to the backend 1:1 — remap here.
      await submitExpertAssistedRequest({
        name: `${formValues.firstName} ${formValues.lastName}`.trim(),
        email: formValues.email,
        organization: formValues.organization.trim() || "Not provided",
        projectAreaDescription:
          formValues.supportTopic || "General specialist support",
        projectObjective: formValues.message,
        preferredOutputFormat: "Both",
        comments: [
          `Phone: ${formValues.phone || "Not provided"}`,
          // Internal routing hint for the notification pipeline.
          "Email recipient: thomasbenfer@gmail.com",
        ].join("\n"),
      });
      setStatus("submitted");
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus("idle");
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>Request specialist support</h1>
        <p className={styles.lede}>
          Tell us what you are working on and where you need support. A
          HELIOSYN specialist will review your message and help shape the
          right next step.
        </p>
      </header>

      <form className={styles.form} onSubmit={submitExpertRequest}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="expert-first-name">
            First name <strong className={styles.required}>*</strong>
          </label>
          <input
            id="expert-first-name"
            className={styles.input}
            type="text"
            required
            autoComplete="given-name"
            placeholder="First name"
            value={formValues.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="expert-last-name">
            Last name <strong className={styles.required}>*</strong>
          </label>
          <input
            id="expert-last-name"
            className={styles.input}
            type="text"
            required
            autoComplete="family-name"
            placeholder="Last name"
            value={formValues.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="expert-email">
            Email <strong className={styles.required}>*</strong>
          </label>
          <input
            id="expert-email"
            className={styles.input}
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            value={formValues.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="expert-organization">
            Organization
          </label>
          <input
            id="expert-organization"
            className={styles.input}
            type="text"
            autoComplete="organization"
            placeholder="Company or organization"
            value={formValues.organization}
            onChange={(e) => updateField("organization", e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Phone number</span>
          <div className={styles.phoneInput}>
            <PhoneInput
              international
              defaultCountry="DK"
              value={formValues.phone || undefined}
              onChange={(value) => updateField("phone", value ?? "")}
            />
          </div>
        </div>

        {/* Support topic: custom dropdown, not a native select. */}
        <div className={styles.field}>
          <span className={styles.label}>Support topic</span>
          <div className={styles.topicMenuRoot} ref={supportTopicMenuRef}>
            <button
              type="button"
              className={styles.topicToggle}
              aria-haspopup="menu"
              aria-expanded={isSupportTopicMenuOpen}
              onClick={() => setIsSupportTopicMenuOpen((open) => !open)}
            >
              <span
                className={
                  formValues.supportTopic ? undefined : styles.topicPlaceholder
                }
              >
                {formValues.supportTopic || "Select a topic"}
              </span>
              <span className={styles.topicCaret} aria-hidden="true" />
            </button>
            {isSupportTopicMenuOpen ? (
              <div className={styles.topicMenu} role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className={`${styles.topicItem} ${styles.topicPlaceholder}`}
                  onClick={() => selectSupportTopic("")}
                >
                  Select a topic
                </button>
                {EXPERT_SUPPORT_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    role="menuitem"
                    className={`${styles.topicItem} ${
                      formValues.supportTopic === topic
                        ? styles.topicItemActive
                        : ""
                    }`}
                    onClick={() => selectSupportTopic(topic)}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className={`${styles.field} ${styles.messageField}`}>
          <label className={styles.label} htmlFor="expert-message">
            Message <strong className={styles.required}>*</strong>
          </label>
          <textarea
            id="expert-message"
            className={`${styles.input} ${styles.textarea}`}
            rows={5}
            required
            placeholder="Leave us a message..."
            value={formValues.message}
            onChange={(e) => updateField("message", e.target.value)}
          />
        </div>

        {error ? (
          <div className={styles.fullWidth}>
            <ErrorMessage message={error} />
          </div>
        ) : null}

        {status === "submitted" ? (
          <p className={styles.success}>
            Thanks — your message has been sent. A specialist will get back
            to you shortly.
          </p>
        ) : null}

        <button
          type="submit"
          className={styles.submit}
          disabled={status !== "idle"}
        >
          {status === "submitting"
            ? "Sending…"
            : status === "submitted"
              ? "Sent"
              : "Send message"}
        </button>
      </form>
    </div>
  );
}
