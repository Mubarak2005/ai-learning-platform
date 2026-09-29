import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Send, Loader2 } from "lucide-react";
import AuthShell from "./AuthShell";
import FormField, { inputClass } from "../../components/ui/FormField";
import { requestPasswordReset } from "../../services/authService";
import { ApiError } from "../../services/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      navigate("/reset-password", { state: { email } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your account email and we'll send you a reset code."
    >
      <form onSubmit={handleSubmit}>
        <FormField label="Email">
          <input
            type="email"
            required
            className={inputClass}
            placeholder="you@stats.gov.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </FormField>

        {error && (
          <p className="text-[13px] text-[var(--color-accent-pink)] bg-[var(--color-accent-pink-soft)] rounded-xl px-3.5 py-2.5 mb-4">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--color-brand-600)] text-white font-semibold text-[14px] hover:bg-[var(--color-brand-700)] transition-colors disabled:opacity-60"
        >
          {submitting ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
          Send Reset Code
        </button>
      </form>

      <p className="text-[13px] text-[var(--color-ink-500)] text-center mt-6">
        Remembered your password?{" "}
        <Link to="/login" className="font-semibold text-[var(--color-brand-600)]">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
