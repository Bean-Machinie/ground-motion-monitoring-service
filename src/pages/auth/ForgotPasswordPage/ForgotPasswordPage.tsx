// Password-reset request page: sends a Supabase reset email.
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import styles from "@/pages/auth/authForm.module.css";

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: resetError } = await requestPasswordReset(email);
    setSubmitting(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSubmitted(true);
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Reset your password</h1>
        <p className={styles.subtitle}>
          Enter your email address and we will send you a reset link.
        </p>

        {submitted ? (
          <div className={styles.success} role="status">
            If an account exists for {email}, a password-reset email is on its
            way.
          </div>
        ) : (
          <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
            {error ? <ErrorMessage message={error} /> : null}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                className={styles.input}
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={submitting} className={styles.submit}>
              {submitting ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}

        <div className={styles.links}>
          <Link to="/sign-in">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
