// Sign-in page: email/password authentication.
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage/ErrorMessage";
import styles from "@/pages/auth/authForm.module.css";

export function SignInPage() {
  const { signInWithPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await signInWithPassword(email, password);
    setSubmitting(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    const from = (location.state as { from?: string } | null)?.from;
    navigate(from ?? "/portal", { replace: true });
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.subtitle}>
          Access your projects and monitoring results.
        </p>

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

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className={styles.input}
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={submitting} className={styles.submit}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className={styles.links}>
          <Link to="/forgot-password">Forgot your password?</Link>
          <span>
            No account yet? <Link to="/sign-up">Create one</Link>
          </span>
        </div>
      </div>
    </div>
  );
}
