// Sign-up page: creates a Supabase auth user; a profile row is created
// automatically by a database trigger with the default "customer" role.
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import styles from "@/pages/auth/authForm.module.css";

export function SignUpPage() {
  const { signUpWithPassword } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: signUpError } = await signUpWithPassword(
      email,
      password,
      fullName || undefined,
    );
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    setSubmitted(true);
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create an account</h1>
        <p className={styles.subtitle}>
          Set up access to your monitoring results.
        </p>

        {submitted ? (
          <div className={styles.success} role="status">
            Account created. If email confirmation is enabled, check your inbox
            for a confirmation link, then{" "}
            <Link to="/sign-in">sign in</Link>.
          </div>
        ) : (
          <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
            {error ? <ErrorMessage message={error} /> : null}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="fullName">
                Full name
              </label>
              <input
                id="fullName"
                className={styles.input}
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

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

            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className={styles.input}
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className={styles.hint}>At least 8 characters.</span>
            </div>

            <Button type="submit" disabled={submitting} className={styles.submit}>
              {submitting ? "Creating account…" : "Create account"}
            </Button>
          </form>
        )}

        <div className={styles.links}>
          <span>
            Already have an account? <Link to="/sign-in">Sign in</Link>
          </span>
        </div>
      </div>
    </div>
  );
}
