import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import AuthShell from "./AuthShell";
import FormField, { inputClass } from "../../components/ui/FormField";
import { confirmPasswordReset } from "../../services/authService";
import { ApiError } from "../../services/api";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(location.state?.email || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await confirmPasswordReset({ email, code, newPassword });
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reset password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <AuthShell title="Password reset" subtitle="You can now sign in with your new password.">
        <div className="flex flex-col items-center text-center py-4">
          <CheckCircle2 size={40} className="text-[var(--color-accent-teal)] mb-3" />
          <p className="text-[13.5px] text-[var(--color-ink-500)]">Redirecting you to sign in…</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Reset your password" subtitle="Enter the code we emailed you and choose a new password.">
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
        <FormField label="Reset code">
          <input
            required
            inputMode="numeric"
            maxLength={6}
            className={`${inputClass} tracking-[0.3em] text-center text-[18px] font-semibold`}
            placeholder="••••••"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
        </FormField>
        <FormField label="New password" error={newPassword && newPassword.length < 8 ? "At least 8 characters" : null}>
          <input
            type="password"
            required
            minLength={8}
            className={inputClass}
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
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
          {submitting ? <Loader2 size={17} className="animate-spin" /> : <KeyRound size={17} />}
          Reset Password
        </button>
      </form>

      <p className="text-[13px] text-[var(--color-ink-500)] text-center mt-6">
        <Link to="/forgot-password" className="font-semibold text-[var(--color-brand-600)]">
          Didn't get a code? Request another
        </Link>
      </p>
    </AuthShell>
  );
}
