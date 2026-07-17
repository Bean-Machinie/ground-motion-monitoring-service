// Account page: shows the current profile and allows editing of
// name and organization. Role and email are read-only here.
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import { useProfile } from "@/hooks/useProfile";
import { Card } from "@/components/ui/Card/Card";
import { Button } from "@/components/ui/Button/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { formatDate } from "@/lib/dates";
import styles from "./AccountPage.module.css";

export function AccountPage() {
  const { profile, loading, error, refetch } = useProfile();

  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setOrganizationName(profile.organization_name ?? "");
    }
  }, [profile]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName || null,
          organization_name: organizationName || null,
        })
        .eq("id", profile.id);
      if (updateError) throw updateError;
      setSaved(true);
      refetch();
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState label="Loading your account…" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />;
  }

  if (!profile) {
    return (
      <ErrorMessage
        message="Your profile could not be found. Please contact support."
      />
    );
  }

  return (
    <div className={styles.page}>
      <header>
        <h1>Account</h1>
        <p className={styles.lede}>Your profile and account details.</p>
      </header>

      <Card>
        <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
          {saveError ? <ErrorMessage message={saveError} /> : null}
          {saved ? (
            <p className={styles.saved} role="status">
              Changes saved.
            </p>
          ) : null}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="accountEmail">
              Email address
            </label>
            <input
              id="accountEmail"
              className={styles.input}
              type="email"
              value={profile.email}
              disabled
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="accountFullName">
              Full name
            </label>
            <input
              id="accountFullName"
              className={styles.input}
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="accountOrganization">
              Organization
            </label>
            <input
              id="accountOrganization"
              className={styles.input}
              type="text"
              autoComplete="organization"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </Card>

      <Card>
        <dl className={styles.details}>
          <div className={styles.detailEntry}>
            <dt>Account type</dt>
            <dd className={styles.role}>{profile.role}</dd>
          </div>
          <div className={styles.detailEntry}>
            <dt>Member since</dt>
            <dd>{formatDate(profile.created_at)}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
